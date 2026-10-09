import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { errMsg } from '../api.js'
import { btnPrimary } from '../components/ui.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { money, thumb } from '../utils.js'

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export default function OrderDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async (signal) => {
    setError('')
    try {
      const { data } = await api.get(`/api/orders/${encodeURIComponent(id)}`, { signal })
      setOrder(data)
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

  const cancel = async () => {
    if (!window.confirm('Cancel this pending order?')) return
    setBusy(true)
    try {
      const { data } = await api.patch(`/api/orders/${order._id}/cancel`)
      setOrder(data)
      toast('Order cancelled')
    } catch (err) {
      toast(errMsg(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="py-12 text-center text-mute">Loading order…</p>
  if (error || !order) return <div className="py-16 text-center"><p role="alert">{error || 'Order not found'}</p><Link to="/orders" className={`${btnPrimary} mt-5`}>Back to orders</Link></div>
  return <>
    <Link to="/orders" className="text-sm font-semibold text-cobalt hover:underline">← All orders</Link>
    <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
      <div><p className="section-kicker text-cobalt">Order details</p><h1 className="font-display mt-2 text-2xl font-bold sm:text-3xl">#{order._id}</h1><p className="mt-2 text-sm text-mute">{dateTime.format(new Date(order.createdAt))}</p></div>
      <span className="rounded-full bg-tint px-4 py-2 text-sm font-semibold capitalize text-cobalt">{order.status}</span>
    </div>
    <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1fr_320px]">
      <section className="rounded-2xl border border-line bg-white p-4 sm:p-6">
        <h2 className="font-display mb-4 text-xl font-semibold">Items</h2>
        <ul className="divide-y divide-line">
          {order.items.map((item, index) => <li key={`${item.product}-${index}`} className="flex items-center gap-4 py-4">
            <img src={thumb(item.image, 120)} alt="" className="h-16 w-16 rounded-xl object-cover" />
            <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{item.title}</span><span className="text-sm text-mute">Qty {item.quantity} · {money(item.price)} each</span></span>
            <span className="font-semibold">{money(item.price * item.quantity)}</span>
          </li>)}
        </ul>
        <p className="border-t border-line pt-4 text-right font-display text-xl font-bold">Total {money(order.total)}</p>
      </section>
      <aside className="space-y-5">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display mb-3 text-lg font-semibold">Delivery</h2>
          <p className="font-semibold">{order.shipping.name}</p><p className="mt-1 text-sm leading-relaxed text-mute">{order.shipping.address}, {order.shipping.city}{order.shipping.state ? `, ${order.shipping.state}` : ''}, {order.shipping.postalCode}, {order.shipping.country}</p><p className="mt-2 text-sm text-mute">{order.shipping.phone}</p>
        </section>
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display mb-3 text-lg font-semibold">Payment</h2>
          <p className="text-sm">{order.paymentMethod === 'razorpay' ? 'Razorpay' : 'Cash on delivery'} · <span className="capitalize">{order.paymentStatus}</span></p>
          {order.paymentMethod === 'razorpay' && order.paymentStatus === 'pending' && <p className="mt-2 text-xs text-mute">Payment checkout can be resumed from the original checkout session until it expires.</p>}
        </section>
        {!!order.statusHistory?.length && <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display mb-3 text-lg font-semibold">Status history</h2>
          <ol className="space-y-3">{order.statusHistory.map((entry, index) => <li key={`${entry.status}-${entry.at}-${index}`} className="flex justify-between gap-3 text-sm"><span className="capitalize font-semibold">{entry.status}</span><time className="text-mute">{dateTime.format(new Date(entry.at))}</time></li>)}</ol>
        </section>}
        {order.status === 'pending' && order.paymentStatus !== 'paid' && <button className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-50" disabled={busy} onClick={cancel}>{busy ? 'Cancelling…' : 'Cancel order'}</button>}
      </aside>
    </div>
  </>
}
