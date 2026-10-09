import { memo } from 'react'
import { Link } from 'react-router-dom'
import { money, productImage, thumb } from '../utils.js'
import { Icon } from './icons.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

// memo + stable props (primitives and a useCallback handler) = cards skip re-rendering
// when the search box or cart changes.
const ProductCard = memo(function ProductCard({ product, category, onAdd }) {
  const to = `/product/${product._id}`
  const { has, toggle } = useWishlist()
  const toast = useToast()
  const wished = has(product._id)
  const image = productImage(product)
  const price = product.discountPrice ?? product.price
  const discountPercent = product.discountPrice
    ? Math.round((1 - product.discountPrice / product.price) * 100)
    : 0
  return (
    <article className="group flex min-w-0 flex-col">
      <div className="relative block aspect-[0.92] overflow-hidden rounded-2xl bg-[#f0ede8]">
      <Link to={to} aria-label={`View ${product.name || product.title}`} className="absolute inset-0">
        <img
          src={thumb(image, 480)}
          alt={product.name || product.title}
          width="480"
          height="480"
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        {product.sold > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur">
            {product.sold} sold
          </span>
        )}
      </Link>
      <button
        type="button"
        aria-label={wished ? `Remove ${product.name || product.title} from wishlist` : `Add ${product.name || product.title} to wishlist`}
        aria-pressed={wished}
        onClick={async () => {
          try {
            await toggle(product)
            toast(wished ? 'Removed from your wishlist' : 'Added to your wishlist')
          } catch (error) {
            toast(error.message, 'error')
          }
        }}
        className={`absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 backdrop-blur transition hover:scale-105 ${wished ? 'text-red-600' : 'text-ink'}`}
      >
        <Icon name="heart" className="h-5 w-5" />
      </button>
      {discountPercent > 0 && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-[#352a20] px-3 py-1.5 text-[10px] font-bold text-white">
          -{discountPercent}%
        </span>
      )}
      </div>
      <div className="mt-3 flex flex-1 flex-col px-0.5">
        <p className="section-kicker truncate text-[9px] text-mute">{category || 'The everyday edit'}</p>
        <h3 className="mt-1 line-clamp-1 font-semibold capitalize">
          <Link to={to} className="hover:text-cobalt">
            {product.name || product.title}
          </Link>
        </h3>
        <p className="mt-1 truncate text-xs text-mute">{product.brand}</p>
        <p className="mt-1 text-xs text-[#a07643]">
          {'★'.repeat(Math.round(product.rating || 0))}{'☆'.repeat(5 - Math.round(product.rating || 0))}
          <span className="ml-1 text-mute">{Number(product.rating || 0).toFixed(1)} ({product.reviewsCount || 0})</span>
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span>
            <span className="font-display text-lg font-semibold">{money(price)}</span>
            {product.discountPrice && <span className="ml-2 text-xs text-mute line-through">{money(product.price)}</span>}
          </span>
          <button
            disabled={!product.stock}
            aria-label={`Add ${product.title} to shopping bag`}
            onClick={() => onAdd(product)}
            className="rounded-full bg-ink px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-cobalt active:scale-95 disabled:cursor-not-allowed disabled:bg-mute sm:px-4"
          >
            {product.stock > 0 ? 'Add' : 'Sold out'}
          </button>
        </div>
      </div>
    </article>
  )
})

export default ProductCard
