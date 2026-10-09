import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api, { errMsg } from '../api.js'
import { btnPrimary } from '../components/ui.jsx'
import { money, thumb } from '../utils.js'

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
const statusLabel = (status) => status.charAt(0).toUpperCase() + status.slice(1)

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const location = useLocation()

  const loadOrders = useCallback(async (signal) => {
    setError('')
    try {
      const { data } = await api.get('/api/orders', { signal })
      setOrders(data)
    } catch (err) {
      if (err.code !== 'ERR_CANCELED') setError(errMsg(err))
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadOrders(controller.signal)
    return () => controller.abort()
  }, [loadOrders])

  return (
    <>
      <h1 className="font-display mb-6 text-3xl font-bold sm:text-4xl">Your orders</h1>
      {location.state?.orderId && (
        <p className="mb-5 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800" role="status">
          Order placed. Your order number is {location.state.orderId}.
        </p>
      )}
      {loading ? (
        <p className="py-12 text-center text-mute">Loading your orders…</p>
      ) : error ? (
        <div className="rounded-xl border border-line bg-white p-8 text-center">
          <p role="alert" className="font-semibold">{error}</p>
          <button onClick={() => loadOrders()} className={`${btnPrimary} mt-4`}>Try again</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white px-6 py-16 text-center">
          <p className="font-display text-2xl font-semibold">No orders yet.</p>
          <p className="mt-2 text-mute">Your completed checkouts will appear here.</p>
          <Link to="/" className={`${btnPrimary} mt-6`}>Browse products</Link>
        </div>
      ) : (
        <ul className="space-y-5">
          {orders.map((order) => (
            <li key={order._id} className="overflow-hidden rounded-3xl border border-line bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-[#f7f4ef] px-4 py-4 sm:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-mute">Order</p>
                  <Link to={`/orders/${order._id}`} className="mt-1 inline-block font-mono text-sm font-semibold text-cobalt hover:underline">{order._id}</Link>
                  <p className="mt-1 text-xs text-mute">{dateTime.format(new Date(order.createdAt))}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-tint px-3 py-1 text-sm font-semibold text-cobalt">
                    {statusLabel(order.status)}
                  </span>
                  <p className="mt-2 text-xs font-medium text-mute">
                    {order.paymentMethod === 'razorpay'
                      ? `Razorpay · ${order.paymentStatus}`
                      : `Cash on delivery · ${order.paymentStatus}`}
                  </p>
                  <p className="mt-2 font-display text-lg font-bold">{money(order.total)}</p>
                </div>
              </div>
              <ul className="divide-y divide-line px-4 sm:px-6">
                {order.items.map((item, index) => (
                  <li key={`${item.product}-${index}`} className="flex items-center gap-3 py-4">
                    <img
                      src={thumb(item.image, 120)}
                      alt=""
                      width="56"
                      height="56"
                      className="h-14 w-14 rounded-lg bg-line/60 object-cover"
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">{item.title} × {item.quantity}</span>
                    <span className="shrink-0 text-sm">{money(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <p className="border-t border-line px-4 py-3 text-sm text-mute sm:px-6">
                Shipping to {order.shipping.city}, {order.shipping.country}
              </p>
              <Link to={`/orders/${order._id}`} className="block border-t border-line px-4 py-3 text-sm font-semibold text-cobalt hover:bg-[#f7f4ef] sm:px-6">View order details →</Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
