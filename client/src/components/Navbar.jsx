import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Icon } from './icons.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { STORE_NAME } from '../utils.js'

const navCls = ({ isActive }) =>
  `whitespace-nowrap text-sm font-semibold transition ${
    isActive ? 'text-ink' : 'text-mute hover:text-ink'
  }`

const accountCls = ({ isActive }) =>
  `flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
    isActive ? 'bg-tint text-ink' : 'text-ink hover:bg-tint'
  }`
const categories = ['Watches', 'Goggles', 'Hats', 'Shoes', 'Shirts', 'Pants']

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const { count } = useCart()
  const { count: wishlistCount } = useWishlist()
  const toast = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const close = () => setOpen(false)
  const goToSection = (section) => (event) => {
    event.preventDefault()
    close()
    navigate(`/#${section}`)
  }
  const submitSearch = (event) => {
    event.preventDefault()
    const query = search.trim()
    navigate(query ? `/shop?search=${encodeURIComponent(query)}` : '/shop')
    setSearchOpen(false)
    close()
  }

  const onLogout = async () => {
    await logout()
    close()
    toast('Signed out')
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/95 backdrop-blur-xl">
      <div className="border-b border-white/10 bg-[#352a20] px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f0dfca]">
        Considered pairs. Made for wherever.
      </div>
      <div className="mx-auto flex h-[70px] max-w-7xl items-center gap-4 px-4 sm:px-7 lg:px-10">
        <Link
          to="/"
          onClick={close}
          aria-label={`${STORE_NAME} home`}
          className="font-display text-2xl font-bold tracking-[-0.06em] text-ink sm:text-[1.8rem]"
        >
          mercato<span className="text-cobalt">.</span>
        </Link>

        <nav className="ml-5 hidden items-center gap-7 md:flex" aria-label="Main navigation">
          <NavLink to="/" end className={navCls}>Home</NavLink>
          <Link to="/#shop" onClick={goToSection('shop')} className={navCls({ isActive: false })}>Shop</Link>
          {['Men', 'Women'].map((gender) => (
            <details key={gender} className="group relative py-6">
              <summary className="cursor-pointer list-none text-sm font-semibold text-mute transition hover:text-ink">
                {gender}
              </summary>
              <div className="invisible absolute left-1/2 top-full z-50 w-[560px] -translate-x-1/2 translate-y-2 rounded-2xl border border-line bg-white p-6 opacity-0 shadow-xl transition group-open:visible group-open:translate-y-0 group-open:opacity-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="section-kicker text-cobalt">The {gender.toLowerCase()} edit</p>
                    <p className="font-display mt-1 text-2xl font-semibold">Find your everyday.</p>
                  </div>
                  <Link to={`/${gender.toLowerCase()}`} className="text-xs font-semibold text-cobalt hover:underline">
                    Shop all {gender.toLowerCase()} ↗
                  </Link>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {categories.map((category) => (
                    <Link
                      key={category}
                      to={`/shop?gender=${gender}&category=${encodeURIComponent(category)}`}
                      className="rounded-xl bg-paper px-3 py-3 text-sm font-medium transition hover:bg-tint hover:text-cobalt"
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              </div>
            </details>
          ))}
          <Link to="/#collections" onClick={goToSection('collections')} className={navCls({ isActive: false })}>Collections</Link>
          {isAdmin && <NavLink to="/admin" className={navCls}>Manage store</NavLink>}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen((value) => !value)}
            aria-label={searchOpen ? 'Close search' : 'Search'}
            className="hidden rounded-full p-3 text-ink transition hover:bg-tint sm:inline-flex"
          >
            <Icon name="search" className="h-5 w-5" />
          </button>
          <NavLink to="/wishlist" aria-label="Wishlist" className={({ isActive }) => `relative hidden rounded-full p-3 transition hover:bg-tint sm:inline-flex ${isActive ? 'text-cobalt' : 'text-ink'}`}>
            <Icon name="heart" className="h-5 w-5" />
            {wishlistCount > 0 && <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#a34848] px-1 text-[10px] font-bold text-white">{wishlistCount > 99 ? '99+' : wishlistCount}</span>}
          </NavLink>
          <Link
            to="/cart"
            onClick={close}
            aria-label={`Shopping bag, ${count} items`}
            className="relative rounded-full p-3 text-ink transition hover:bg-tint"
          >
            <Icon name="cart" className="h-5 w-5" />
            <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-cobalt px-1 text-[10px] font-bold text-white">
              {count > 99 ? '99+' : count}
            </span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {user ? (
              <>
                <NavLink to="/account" aria-label="Your account" className={accountCls}>
                  <Icon name="user" className="h-4 w-4" />
                </NavLink>
                <NavLink to="/orders" className={accountCls} title="Your orders">
                  {user.name?.split(' ')[0]}
                </NavLink>
                <button onClick={onLogout} className="rounded-full px-3 py-2.5 text-sm font-semibold text-mute transition hover:bg-tint hover:text-ink">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={accountCls}>Sign in</NavLink>
                <Link to="/register" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt">
                  Join us
                </Link>
              </>
            )}
          </div>
          <button
            className="rounded-full p-2.5 text-ink transition hover:bg-tint md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          >
            <Icon name={open ? 'close' : 'menu'} className="h-5 w-5" />
          </button>
        </div>
      </div>

      {searchOpen && (
        <form onSubmit={submitSearch} className="border-t border-line bg-white px-4 py-3">
          <div className="mx-auto flex max-w-3xl gap-2">
            <label className="relative flex-1">
              <span className="sr-only">Search styles and collections</span>
              <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-mute" />
              <input autoFocus type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try “women's shoes” or a brand" className="w-full rounded-full border border-line bg-paper py-3 pl-12 pr-4 text-sm outline-none focus:border-cobalt" />
            </label>
            <button className={`${accountCls({ isActive: false })} bg-ink text-white hover:bg-cobalt`} type="submit">Search</button>
          </div>
        </form>
      )}

      {open && (
        <nav className="border-t border-line bg-paper px-5 py-4 shadow-lg md:hidden" aria-label="Mobile navigation">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            <Link to="/" className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-tint" onClick={close}>Home</Link>
            <Link to="/#shop" className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-tint" onClick={goToSection('shop')}>Shop all</Link>
            <Link to="/men" className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-tint" onClick={close}>Men</Link>
            <div className="grid grid-cols-2 gap-1 pl-4">
              {categories.map((category) => <Link key={`men-${category}`} to={`/shop?gender=Men&category=${encodeURIComponent(category)}`} className="rounded-lg px-3 py-2 text-xs text-mute hover:bg-tint" onClick={close}>{category}</Link>)}
            </div>
            <Link to="/women" className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-tint" onClick={close}>Women</Link>
            <div className="grid grid-cols-2 gap-1 pl-4">
              {categories.map((category) => <Link key={`women-${category}`} to={`/shop?gender=Women&category=${encodeURIComponent(category)}`} className="rounded-lg px-3 py-2 text-xs text-mute hover:bg-tint" onClick={close}>{category}</Link>)}
            </div>
            <Link to="/#collections" className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-tint" onClick={goToSection('collections')}>Collections</Link>
            {!user && <Link to="/wishlist" className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-tint" onClick={close}>Wishlist</Link>}
            {user ? (
              <>
                <Link to="/account" className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-tint" onClick={close}>Account</Link>
                <Link to="/wishlist" className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-tint" onClick={close}>Wishlist</Link>
                <Link to="/orders" className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-tint" onClick={close}>Your orders</Link>
                {isAdmin && <Link to="/admin" className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-tint" onClick={close}>Manage store</Link>}
                <button onClick={onLogout} className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-mute hover:bg-tint">Sign out · {user.name}</button>
              </>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-3">
                <Link to="/login" className="rounded-full border border-line px-4 py-3 text-center text-sm font-semibold" onClick={close}>Sign in</Link>
                <Link to="/register" className="rounded-full bg-ink px-4 py-3 text-center text-sm font-semibold text-white" onClick={close}>Join us</Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
