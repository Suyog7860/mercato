import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useProducts } from '../context/ProductsContext.jsx'
import { STORE_NAME } from '../utils.js'

export default function Footer() {
  const { user } = useAuth()
  const { categories } = useProducts()

  return (
    <footer className="mt-20 bg-[#29241e] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:py-16">
        <div>
          <Link to="/" className="font-display text-3xl font-bold tracking-[-0.05em]">
            mercato<span className="text-[#c9a77d]">.</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
            Good shoes for the everyday. A considered collection, picked for the way you move.
          </p>
          <p className="section-kicker mt-7 text-[#c9a77d]">Find your next favourite</p>
        </div>
        <div>
          <h2 className="text-sm font-bold">Explore</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/60">
            <li><Link to="/" className="transition hover:text-white">Home</Link></li>
            <li><Link to="/#shop" className="transition hover:text-white">Shop all</Link></li>
            <li><Link to="/#collections" className="transition hover:text-white">Collections</Link></li>
            <li><Link to="/cart" className="transition hover:text-white">Shopping bag</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold">Your account</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/60">
            <li><Link to={user ? '/orders' : '/login'} className="transition hover:text-white">{user ? 'Order history' : 'Sign in'}</Link></li>
            {!user && <li><Link to="/register" className="transition hover:text-white">Create an account</Link></li>}
            <li><Link to="/#shop" className="transition hover:text-white">Need a new pair?</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold">Browse by edit</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/60">
            {(categories.length ? categories.slice(0, 4) : [{ _id: 'all', name: 'All styles' }]).map((category) => (
              <li key={category._id}>
                <Link to="/#shop" className="transition hover:text-white">{category.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-white/45 sm:px-8 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} {STORE_NAME}. Made for the everyday.</span>
          <span>Secure online payment options · Cash on delivery available</span>
        </div>
      </div>
    </footer>
  )
}
