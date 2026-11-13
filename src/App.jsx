import React, {useMemo, useState} from 'react'
import {demoProducts,demoCategories} from './lib/data'
export default function App(){
 const [q,setQ]=useState(''); const [category,setCategory]=useState('All')
 const products=useMemo(()=>demoProducts.filter(p=>(category==='All'||p.category===category)&&p.name.toLowerCase().includes(q.toLowerCase())),[q,category])
 return <div className="app"><header><a className="brand" href="/">Amaze<span>Cart</span></a><input aria-label="Search products" placeholder="Search products..." value={q} onChange={e=>setQ(e.target.value)}/></header><main><section className="hero"><p>GOOD FINDS, GREAT PRICES</p><h1>Find your next <em>favourite thing.</em></h1><span>Explore handpicked products and discover deals worth saving.</span></section><nav className="categories"><button onClick={()=>setCategory('All')}>All</button>{demoCategories.map(c=><button key={c} onClick={()=>setCategory(c)}>{c}</button>)}</nav><h2>Curated finds</h2><section className="products">{products.map(p=><article key={p.id}><img src={p.image} alt={p.name}/><div><small>{p.category}</small><h3>{p.name}</h3><b>₹{p.price}</b><p>Available at {p.store}</p></div></article>)}</section>{!products.length&&<p>No products match your search.</p>}</main><footer>© {new Date().getFullYear()} AmazeCart · Discover more. Shop smarter.</footer></div>
}
