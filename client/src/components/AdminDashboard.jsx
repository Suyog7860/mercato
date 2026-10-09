import { useCallback, useEffect, useState } from 'react'
import api, { errMsg } from '../api.js'
import { btnPrimary } from './ui.jsx'
import { money } from '../utils.js'

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (signal) => {
    setError('')
    try {
      const { data } = await api.get('/api/admin/dashboard', { signal })
      setSummary(data)
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

  if (loading) return <p className="py-12 text-center text-mute">Loading store overview…</p>
  if (error) return <div className="rounded-xl border border-line bg-white p-8 text-center"><p role="alert">{error}</p><button className={`${btnPrimary} mt-4`} onClick={() => load()}>Try again</button></div>

  const cards = [
    ['Gross revenue', money(summary.totalRevenue)],
    ['Orders', summary.totalOrders],
    ['Customers', summary.totalUsers],
    ['Products', summary.totalProducts],
    ['Pending orders', summary.pendingOrders],
    ['Delivered orders', summary.deliveredOrders],
  ]
  return <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {cards.map(([label, value]) => <div key={label} className="rounded-xl border border-line bg-white p-5">
      <dt className="text-sm text-mute">{label}</dt><dd className="font-display mt-2 text-2xl font-bold">{value}</dd>
    </div>)}
  </dl>
}
