import { collection, getDocs, query, where, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc, increment } from 'firebase/firestore'
import { db, firebaseReady, auth, adminUid } from './firebase'

export const demoCategories = [
  { id: 'fashion', name: 'Fashion', icon: '👕', active: true },
  { id: 'home', name: 'Home & Living', icon: '🏡', active: true },
  { id: 'beauty', name: 'Beauty', icon: '✨', active: true },
  { id: 'electronics', name: 'Electronics', icon: '🎧', active: true },
  { id: 'kitchen', name: 'Kitchen', icon: '🍳', active: true },
  { id: 'accessories', name: 'Accessories', icon: '👜', active: true },
]

export const demoProducts = [
  { id:'p1', name:'Minimal Everyday Tote Bag', slug:'minimal-everyday-tote-bag', description:'A versatile everyday tote for college, work and casual outings.', categoryId:'fashion', images:['https://images.unsplash.com/photo-1544816155-12df9643f363?w=900'], featured:true, published:true, popularityScore:94, createdAt:Date.now()-10000, offers:[{id:'o1',platform:'Meesho',price:189,originalPrice:399,affiliateUrl:'https://www.meesho.com/',active:true},{id:'o2',platform:'Amazon',price:249,originalPrice:499,affiliateUrl:'https://www.amazon.in/',active:true}] },
  { id:'p2', name:'Compact Desk Organiser', slug:'compact-desk-organiser', description:'Keep your study table neat with this compact organiser.', categoryId:'home', images:['https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=900'], featured:true, published:true, popularityScore:88, createdAt:Date.now()-20000, offers:[{id:'o3',platform:'Amazon',price:179,originalPrice:299,affiliateUrl:'https://www.amazon.in/',active:true},{id:'o4',platform:'Flipkart',price:199,originalPrice:349,affiliateUrl:'https://www.flipkart.com/',active:true}] },
  { id:'p3', name:'Wireless Earbuds Case', slug:'wireless-earbuds-case', description:'Protective case with a clean minimal finish.', categoryId:'electronics', images:['https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=900'], featured:true, published:true, popularityScore:82, createdAt:Date.now()-30000, offers:[{id:'o5',platform:'Meesho',price:89,originalPrice:199,affiliateUrl:'https://www.meesho.com/',active:true}] },
  { id:'p4', name:'Ceramic Coffee Mug', slug:'ceramic-coffee-mug', description:'A simple ceramic mug for your everyday coffee or tea.', categoryId:'kitchen', images:['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=900'], featured:false, published:true, popularityScore:75, createdAt:Date.now()-40000, offers:[{id:'o6',platform:'Meesho',price:149,originalPrice:249,affiliateUrl:'https://www.meesho.com/',active:true},{id:'o7',platform:'Amazon',price:169,originalPrice:299,affiliateUrl:'https://www.amazon.in/',active:true}] },
  { id:'p5', name:'Daily Skincare Pouch', slug:'daily-skincare-pouch', description:'A handy pouch to organise your daily essentials.', categoryId:'beauty', images:['https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=900'], featured:false, published:true, popularityScore:67, createdAt:Date.now()-50000, offers:[{id:'o8',platform:'Meesho',price:99,originalPrice:199,affiliateUrl:'https://www.meesho.com/',active:true}] },
  { id:'p6', name:'Classic Sunglasses', slug:'classic-sunglasses', description:'Everyday sunglasses with a timeless silhouette.', categoryId:'accessories', images:['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=900'], featured:false, published:true, popularityScore:61, createdAt:Date.now()-60000, offers:[{id:'o9',platform:'Flipkart',price:229,originalPrice:499,affiliateUrl:'https://www.flipkart.com/',active:true}] },
]

export async function loadCollection(name) {
  if (!firebaseReady) return name === 'products' ? demoProducts : name === 'categories' ? demoCategories : []
  const admin = auth?.currentUser && auth.currentUser.uid === adminUid
  const constraints = !admin && name === 'products' ? [where('published', '==', true)] : !admin && name === 'categories' ? [where('active', '==', true)] : !admin && name === 'deals' ? [where('active', '==', true)] : []
  const ref = collection(db, name)
  const snap = await getDocs(constraints.length ? query(ref, ...constraints) : ref)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
export async function saveDocument(name, id, data) {
  if (!firebaseReady) throw new Error('Connect Firebase first. See README.md.')
  if (id) { await setDoc(doc(db, name, id), data, { merge: true }); return id }
  const ref = await addDoc(collection(db, name), data); return ref.id
}
export async function removeDocument(name, id) {
  if (!firebaseReady) throw new Error('Connect Firebase first. See README.md.')
  await deleteDoc(doc(db, name, id))
}
export async function recordClick(productId, platform = 'product') {
  if (!firebaseReady) return
  try { await addDoc(collection(db, 'clicks'), { productId, platform, createdAt: Date.now() }) } catch (e) { console.warn('Click tracking unavailable', e) }
}
export function bestOffer(product) {
  return (product.offers || []).filter(o => o.active !== false && Number(o.price) > 0).sort((a,b) => Number(a.price)-Number(b.price))[0]
}
export function discount(offer) {
  if (!offer || !Number(offer.originalPrice) || Number(offer.originalPrice) <= Number(offer.price)) return 0
  return Math.round((1 - Number(offer.price)/Number(offer.originalPrice))*100)
}
