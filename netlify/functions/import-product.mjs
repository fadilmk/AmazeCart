const ALLOWED_HOSTS = new Set(['www.flipkart.com','flipkart.com','dl.flipkart.com','www.meesho.com','meesho.com','www.amazon.in','amazon.in','amzn.in']);
const json = (statusCode, body) => ({ statusCode, headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' }, body: JSON.stringify(body) });
const decode = s => String(s || '').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
const clean = s => decode(String(s || '').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ')).trim();
function findContent(v,d=0){if(d>8||v==null)return '';if(typeof v==='string')return v;if(Array.isArray(v)){for(const x of v){const s=findContent(x,d+1);if(s)return s;}return '';}if(typeof v==='object'){for(const k of ['content','html','markdown','text','body','data','results','result','response'])if(v[k]!=null){const s=findContent(v[k],d+1);if(s)return s;}}return '';}
function meta(h,k){const tags=h.match(/<meta\b[^>]*>/gi)||[];for(const tag of tags){const key=(tag.match(/(?:property|name)=["']([^"']+)["']/i)||[])[1];if(key===k){const value=(tag.match(/content=["']([^"']*)["']/i)||[])[1];if(value)return clean(value);}}return '';}
function getProduct(h){const ss=h.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi)||[];for(const s of ss){try{const x=JSON.parse(s.replace(/^.*?>/s,'').replace(/<\/script>$/i,''));const q=Array.isArray(x)?[...x]:[x];while(q.length){const n=q.shift();if(!n||typeof n!=='object')continue;if(Array.isArray(n)){q.push(...n);continue;}if(n['@graph'])q.push(...n['@graph']);if((Array.isArray(n['@type'])?n['@type']:[n['@type']]).includes('Product'))return n;}}catch{}}return {};}
function extract(h,url){
 const p=getProduct(h),o=Array.isArray(p.offers)?p.offers[0]||{}:p.offers||{};
 let name=clean(p.name||meta(h,'og:title')||meta(h,'twitter:title')||(h.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||(h.match(/^\s*#\s+(.+)$/m)||[])[1]||'').replace(/^Buy\s+/i,'').replace(/\s*(?:\||-)\s*Amazon\.in\s*$/i,'').trim();
 const description=clean(p.description||meta(h,'og:description')||meta(h,'description')||(h.match(/^\s*#.*\n+([^#\n][^\n]+)/m)||[])[1]||'').slice(0,420);
 const candidates=[];
 const add=(value,priority=0,alt='',w=0,ht=0)=>{
  const vals=Array.isArray(value)?value:[value];
  for(let v of vals){
   if(v&&typeof v==='object')v=v.url||v.contentUrl||v.src;
   if(typeof v!=='string')continue;
   v=decode(v.trim()).replace(/^\/\//,'https://');
   if(!/^https:\/\//i.test(v))continue;
   if(/(?:logo|sprite|icon|avatar|profile|placeholder|banner|storefront|seller|qr[-_]?code)/i.test(v))continue;
   if((w&&w<300)||(ht&&ht<300))continue;
   if(/(?:\b(?:80|100|120|150|160|200)x(?:80|100|120|150|160|200)\b|thumbnail|thumb|small)/i.test(v))continue;
   if(/(^|\.)m\.media-amazon\.com\//i.test(v))v=v.replace(/\._(?:AC|SX|SY|UX|UY|SS)[^.]*?(?=\.)/i,'._SL1500_');
   const score=priority+(alt&&name&&alt.toLowerCase().includes(name.toLowerCase().slice(0,18))?3:0)+(w>=600||ht>=600?2:0);
   candidates.push({url:v,score});
  }
 };
 const isMeesho=/meesho\.com$/i.test(new URL(url).hostname);
 if(isMeesho){
  // Meesho's Product JSON-LD image array represents the product gallery.
  // Do not mix in og:image, page banners, recommendation tiles, or arbitrary <img> tags.
  add(p.image,20);
 }else{
  add(p.image,12);add(meta(h,'og:image'),10);add(meta(h,'og:image:secure_url'),9);add(meta(h,'twitter:image'),8);
  for(const m of h.matchAll(/<img\b[^>]*>/gi)){
   const tag=m[0],attrs={};
   for(const a of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))attrs[a[1].toLowerCase()]=a[2]??a[3]??'';
   const src=attrs.src||attrs['data-src']||attrs['data-lazy-src']||attrs['data-original'];
   const width=Number(attrs.width)||0,height=Number(attrs.height)||0;
   add(src,5,attrs.alt,width,height);
   if(attrs.srcset)for(const item of attrs.srcset.split(',')){const bits=item.trim().split(/\s+/);add(bits[0],6,attrs.alt,width,height);}
  }
  for(const m of h.matchAll(/data-old-hires=["']([^"']+)["']/gi))add(m[1],11);
  for(const m of h.matchAll(/data-a-dynamic-image=["']([^"']+)["']/gi)){try{add(Object.keys(JSON.parse(m[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&'))),11);}catch{}}
  for(const m of h.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g))add(m[1],4);
 }
 const seen=new Set(),images=candidates.sort((a,b)=>b.score-a.score).filter(x=>{
  if(seen.has(x.url))return false;seen.add(x.url);return true;
 }).slice(0,6).map(x=>{
  if(isMeesho){
   try{const u=new URL(x.url);if(u.searchParams.has('width'))u.searchParams.set('width','1200');return u.toString();}catch{}
  }
  return x.url;
 }); let price=Number(o.price||o.lowPrice||0)||'';
 if(!price){const v=meta(h,'product:price:amount')||(h.match(/(?:₹|INR)\s*([\d,]+(?:\.\d{1,2})?)/i)||[])[1];price=Number(String(v||'').replace(/,/g,''))||'';}
 return {name,description,images,price,originalPrice:'',platform:url.includes('meesho')?'Meesho':url.includes('flipkart')?'Flipkart':'Amazon',productUrl:url,source:'decodo'};
}
export const handler=async event=>{if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed.'});try{const body=JSON.parse(event.body||'{}'),raw=String(body.url||'').trim();if(!raw||raw.length>2048)return json(400,{error:'Enter a valid product URL.'});let target;try{target=new URL(raw);}catch{return json(400,{error:'Enter a valid product URL.'});}if(target.protocol!=='https:'||!ALLOWED_HOSTS.has(target.hostname.toLowerCase()))return json(400,{error:'Only HTTPS Flipkart, Meesho or Amazon India links are supported.'});const key=process.env.DECODO_AUTH_TOKEN;if(!key)return json(503,{error:'Decodo is not configured. Add DECODO_AUTH_TOKEN in Netlify environment variables, then redeploy.'});const r=await fetch('https://data.decodo.com/v1/scrape',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},body:JSON.stringify({target:'universal',url:target.toString(),headless:'html',markdown:true}),signal:AbortSignal.timeout(55000)});const rawResult=await r.text();let payload;try{payload=JSON.parse(rawResult);}catch{payload=rawResult;}if(!r.ok){const msg=typeof payload==='object'?(payload.message||payload.error||payload.detail):'';return json(502,{error:msg?'Decodo error: '+String(msg).slice(0,240):'Decodo returned HTTP '+r.status+'. Check your API key and plan.'});}const content=findContent(payload);if(!content)return json(422,{error:'Decodo responded, but no page content was found. The response format needs inspection.'});const result=extract(content,target.toString());if(!result.name&&!result.images.length&&!result.description&&!result.price)return json(422,{error:'The page was retrieved, but product details could not be identified. Enter the missing details manually.'});return json(200,result);}catch(e){return json(502,{error:e.name==='TimeoutError'?'Decodo took too long. Try again.':'Product import failed. Please retry or enter details manually.'});}};
