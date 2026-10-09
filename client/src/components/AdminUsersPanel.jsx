import { useCallback, useEffect, useState } from 'react'
import api, { errMsg } from '../api.js'
import { btnPrimary, inputCls } from './ui.jsx'
import { useToast } from '../context/ToastContext.jsx'

export default function AdminUsersPanel() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState('')
  const toast = useToast()

  const load = useCallback(async (signal) => {
    setError('')
    try {
      const { data } = await api.get('/api/admin/users', { params: { search: query, page, limit: 50 }, signal })
      setUsers(data.users)
      setTotalPages(data.totalPages)
      setTotalUsers(data.totalUsers)
      if (page > Math.max(data.totalPages, 1)) setPage(Math.max(data.totalPages, 1))
    } catch (err) {
      if (err.code !== 'ERR_CANCELED') setError(errMsg(err))
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [query, page])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const update = async (user, values) => {
    setSavingId(user._id)
    try {
      const { data } = await api.patch(`/api/admin/users/${user._id}`, values)
      setUsers((current) => current.map((item) => item._id === data._id ? data : item))
      toast('Customer account updated')
    } catch (err) {
      toast(errMsg(err), 'error')
    } finally {
      setSavingId('')
    }
  }

  const submitSearch = (event) => {
    event.preventDefault()
    setPage(1)
    setQuery(search.trim())
  }

  if (loading) return <p className="py-12 text-center text-mute">Loading customer accounts…</p>
  if (error) return <div className="rounded-xl border border-line bg-white p-8 text-center"><p role="alert">{error}</p><button className={`${btnPrimary} mt-4`} onClick={() => load()}>Try again</button></div>
  return <>
    <form onSubmit={submitSearch} className="mb-4 flex gap-2">
      <input className={inputCls} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" aria-label="Search customers" />
      <button className={btnPrimary}>Search</button>
    </form>
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <p className="px-3 pt-3 text-xs text-mute">{totalUsers} customer accounts</p>
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-[#f0ede8] text-mute"><tr><th className="p-3">Customer</th><th className="p-3">Joined</th><th className="p-3">Role</th><th className="p-3">Account</th></tr></thead>
        <tbody className="divide-y divide-line">
          {users.map((user) => <tr key={user._id}>
            <td className="p-3"><p className="font-semibold">{user.name}</p><p className="text-mute">{user.email}</p></td>
            <td className="p-3 text-mute">{new Date(user.createdAt).toLocaleDateString()}</td>
            <td className="p-3"><select className={inputCls} value={user.role} disabled={savingId === user._id} onChange={(event) => update(user, { role: Number(event.target.value) })}><option value={0}>Customer</option><option value={1}>Admin</option></select></td>
            <td className="p-3"><button className="rounded-lg border border-line px-3 py-2 font-semibold disabled:opacity-50" disabled={savingId === user._id} onClick={() => update(user, { isActive: !user.isActive })}>{user.isActive ? 'Active — deactivate' : 'Inactive — activate'}</button></td>
          </tr>)}
        </tbody>
      </table>
      {!users.length && <p className="p-8 text-center text-mute">No customers found.</p>}
    </div>
    {totalPages > 1 && <nav className="mt-5 flex items-center justify-center gap-3" aria-label="Customer pages">
      <button className="rounded-lg border border-line px-4 py-2 text-sm font-semibold disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
      <span className="text-sm text-mute">Page {page} of {totalPages}</span>
      <button className="rounded-lg border border-line px-4 py-2 text-sm font-semibold disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
    </nav>}
  </>
}
