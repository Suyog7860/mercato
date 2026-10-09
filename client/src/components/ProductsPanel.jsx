import { useCallback, useEffect, useState } from 'react'
import api, { errMsg } from '../api.js'
import { Icon } from './icons.jsx'
import { Modal, btnGhost, btnPrimary, inputCls } from './ui.jsx'
import { useProducts } from '../context/ProductsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { money, productImage, productImages, thumb } from '../utils.js'

const EMPTY = { product_id: '', name: '', brand: '', gender: 'Men', price: '', discountPrice: '', stock: '1', description: '', content: '', category: '', images: [], featured: false }

function ProductForm({ initial, categories, onClose, onSaved }) {
  const editing = Boolean(initial)
  const [f, setF] = useState(() =>
    initial
      ? {
          ...initial,
          discountPrice: initial.discountPrice == null ? '' : String(initial.discountPrice),
          price: String(initial.price),
          stock: String(initial.stock ?? 0),
          images: productImages(initial),
          category: categories.find((c) => c._id === initial.category || c.name === initial.category)?.name ?? initial.category,
        }
      : EMPTY
  )
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }))

  const upload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) return setError('Use a JPG or PNG image.')
    if (file.size > 5 * 1024 * 1024) return setError('The image must be under 5 MB.')
    setError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file) // the server reads req.files.file
      const { data } = await api.post('/api/upload', fd)
      setF((v) => ({ ...v, images: [data] }))
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (f.images.length !== 1) return setError('Upload exactly one product image.')
    setBusy(true)
    setError('')
    const slug = f.product_id.trim() || `${f.gender}-${f.category}-${f.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const body = {
      ...(editing ? {} : { product_id: slug, slug }),
      name: f.name.trim(),
      brand: f.brand.trim(),
      gender: f.gender,
      price: Number(f.price),
      discountPrice: f.discountPrice === '' ? null : Number(f.discountPrice),
      stock: Number(f.stock),
      description: f.description.trim(),
      content: f.content.trim(),
      category: f.category,
      images: f.images,
      featured: f.featured,
    }
    try {
      if (editing) await api.put(`/api/products/${initial._id}`, body)
      else await api.post('/api/products', body)
      onSaved(editing ? 'Product updated' : 'Product created')
    } catch (err) {
      setError(errMsg(err))
      setBusy(false)
    }
  }

  const label = 'mb-1.5 block text-sm font-semibold'

  return (
    <Modal title={editing ? 'Edit product' : 'New product'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-paper">
            {productImage({ images: f.images }) ? (
              <img src={thumb(productImage({ images: f.images }), 200)} alt="Product preview" className="h-full w-full object-cover" />
            ) : (
              <Icon name="upload" className="h-6 w-6 text-mute" />
            )}
          </div>
          <label className={`${btnGhost} cursor-pointer`}>
            {uploading ? 'Uploading…' : f.images.length ? 'Replace image' : 'Upload image'}
            <input type="file" accept="image/jpeg,image/png" onChange={upload} disabled={uploading} className="sr-only" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={label}>Product slug (optional)</span>
            <input className={inputCls} value={f.product_id} onChange={set('product_id')} disabled={editing} placeholder="Generated from gender and name" />
          </label>
          <label>
            <span className={label}>Regular price (₹)</span>
            <input className={inputCls} type="number" min="0" step="0.01" value={f.price} onChange={set('price')} required />
          </label>
        </div>
        <label className="block">
          <span className={label}>Product name</span>
          <input className={inputCls} value={f.name} onChange={set('name')} required />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={label}>Brand</span>
            <input className={inputCls} value={f.brand} onChange={set('brand')} required />
          </label>
          <label>
            <span className={label}>Gender</span>
            <select className={inputCls} value={f.gender} onChange={set('gender')}><option>Men</option><option>Women</option></select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={label}>Discounted price (₹)</span>
            <input className={inputCls} type="number" min="0" step="0.01" value={f.discountPrice} onChange={set('discountPrice')} />
          </label>
          <label>
            <span className={label}>Stock</span>
            <input className={inputCls} type="number" min="0" max="1000000" step="1" value={f.stock} onChange={set('stock')} required />
          </label>
        </div>
        <label className="block">
          <span className={label}>Category</span>
          <select className={inputCls} value={f.category} onChange={set('category')} required>
            <option value="">Choose a category</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={label}>Short description</span>
          <textarea className={inputCls} rows={2} value={f.description} onChange={set('description')} required />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={f.featured} onChange={(event) => setF((value) => ({ ...value, featured: event.target.checked }))} />
          Feature this product on the storefront
        </label>
        <label className="block">
          <span className={label}>Details</span>
          <textarea className={inputCls} rows={4} value={f.content} onChange={set('content')} required />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
        <button className={`${btnPrimary} w-full`} disabled={busy || uploading}>
          {busy ? 'Saving…' : 'Save product'}
        </button>
      </form>
    </Modal>
  )
}

export default function ProductsPanel() {
  const { categories, reload: reloadStorefront, catName } = useProducts()
  const toast = useToast()
  const [editing, setEditing] = useState(null) // null | 'new' | product
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (signal) => {
    setError('')
    try {
      const { data } = await api.get('/api/products', { params: { limit: 100, page, sort: 'newest' }, signal })
      setProducts(data.products)
      setTotalPages(data.totalPages)
      setTotalProducts(data.totalProducts)
      if (page > Math.max(data.totalPages, 1)) setPage(Math.max(data.totalPages, 1))
    } catch (err) {
      if (err.code !== 'ERR_CANCELED') setError(errMsg(err))
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [page])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const onSaved = async (msg) => {
    setEditing(null)
    await Promise.all([load(), reloadStorefront()])
    toast(msg)
  }

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name || p.title}"? This can't be undone.`)) return
    try {
      await api.delete(`/api/products/${p._id}`)
      await Promise.all([load(), reloadStorefront()])
      toast('Product deleted')
    } catch (e) {
      toast(errMsg(e), 'error')
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-mute">{totalProducts} products</p>
        <button className={btnPrimary} onClick={() => setEditing('new')}>
          <Icon name="plus" className="h-4 w-4" /> New product
        </button>
      </div>

      {error ? <p role="alert" className="rounded-xl border border-line bg-white p-8 text-center">{error}</p> : loading ? <p className="py-12 text-center text-mute">Loading products…</p> : products.length === 0 ? (
        <p className="rounded-xl border border-line bg-white p-8 text-center text-mute">
          No products yet. Create your first one.
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
          {products.map((p) => (
            <li key={p._id} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
              <img
                src={thumb(productImage(p), 120)}
                alt=""
                width="56"
                height="56"
                loading="lazy"
                className="h-14 w-14 shrink-0 rounded-lg bg-line/60 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold capitalize">{p.name || p.title}</p>
                <p className="truncate text-sm text-mute">
                  {p.brand} · {p.gender} · {catName(p.category)} · {money(p.discountPrice ?? p.price)} · {p.stock} in stock
                </p>
              </div>
              <button onClick={() => setEditing(p)} aria-label={`Edit ${p.name || p.title}`} className="rounded-lg p-2 hover:bg-ink/5">
                <Icon name="edit" />
              </button>
              <button
                onClick={() => remove(p)}
                aria-label={`Delete ${p.name || p.title}`}
                className="rounded-lg p-2 hover:bg-red-50 hover:text-red-600"
              >
                <Icon name="trash" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && <nav className="mt-5 flex items-center justify-center gap-3" aria-label="Admin product pages">
        <button className={btnGhost} disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
        <span className="text-sm text-mute">Page {page} of {totalPages}</span>
        <button className={btnGhost} disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
      </nav>}

      {editing && (
        <ProductForm
          initial={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
    </>
  )
}
