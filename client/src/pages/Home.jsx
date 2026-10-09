import { useCallback, useDeferredValue, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import { Icon } from '../components/icons.jsx'
import { ProductSkeleton, btnGhost } from '../components/ui.jsx'
import { useProducts } from '../context/ProductsContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { large, productImage } from '../utils.js'
import api, { errMsg } from '../api.js'

const PAGE = 20

export default function Home({ catalogOnly = false, defaultGender = '' }) {
  const { products: highlights, categories, catName } = useProducts()
  const { add } = useCart()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [q, setQ] = useState(searchParams.get('search') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [gender, setGender] = useState(searchParams.get('gender') || defaultGender)
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [rating, setRating] = useState(searchParams.get('rating') || '')
  const [stock, setStock] = useState(searchParams.get('stock') || 'all')
  const [sort, setSort] = useState(searchParams.get('sort') || 'featured')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [reloadKey, setReloadKey] = useState(0)
  const [catalog, setCatalog] = useState({ products: [], currentPage: 1, totalPages: 0, totalProducts: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const deferredSearch = useDeferredValue(search.trim())

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(q.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [q])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const params = { page, limit: PAGE, sort }
    if (deferredSearch) params.search = deferredSearch
    if (gender) params.gender = gender
    if (category) params.category = category
    if (minPrice) params.minPrice = minPrice
    if (maxPrice) params.maxPrice = maxPrice
    if (rating) params.rating = rating
    if (stock !== 'all') params.stock = stock

    setLoading(true)
    setError('')
    api.get('/api/products', { params, signal: controller.signal })
      .then(({ data }) => { if (active) setCatalog(data) })
      .catch((err) => { if (active && err.code !== 'ERR_CANCELED') setError(errMsg(err)) })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false; controller.abort() }
  }, [deferredSearch, gender, category, minPrice, maxPrice, rating, stock, sort, page, reloadKey])

  useEffect(() => {
    const params = new URLSearchParams()
    if (deferredSearch) params.set('search', deferredSearch)
    if (gender) params.set('gender', gender)
    if (category) params.set('category', category)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (rating) params.set('rating', rating)
    if (stock !== 'all') params.set('stock', stock)
    if (sort !== 'featured') params.set('sort', sort)
    if (page > 1) params.set('page', String(page))
    setSearchParams(params, { replace: true })
  }, [deferredSearch, gender, category, minPrice, maxPrice, rating, stock, sort, page, setSearchParams])

  const change = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const onAdd = useCallback(
    (product) => {
      add(product)
      toast(`${product.name || product.title} added to your cart`)
    },
    [add, toast]
  )

  const jumpToProducts = (selectedCategory = '') => {
    setCategory(selectedCategory)
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })
  }
  const featured = highlights.slice(0, 3)
  const heroProduct = highlights[0]
  const list = catalog.products || []

  return (
    <div className="space-y-16 sm:space-y-24">
      {!catalogOnly && (
      <section className="relative isolate grid min-h-[470px] overflow-hidden rounded-[28px] bg-[#352a20] text-white sm:min-h-[530px] md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative z-10 flex flex-col items-start justify-center px-7 py-12 sm:px-12 md:px-14">
          <span className="section-kicker text-[#e0c6a5]">The everyday edit</span>
          <h1 className="font-display mt-5 max-w-xl text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Style made
            <br />
            for every day.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
            A considered collection of thoughtful details, good materials, and pieces made for wherever life takes you.
          </p>
          <a
            href="#shop"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#f3e8d8] px-6 py-3.5 text-sm font-bold text-[#302319] transition hover:bg-white"
          >
            Explore the collection <span aria-hidden="true">↗</span>
          </a>
          <div className="mt-3 flex gap-2">
            <a href="/men" className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Shop Men</a>
            <a href="/women" className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Shop Women</a>
          </div>
          <p className="mt-10 text-xs font-medium tracking-wide text-white/55">
            NEW SEASON · NEW PERSPECTIVE
          </p>
        </div>
        {heroProduct && productImage(heroProduct) ? (
          <div className="absolute inset-0 -z-0 md:static md:inset-auto md:z-0">
            <img
              src={large(productImage(heroProduct), 1200)}
              alt={heroProduct.name || heroProduct.title}
              fetchPriority="high"
              className="h-full w-full object-cover opacity-45 md:opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#352a20] via-[#352a20]/65 to-transparent md:bg-gradient-to-r md:from-transparent md:via-[#352a20]/10 md:to-transparent" />
            <div className="absolute bottom-6 right-6 hidden rounded-full border border-white/40 bg-black/15 px-4 py-2 text-xs font-medium text-white backdrop-blur md:block">
              Shop the latest drop ↗
            </div>
          </div>
        ) : (
          <div className="absolute inset-y-0 right-0 -z-0 hidden w-1/2 bg-[radial-gradient(ellipse_at_center,_#947958_0%,_#594432_40%,_#352a20_72%)] md:block" />
        )}
      </section>

      )}
      {!catalogOnly && (
      <section id="collections" className="scroll-mt-28">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-kicker text-cobalt">Find your fit</p>
            <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">A little something for every day.</h2>
          </div>
          <button
            onClick={() => jumpToProducts()}
            className="text-sm font-semibold text-mute transition hover:text-ink"
          >
            Explore all shoes <span aria-hidden="true">↗</span>
          </button>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {['Watches', 'Goggles', 'Hats', 'Shoes', 'Shirts', 'Pants'].map((item) => (
            <button key={item} onClick={() => jumpToProducts(item)} className="rounded-full border border-line bg-white px-3 py-3 text-sm font-semibold transition hover:border-cobalt hover:text-cobalt">{item}</button>
          ))}
        </div>
        {featured.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((product, index) => (
              <button
                key={product._id}
                onClick={() => jumpToProducts(product.category)}
                className={`group relative isolate min-h-64 overflow-hidden rounded-2xl bg-[#e6e0d6] text-left sm:min-h-80 ${
                  index === 0 ? 'md:col-span-1 md:row-span-2 md:min-h-[500px]' : ''
                }`}
              >
                {productImage(product) && (
                  <img
                    src={large(productImage(product), 720)}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 -z-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                <span className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="section-kicker text-white/70">{catName(product.category) || 'The collection'}</span>
                  <span className="font-display mt-1 flex items-center justify-between gap-3 text-2xl font-semibold sm:text-3xl">
                    <span className="line-clamp-1">{product.name || product.title}</span>
                    <span aria-hidden="true" className="shrink-0 text-xl">↗</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-white p-8 text-center text-mute">
            New collection edits are on the way.
          </div>
        )}
      </section>
      )}

      <section id="shop" className="scroll-mt-28">
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker text-cobalt">Made for your rotation</p>
            <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
              {gender ? `${gender}'s collection.` : 'The latest and greatest.'}
            </h2>
            <p className="mt-2 text-sm text-mute">Good-looking pairs. Ready for wherever.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Categories">
              <button
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  !category ? 'bg-ink text-white' : 'border border-line bg-white hover:border-ink'
                }`}
                onClick={() => change(setCategory)('')}
              >
                All pairs
              </button>
              {categories.map((categoryItem) => (
                <button
                  key={categoryItem._id}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    category === categoryItem.name ? 'bg-ink text-white' : 'border border-line bg-white hover:border-ink'
                  }`}
                  onClick={() => change(setCategory)(categoryItem.name)}
                >
                  {categoryItem.name}
                </button>
              ))}
            </div>
            <label className="flex shrink-0 items-center gap-2 text-sm text-mute">
              <span className="sr-only">Sort products</span>
              <select
                value={sort}
                onChange={(event) => change(setSort)(event.target.value)}
                className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-cobalt"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="popular">Most loved</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
            </label>
          </div>
        </div>

        <label className="relative mb-7 block max-w-xl">
          <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-mute" />
          <input
            type="search"
            value={q}
            onChange={(event) => { setQ(event.target.value); setPage(1) }}
            placeholder="Search by name, brand, category, or gender"
            aria-label="Search products"
            className="w-full rounded-full border border-line bg-white py-3.5 pl-12 pr-5 text-sm outline-none transition placeholder:text-mute focus:border-cobalt focus:ring-4 focus:ring-cobalt/10"
          />
        </label>

        <div className="mb-6 grid grid-cols-2 gap-3 rounded-2xl bg-[#f0ede8] p-4 sm:grid-cols-3 lg:grid-cols-6">
          <label className="text-xs font-semibold text-mute">Gender
            <select value={gender} onChange={(event) => change(setGender)(event.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink">
              <option value="">All</option><option value="Men">Men</option><option value="Women">Women</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-mute">Min price
            <input type="number" min="0" value={minPrice} onChange={(event) => change(setMinPrice)(event.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink" placeholder="₹0" />
          </label>
          <label className="text-xs font-semibold text-mute">Max price
            <input type="number" min="0" value={maxPrice} onChange={(event) => change(setMaxPrice)(event.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink" placeholder="No limit" />
          </label>
          <label className="text-xs font-semibold text-mute">Rating
            <select value={rating} onChange={(event) => change(setRating)(event.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink">
              <option value="">Any rating</option><option value="4">4+ stars</option><option value="3">3+ stars</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-mute">Availability
            <select value={stock} onChange={(event) => change(setStock)(event.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink">
              <option value="all">All</option><option value="in">In stock</option><option value="out">Out of stock</option>
            </select>
          </label>
          <button onClick={() => { setGender(''); setCategory(''); setMinPrice(''); setMaxPrice(''); setRating(''); setStock('all'); setSort('featured'); setQ(''); setSearch(''); setPage(1) }} className="self-end rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-semibold transition hover:border-cobalt hover:text-cobalt">Clear filters</button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-line bg-white p-8 text-center">
            <p className="font-semibold">We couldn't load the collection.</p>
            <p className="mt-1 text-sm text-mute">{error}. Check that the server is running.</p>
            <button onClick={() => setReloadKey((value) => value + 1)} className={`${btnGhost} mt-4`}>Try again</button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => <ProductSkeleton key={index} />)}
          </div>
        ) : list.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-2xl font-semibold">No pairs found just yet.</p>
            <p className="mt-1 text-mute">Try another search or explore all shoes.</p>
            {(q || category || gender) && (
              <button onClick={() => { setQ(''); setSearch(''); setCategory(''); setGender(''); setPage(1) }} className={`${btnGhost} mt-5`}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-mute">{catalog.totalProducts} thoughtfully selected styles</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
              {list.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  category={catName(product.category)}
                  onAdd={onAdd}
                />
              ))}
            </div>
            {catalog.totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Product pages">
                <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className={btnGhost}>Previous</button>
                <span className="text-sm text-mute">Page {page} of {catalog.totalPages}</span>
                <button disabled={page >= catalog.totalPages} onClick={() => setPage((value) => value + 1)} className={btnGhost}>Next</button>
              </nav>
            )}
          </>
        )}
      </section>

      {!catalogOnly && <section className="grid gap-6 rounded-2xl bg-[#eee8df] px-6 py-8 sm:grid-cols-3 sm:gap-8 sm:px-10 sm:py-10">
        {[
          ['01', 'Picked with purpose', 'A considered edit of pairs worth wearing on repeat.'],
          ['02', 'Checkout, your way', 'Choose a payment option at checkout, including cash on delivery.'],
          ['03', 'Here for the long run', 'Keep your orders and delivery updates together in one place.'],
        ].map(([number, title, description]) => (
          <div key={number} className="border-b border-[#d7cec2] pb-5 last:border-0 last:pb-0 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-7 sm:last:border-0">
            <span className="section-kicker text-cobalt">{number}</span>
            <h3 className="font-display mt-2 text-xl font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mute">{description}</p>
          </div>
        ))}
      </section>}
    </div>
  )
}
