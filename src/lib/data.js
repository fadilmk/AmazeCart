import { collection, getDocs, query, where, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc, increment } from 'firebase/firestore'
import { db, firebaseReady, auth, adminUid } from './firebase'

export const demoCategories = [
  { id: 'gadgets', name: 'Smart Gadgets', icon: '⚡', active: true },
  { id: 'desk', name: 'Desk & Study', icon: '💻', active: true },
  { id: 'home', name: 'Home Essentials', icon: '🏠', active: true },
  { id: 'kitchen', name: 'Kitchen Finds', icon: '🍳', active: true },
  { id: 'personal-care', name: 'Personal Care', icon: '✨', active: true },
  { id: 'travel', name: 'Travel & Utility', icon: '🎒', active: true },
]

export const demoProducts = [
  { id:'p1', name:'Rechargeable Motion Sensor Light', slug:'rechargeable-motion-sensor-light', description:'A handy magnetic LED light for wardrobes, hallways and dark corners. USB rechargeable and easy to install.', categoryId:'home', images:['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=900'], featured:true, published:true, popularityScore:96, createdAt:Date.now()-10000, offers:[{id:'o1',platform:'Amazon',price:299,originalPrice:499,affiliateUrl:'https://www.amazon.in/',active:true},{id:'o2',platform:'Flipkart',price:329,originalPrice:499,affiliateUrl:'https://www.flipkart.com/',active:true}] },
  { id:'p2', name:'Foldable Adjustable Laptop Stand', slug:'foldable-adjustable-laptop-stand', description:'A portable stand that raises your laptop for a more comfortable desk setup. Folds flat for travel.', categoryId:'desk', images:['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=900'], featured:true, published:true, popularityScore:91, createdAt:Date.now()-20000, offers:[{id:'o3',platform:'Amazon',price:349,originalPrice:599,affiliateUrl:'https://www.amazon.in/',active:true},{id:'o4',platform:'Flipkart',price:379,originalPrice:649,affiliateUrl:'https://www.flipkart.com/',active:true}] },
  { id:'p3', name:'Compact Wireless Earbuds', slug:'compact-wireless-earbuds', description:'Compact everyday wireless audio for calls, commutes and music. Check the retailer listing for exact specifications.', categoryId:'gadgets', images:['https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=900'], featured:true, published:true, popularityScore:88, createdAt:Date.now()-30000, offers:[{id:'o5',platform:'Amazon',price:499,originalPrice:999,affiliateUrl:'https://www.amazon.in/',active:true}] },
  { id:'p4', name:'Digital Kitchen Weighing Scale', slug:'digital-kitchen-weighing-scale', description:'A compact kitchen helper for measuring ingredients and portion sizes.', categoryId:'kitchen', images:['https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=900'], featured:false, published:true, popularityScore:78, createdAt:Date.now()-40000, offers:[{id:'o6',platform:'Amazon',price:249,originalPrice:399,affiliateUrl:'https://www.amazon.in/',active:true},{id:'o7',platform:'Flipkart',price:269,originalPrice:449,affiliateUrl:'https://www.flipkart.com/',active:true}] },
  { id:'p5', name:'Portable Mini USB Desk Fan', slug:'portable-mini-usb-desk-fan', description:'A compact fan for a study table or work desk. Check product listing for speed and battery details.', categoryId:'desk', images:['https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=900'], featured:false, published:true, popularityScore:72, createdAt:Date.now()-50000, offers:[{id:'o8',platform:'Meesho',price:199,originalPrice:349,affiliateUrl:'https://www.meesho.com/',active:true}] },
  { id:'p6', name:'Travel Cable Organiser Pouch', slug:'travel-cable-organiser-pouch', description:'Keep charging cables, adapters and small accessories together while travelling.', categoryId:'travel', images:['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900'], featured:false, published:true, popularityScore:69, createdAt:Date.now()-60000, offers:[{id:'o9',platform:'Amazon',price:159,originalPrice:299,affiliateUrl:'https://www.amazon.in/',active:true}] },
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
