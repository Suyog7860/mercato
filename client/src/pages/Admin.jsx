import { useState } from 'react'
import ProductsPanel from '../components/ProductsPanel.jsx'
import AdminOrdersPanel from '../components/AdminOrdersPanel.jsx'
import AdminUsersPanel from '../components/AdminUsersPanel.jsx'
import AdminDashboard from '../components/AdminDashboard.jsx'
import { useProducts } from '../context/ProductsContext.jsx'

function CategoriesPanel() {
  const { categories } = useProducts()
  return (
    <div>
      <p className="mb-4 rounded-xl bg-tint p-4 text-sm text-cobalt">The storefront uses six fixed catalog categories so filters, product data, and navigation remain consistent.</p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => <li key={category._id} className="rounded-xl border border-line bg-white p-4 font-semibold">{category.name}</li>)}
      </ul>
    </div>
  )
}

export default function Admin() {
  const [tab, setTab] = useState('dashboard')
  const tabCls = (active) =>
    `rounded-lg px-4 py-2 text-sm font-semibold transition ${
      active ? 'bg-ink text-white' : 'text-mute hover:bg-ink/5 hover:text-ink'
    }`

  return (
    <>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Manage your store</h1>
      <div className="mb-6 mt-5 flex gap-1" role="tablist">
        <button role="tab" aria-selected={tab === 'dashboard'} className={tabCls(tab === 'dashboard')} onClick={() => setTab('dashboard')}>
          Overview
        </button>
        <button role="tab" aria-selected={tab === 'products'} className={tabCls(tab === 'products')} onClick={() => setTab('products')}>
          Products
        </button>
        <button role="tab" aria-selected={tab === 'categories'} className={tabCls(tab === 'categories')} onClick={() => setTab('categories')}>
          Categories
        </button>
        <button role="tab" aria-selected={tab === 'orders'} className={tabCls(tab === 'orders')} onClick={() => setTab('orders')}>
          Orders
        </button>
        <button role="tab" aria-selected={tab === 'users'} className={tabCls(tab === 'users')} onClick={() => setTab('users')}>
          Customers
        </button>
      </div>
      {tab === 'dashboard' ? <AdminDashboard /> : tab === 'products' ? <ProductsPanel /> : tab === 'categories' ? <CategoriesPanel /> : tab === 'orders' ? <AdminOrdersPanel /> : <AdminUsersPanel />}
    </>
  )
}
