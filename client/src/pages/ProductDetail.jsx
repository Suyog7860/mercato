import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { errMsg } from '../api.js'
import ProductCard from '../components/ProductCard.jsx'
import { Icon } from '../components/icons.jsx'
import { inputCls, Spinner, btnPrimary } from '../components/ui.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { large, money, productImage } from '../utils.js'

export default function ProductDetail() {
  const { id } = useParams()
  const { add } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [qty, setQty] = useState(1)
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewError, setReviewError] = useState('')

  const load = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/api/products/${encodeURIComponent(id)}`, { signal })
      setProduct(data)
      setQty(1)
      const relatedResponse = await api.get('/api/products', {
        params: { category: data.category, limit: 5, sort: 'featured' },
        signal,
      })
      setRelated((relatedResponse.data.products || []).filter((item) => item._id !== data._id).slice(0, 4))
    } catch (err) {
      if (err.code !== 'ERR_CANCELED') setError(errMsg(err))
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const onAdd = useCallback(
    (p) => {
      add(p)
      toast(`${p.name || p.title} added to your cart`)
    },
    [add, toast]
  )

  const submitReview = async (event) => {
    event.preventDefault()
    if (!user) {
      navigate('/login', { state: { from: `/product/${id}` } })
      return
    }
    setReviewBusy(true)
    setReviewError('')
    try {
      const { data } = await api.post(`/api/products/${encodeURIComponent(id)}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
      })
      setProduct(data)
      setReviewComment('')
      toast('Your verified-purchase review was saved')
    } catch (err) {
      setReviewError(errMsg(err))
    } finally {
      setReviewBusy(false)
    }
  }

  if (loading) return <Spinner />
  if (error)
    return (
      <div className="py-24 text-center">
        <h1 className="font-display text-3xl font-bold">We couldn't load this product.</h1>
        <p className="mt-2 text-mute">{error}</p>
        <button onClick={() => load()} className={`${btnPrimary} mt-5`}>
          Try again
        </button>
      </div>
    )
  if (!product)
    return (
      <div className="py-24 text-center">
        <h1 className="font-display text-3xl font-bold">We can't find that product.</h1>
        <Link to="/" className="mt-4 inline-block font-semibold text-cobalt hover:underline">
          Back to the shop
        </Link>
      </div>
    )

  return (
    <>
      <nav className="flex items-center gap-2 text-sm text-mute" aria-label="Breadcrumb">
        <Link to="/" className="font-semibold transition hover:text-ink">Shop</Link>
        <span aria-hidden="true">/</span>
        <span>{product.category || 'Everyday edit'}</span>
      </nav>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div className="relative aspect-[0.95] overflow-hidden rounded-3xl bg-[#efebe5]">
          <img
            src={large(productImage(product), 900)}
            alt={product.name || product.title}
            width="900"
            height="900"
            decoding="async"
            loading="eager"
            className="h-full w-full object-cover"
          />
          <span className="section-kicker absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-ink backdrop-blur">
            Selected for you
          </span>
        </div>
        <div className="flex flex-col py-2 lg:py-8">
          <p className="section-kicker text-cobalt">{product.category || 'The everyday edit'}</p>
          <h1 className="font-display mt-3 text-4xl font-semibold capitalize leading-[1.08] sm:text-5xl">
            {product.name || product.title}
          </h1>
          <p className="mt-3 text-sm text-mute">{product.brand} · {product.gender}'s collection</p>
          <p className="mt-3 text-sm text-[#a07643]" aria-label={`${Number(product.rating || 0).toFixed(1)} out of 5 stars`}>
            {'★'.repeat(Math.round(product.rating || 0))}{'☆'.repeat(5 - Math.round(product.rating || 0))}
            <span className="ml-2 text-mute">{Number(product.rating || 0).toFixed(1)} ({product.reviewsCount || 0} reviews)</span>
          </p>
          <p className="font-display mt-5 text-2xl font-semibold">{money(product.discountPrice ?? product.price)}
            {product.discountPrice != null && <span className="ml-3 text-base text-mute line-through">{money(product.price)}</span>}
          </p>
          <p className="mt-6 max-w-prose leading-relaxed text-mute">{product.description}</p>
          {product.content && (
            <p className="mt-3 max-w-prose whitespace-pre-line leading-relaxed">{product.content}</p>
          )}
          <p className={`mt-5 text-sm font-semibold ${product.stock > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Currently out of stock'}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 border-y border-line py-6">
            <div className="flex items-center rounded-full border border-line bg-white">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="p-3 hover:text-cobalt"
              >
                <Icon name="minus" className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-semibold" aria-live="polite">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(99, Math.max(1, product.stock), q + 1))}
                disabled={qty >= product.stock || product.stock <= 0}
                aria-label="Increase quantity"
                className="p-3 hover:text-cobalt disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="plus" className="h-4 w-4" />
              </button>
            </div>
            <button
              className={`${btnPrimary} flex-1 rounded-full py-3.5 sm:flex-none sm:px-10`}
              disabled={!product.stock}
              onClick={() => {
                add(product, qty)
                toast(`${qty} × ${product.name || product.title} added to your cart`)
              }}
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>

      {product.reviews?.length > 0 && <section className="mt-12 border-t border-line pt-10">
        <h2 className="font-display mb-5 text-2xl font-semibold">Customer reviews</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {product.reviews.map((review) => <li key={review._id} className="rounded-xl border border-line bg-white p-4">
            <p className="text-[#a07643]" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
            <p className="mt-2 leading-relaxed">{review.comment || 'A verified customer shared a rating.'}</p>
            <p className="mt-3 text-xs text-mute">{review.name}{review.verifiedPurchase ? ' · Verified purchase' : ''}</p>
          </li>)}
        </ul>
      </section>}

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="font-display mb-4 text-2xl font-semibold">Share your experience</h2>
        <p className="mb-4 text-sm text-mute">Only customers with a delivered order can submit a verified review.</p>
        <form onSubmit={submitReview} className="max-w-2xl space-y-4 rounded-2xl border border-line bg-white p-5">
          <label className="block text-sm font-semibold">Your rating
            <select className={`${inputCls} mt-1.5`} value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))}>
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? '' : 's'}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Review (optional)
            <textarea className={`${inputCls} mt-1.5`} rows={4} maxLength={1500} value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="What did you think?" />
          </label>
          {reviewError && <p role="alert" className="text-sm text-red-700">{reviewError}</p>}
          <button className={btnPrimary} disabled={reviewBusy}>{reviewBusy ? 'Submitting…' : user ? 'Submit verified review' : 'Sign in to review'}</button>
        </form>
      </section>

      {related.length > 0 && (
        <section className="mt-20 border-t border-line pt-12">
          <p className="section-kicker text-cobalt">Keep exploring</p>
          <h2 className="font-display mb-6 mt-2 text-3xl font-semibold">Pairs that go with it.</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} category={p.category} onAdd={onAdd} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
