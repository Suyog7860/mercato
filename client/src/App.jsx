import { lazy, Suspense } from 'react'
import { Link, Outlet, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { Spinner } from './components/ui.jsx'

// Route-level code splitting: each page downloads only when first visited.
const Home = lazy(() => import('./pages/Home.jsx'))
const ProductDetail = lazy(() => import('./pages/ProductDetail.jsx'))
const Cart = lazy(() => import('./pages/Cart.jsx'))
const Checkout = lazy(() => import('./pages/Checkout.jsx'))
const Orders = lazy(() => import('./pages/Orders.jsx'))
const OrderDetail = lazy(() => import('./pages/OrderDetail.jsx'))
const Wishlist = lazy(() => import('./pages/Wishlist.jsx'))
const Account = lazy(() => import('./pages/Account.jsx'))
const Shop = lazy(() => import('./pages/Shop.jsx'))
const Auth = lazy(() => import('./pages/Auth.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))

function Layout() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-7 sm:py-10 lg:px-10">
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="font-display text-4xl font-bold">Page not found</h1>
      <p className="mt-2 text-mute">That link doesn't lead anywhere.</p>
      <Link to="/" className="mt-6 inline-block font-semibold text-cobalt hover:underline">
        Back to the shop
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="men" element={<Shop defaultGender="Men" />} />
        <Route path="women" element={<Shop defaultGender="Women" />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route path="wishlist" element={<Wishlist />} />
        <Route
          path="account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route path="login" element={<Auth mode="login" />} />
        <Route path="register" element={<Auth mode="register" />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute admin>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
