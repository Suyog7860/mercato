import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import { btnPrimary } from '../components/ui.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'

export default function Wishlist() {
  const { items, loading, error, reload } = useWishlist()
  const { add } = useCart()
  const toast = useToast()
  const onAdd = (product) => {
    add(product)
    toast(`${product.name || product.title} added to your cart`)
  }

  return <>
    <p className="section-kicker text-cobalt">Saved for later</p>
    <h1 className="font-display mb-7 mt-2 text-3xl font-bold sm:text-4xl">Your wishlist</h1>
    {loading ? <p className="py-12 text-center text-mute">Loading your wishlist…</p> : error ? (
      <div className="rounded-xl border border-line bg-white p-8 text-center">
        <p role="alert">{error}</p><button className={`${btnPrimary} mt-4`} onClick={reload}>Try again</button>
      </div>
    ) : items.length ? (
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
        {items.map((product) => <ProductCard key={product._id} product={product} category={product.category} onAdd={onAdd} />)}
      </div>
    ) : (
      <div className="rounded-2xl border border-line bg-white px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold">Nothing saved yet.</p>
        <p className="mt-2 text-mute">Tap the heart on a product to keep it here.</p>
        <Link to="/shop" className={`${btnPrimary} mt-6`}>Explore the collection</Link>
      </div>
    )}
  </>
}
