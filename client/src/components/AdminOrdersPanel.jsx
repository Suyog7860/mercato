import { useCallback, useEffect, useState } from 'react'
import api, { errMsg } from '../api.js'
import { btnPrimary, inputCls } from './ui.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { money } from '../utils.js'

const NEXT_STATUSES = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}
const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export default function AdminOrdersPanel() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState('')
  const toast = useToast()

  const load = useCallback(async (signal) => {
    setError('')
    try {
      const { data } = await api.get('/api/admin/orders', { signal })
      setOrders(data)
    } catch (err) {
      if (err.code !== 'ERR_CANCELED') setError(errMsg(err))
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const changeStatus = async (order, status) => {
    setSavingId(order._id)
    try {
      const { data } = await api.patch(`/api/admin/orders/${order._id}`, { status })
      setOrders((current) => current.map((item) => (item._id === data._id ? data : item)))
      toast('Order status updated')
    } catch (err) {
      toast(errMsg(err), 'error')
    } finally {
      setSavingId('')
    }
  }

  if (loading) return <p className="py-12 text-center text-mute">Loading orders…</p>
  if (error) {
    return (
      <div className="rounded-xl border border-line bg-white p-8 text-center">
        <p role="alert" className="font-semibold">{error}</p>
        <button onClick={() => load()} className={`${btnPrimary} mt-4`}>Try again</button>
      </div>
    )
  }
  if (orders.length === 0) {
    return <p className="rounded-xl border border-line bg-white p-8 text-center text-mute">No orders have been placed yet.</p>
  }

  return (
    <>
      <p className="mb-4 text-sm text-mute">Showing the 100 most recent orders.</p>
      <ul className="space-y-4">
        {orders.map((order) => (
          <li key={order._id} className="rounded-xl border border-line bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-sm">{order._id}</p>
                <p className="mt-1 text-sm text-mute">{dateTime.format(new Date(order.createdAt))}</p>
                <p className="mt-2 font-semibold">{order.shipping.name} · {order.shipping.phone}</p>
                <p className="text-sm text-mute">
                  {order.shipping.address}, {order.shipping.city}{order.shipping.state ? `, ${order.shipping.state}` : ''}, {order.shipping.postalCode}, {order.shipping.country}
                </p>
              </div>
              <label className="w-full sm:w-48">
                <span className="mb-1 block text-xs font-semibold text-mute">Order status</span>
                <select
                  className={inputCls}
                  value={order.status}
                  onChange={(event) => changeStatus(order, event.target.value)}
                  disabled={savingId === order._id}
                >
                  {[order.status, ...(NEXT_STATUSES[order.status] || [])].map((status) => (
                    <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>
              </label>
            </div>
            <ul className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
              {order.items.map((item, index) => (
                <li key={`${item.product}-${index}`} className="flex justify-between gap-3">
                  <span className="truncate text-mute">{item.title} × {item.quantity}</span>
                  <span className="shrink-0">{money(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-line pt-3 text-right font-display text-lg font-bold">
              Total {money(order.total)} · {order.paymentMethod === 'razorpay' ? 'Razorpay' : 'COD'}
              {order.paymentMethod === 'razorpay' && ` · ${order.paymentStatus}`}
            </p>
          </li>
        ))}
      </ul>
    </>
  )
}
