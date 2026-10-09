import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/icons.jsx'
import { btnPrimary } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { money, thumb } from '../utils.js'

export default function Cart() {
  const { items, total, count, setQty, remove, clear } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  if (items.length === 0)
    return (
      <div className="py-24 text-center">
        <div className="rounded-3xl border border-line bg-white px-6 py-20 text-center">
        <p className="section-kicker text-cobalt">A fresh pair is calling</p>
        <h1 className="font-display mt-3 text-3xl font-semibold">Your bag is taking a breather.</h1>
        <p className="mt-2 text-mute">Find a pair that feels like you.</p>
        <Link to="/" className={`${btnPrimary} mt-6 rounded-full`}>
          Explore the collection
        </Link>
        </div>
      </div>
    )

  const checkout = () => {
    if (!user) return navigate('/login', { state: { from: '/cart' } })
    navigate('/checkout')
  }

  return (
    <>
      <div className="mb-7 flex items-end justify-between">
        <div>
        <p className="section-kicker text-cobalt">Your good choices</p>
        <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">Your shopping bag.</h1>
        </div>
        <button onClick={clear} className="text-sm font-semibold text-mute transition hover:text-red-600">
          Clear bag
        </button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_370px]">
        <ul className="divide-y divide-line rounded-3xl border border-line bg-white px-4 sm:px-6">
          {items.map((i) => (
            <li key={i._id} className="flex gap-4 py-5 sm:gap-5">
              <img
                src={thumb(i.image, 160)}
                alt=""
                width="96"
                height="96"
                loading="lazy"
                className="h-24 w-24 shrink-0 rounded-2xl bg-[#f0ede8] object-cover sm:h-28 sm:w-28"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="line-clamp-2 font-semibold capitalize">{i.title}</h2>
                  <button
                    onClick={() => remove(i._id)}
                    aria-label={`Remove ${i.title}`}
                    className="rounded-lg p-1.5 text-mute hover:bg-ink/5 hover:text-red-600"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-mute">{money(i.price)} each</p>
                {i.stock <= 0 && <p className="text-xs font-semibold text-red-700">Currently out of stock — remove to continue checkout.</p>}
                {i.stock > 0 && i.qty > i.stock && <p className="text-xs font-semibold text-red-700">Only {i.stock} currently in stock.</p>}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-lg border border-line bg-white">
                    <button
                      onClick={() => setQty(i._id, i.qty - 1)}
                      aria-label="Decrease quantity"
                      className="p-2 hover:text-cobalt"
                    >
                      <Icon name="minus" className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{i.qty}</span>
                    <button
                      onClick={() => setQty(i._id, i.qty + 1)}
                      disabled={i.qty >= i.stock}
                      aria-label="Increase quantity"
                      className="p-2 hover:text-cobalt disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Icon name="plus" className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="font-display text-lg font-bold">{money(i.price * i.qty)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-line bg-white p-5 lg:sticky lg:top-24">
          <p className="section-kicker text-cobalt">The good stuff</p>
          <h2 className="font-display mt-2 text-xl font-semibold">Bag summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-mute">Pairs in your bag</dt>
              <dd>{count}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd>{money(total)}</dd>
            </div>
          </dl>
          <button onClick={checkout} className={`${btnPrimary} mt-5 w-full rounded-full py-3.5`}>
            {user ? 'Continue to checkout' : 'Sign in to checkout'}
          </button>
          <Link to="/" className="mt-4 block text-center text-sm font-semibold text-mute transition hover:text-ink">Keep browsing</Link>
          <p className="mt-5 text-center text-xs leading-relaxed text-mute">Secure online payment with Razorpay or cash on delivery.</p>
        </aside>
      </div>
    </>
  )
}
