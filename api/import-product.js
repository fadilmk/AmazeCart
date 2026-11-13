const ALLOWED_HOSTS = new Set([
  'www.flipkart.com','flipkart.com','dl.flipkart.com',
  'www.meesho.com','meesho.com',
  'www.amazon.in','amazon.in','amzn.in'
]);

function decodeEntities(value) {
  return value.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
function cleanText(value) {
  return typeof value === 'string' ? decodeEntities(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 5000) : '';
}
function cleanProductName(value) {
  return cleanText(value)
    .replace(/^Buy\s+/i, '')
    .replace(/\s*(?:\||-)\s*Online at Low Prices in India\s*(?:-|\|)\s*Amazon\.in\s*$/i, '')
    .replace(/\s*(?:\||-)\s*Amazon\.in\s*$/i, '')
    .trim();
}
function cleanDescription(value) {
  let text = cleanText(value);
  text = text.replace(/\s*(?:Free Shipping|Cash on Delivery Available|Visit the .*? Store).*$/i, '').trim();
  return text.slice(0, 420);
}
function meta(html, property) {
  const escaped = property;
  const patterns = [
    new RegExp("<meta\\b[^>]*(?:property|name)=[\"']" + escaped + "[\"'][^>]*content=[\"']([^\"']*)[\"'][^>]*>", 'i'),
    new RegExp("<meta\\b[^>]*content=[\"']([^\"']*)[\"'][^>]*(?:property|name)=[\"']" + escaped + "[\"'][^>]*>", 'i')
  ];
  for (const pattern of patterns) { const match = html.match(pattern); if (match) return cleanText(match[1]); }
  return '';
}
function structuredProduct(html) {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const script of scripts) {
    try {
      const raw = script.replace(/^.*?>/s, '').replace(/<\/script>$/i, '');
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      const queue = [...nodes];
      while (queue.length) {
        const node = queue.shift();
        if (!node || typeof node !== 'object') continue;
        if (Array.isArray(node)) { queue.push(...node); continue; }
        if (node['@graph']) queue.push(...node['@graph']);
        const type = node['@type'];
        if ((Array.isArray(type) ? type : [type]).includes('Product')) return node;
      }
    } catch {}
  }
  return null;
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' });
  try {
    const raw = String(req.body?.url || '').trim();
    if (!raw || raw.length > 2048) return res.status(400).json({error:'Enter a valid product URL.'});
    const target = new URL(raw);
    if (target.protocol !== 'https:' || !ALLOWED_HOSTS.has(target.hostname.toLowerCase())) return res.status(400).json({error:'Only HTTPS product links from Flipkart, Meesho or Amazon India are supported.'});
    const response = await fetch(target.toString(), {
      redirect:'follow',
      signal:AbortSignal.timeout(10000),
      headers:{'User-Agent':'Mozilla/5.0 (compatible; AmazeCartProductImporter/1.0)','Accept':'text/html,application/xhtml+xml'}
    });
    if (!response.ok) return res.status(422).json({error:'The retailer did not allow the product page to be fetched. Try an official affiliate feed or enter the details manually.'});
    const finalUrl = new URL(response.url);
    if (!ALLOWED_HOSTS.has(finalUrl.hostname.toLowerCase())) return res.status(400).json({error:'The product link redirected to an unsupported domain.'});
    const html = (await response.text()).slice(0, 2_000_000);
    const product = structuredProduct(html) || {};
    const offers = product.offers ? (Array.isArray(product.offers) ? product.offers[0] : product.offers) : {};
    const imageCandidates = [];
    const addImage = value => {
      if (typeof value === 'string') imageCandidates.push(value);
      else if (Array.isArray(value)) value.forEach(addImage);
      else if (value && typeof value === 'object') {
        addImage(value.url || value.contentUrl || value.src || value['@id']);
      }
    };
    addImage(product.image);
    for (const key of ['og:image','og:image:secure_url','twitter:image']) addImage(meta(html,key));
    // Amazon often exposes gallery images in attributes rather than Product JSON-LD.
    for (const match of html.matchAll(/data-old-hires=["']([^"']+)["']/gi)) addImage(match[1]);
    for (const match of html.matchAll(/data-a-dynamic-image=["']([^"']+)["']/gi)) {
      try { addImage(Object.keys(JSON.parse(match[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&')))); } catch {}
    }
    for (const match of html.matchAll(/(?:hiRes|large|mainUrl|landingImage)\s*[:=]\s*["'](https?:\\?\/\\?\/[^"'\\s]+)/gi)) addImage(match[1].replace(/\\\//g,'/'));
    const images = [...new Set(imageCandidates.map(v => v.replace(/&amp;/g,'&').trim()).filter(v => /^https:\/\//i.test(v)))].slice(0,8);
    const name = cleanProductName(product.name || meta(html,'og:title') || meta(html,'twitter:title') || cleanText((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||''));
    const description = cleanDescription(product.description || meta(html,'og:description') || meta(html,'description'));
    const price = Number(offers.price || offers.lowPrice || 0) || '';
    const currency = offers.priceCurrency || 'INR';
    const retailer = finalUrl.hostname.includes('flipkart') ? 'Flipkart' : finalUrl.hostname.includes('meesho') ? 'Meesho' : 'Amazon';
    if (!name && !images.length && !description) return res.status(422).json({error:'No product metadata was available. This retailer may block automated extraction; please enter the details manually.'});
    return res.status(200).json({name,description,images,price:currency==='INR'?price:'',originalPrice:'',platform:retailer,productUrl:finalUrl.toString(),source:'page-metadata'});
  } catch (error) {
    return res.status(422).json({error:error.name==='TimeoutError'?'The retailer took too long to respond. Try again or enter details manually.':'Could not read this product page. It may block automated access.'});
  }
}