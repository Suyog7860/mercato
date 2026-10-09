import { useEffect, useState } from 'react'
import api, { errMsg } from '../api.js'
import { btnPrimary, inputCls } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const blankAddress = () => ({ name: '', phone: '', address: '', city: '', state: '', postalCode: '', country: 'India', isDefault: false })

export default function Account() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ name: '', email: '', phone: '', addresses: [], notificationPreferences: { orderUpdates: true, promotions: false } })
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      addresses: user.addresses || [],
      notificationPreferences: user.notificationPreferences || { orderUpdates: true, promotions: false },
    })
    setLoading(false)
  }, [user])

  const setField = (key) => (event) => setForm((value) => ({ ...value, [key]: event.target.value }))
  const setAddress = (index, key, value) => setForm((current) => ({
    ...current,
    addresses: current.addresses.map((address, i) => i === index ? { ...address, [key]: value } : address),
  }))

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const body = { ...form }
    if (newPassword) {
      body.currentPassword = currentPassword
      body.newPassword = newPassword
    }
    try {
      const { data } = await api.put('/user/infor', body)
      await refreshUser()
      setForm((current) => ({ ...current, ...data.user }))
      setCurrentPassword('')
      setNewPassword('')
      toast('Your account has been updated')
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="py-12 text-center text-mute">Loading your account…</p>
  return <>
    <p className="section-kicker text-cobalt">Your details</p>
    <h1 className="font-display mb-7 mt-2 text-3xl font-bold sm:text-4xl">Account settings</h1>
    <form onSubmit={save} className="mx-auto max-w-3xl space-y-7">
      <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
        <h2 className="font-display mb-4 text-xl font-semibold">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Full name<input className={`${inputCls} mt-1.5`} value={form.name} onChange={setField('name')} required /></label>
          <label className="text-sm font-semibold">Email<input className={`${inputCls} mt-1.5`} type="email" value={form.email} onChange={setField('email')} required /></label>
          <label className="text-sm font-semibold sm:col-span-2">Phone<input className={`${inputCls} mt-1.5`} value={form.phone} onChange={setField('phone')} /></label>
        </div>
      </section>
      <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">Delivery addresses</h2>
          <button type="button" onClick={() => setForm((value) => ({ ...value, addresses: [...value.addresses, blankAddress()] }))} disabled={form.addresses.length >= 10} className="text-sm font-semibold text-cobalt disabled:opacity-50">Add address</button>
        </div>
        {form.addresses.map((address, index) => <fieldset key={address._id || index} className="mb-4 rounded-xl border border-line p-4">
          <legend className="px-2 text-sm font-semibold">Address {index + 1}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {['name', 'phone', 'address', 'city', 'state', 'postalCode', 'country'].map((key) => <label key={key} className={`text-xs font-semibold capitalize ${key === 'address' ? 'sm:col-span-2' : ''}`}>{key}<input className={`${inputCls} mt-1.5`} value={address[key] || ''} onChange={(event) => setAddress(index, key, event.target.value)} required /></label>)}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm"><input type="radio" checked={Boolean(address.isDefault)} onChange={() => setForm((current) => ({ ...current, addresses: current.addresses.map((item, i) => ({ ...item, isDefault: i === index })) }))} /> Default address</label>
            <button type="button" onClick={() => setForm((current) => ({ ...current, addresses: current.addresses.filter((_, i) => i !== index) }))} className="text-sm font-semibold text-red-700">Remove</button>
          </div>
        </fieldset>)}
        {!form.addresses.length && <p className="text-sm text-mute">Add a delivery address to speed up checkout.</p>}
      </section>
      <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
        <h2 className="font-display mb-4 text-xl font-semibold">Notifications</h2>
        {['orderUpdates', 'promotions'].map((key) => <label key={key} className="flex items-center gap-3 py-2 text-sm capitalize">
          <input type="checkbox" checked={Boolean(form.notificationPreferences[key])} onChange={(event) => setForm((current) => ({ ...current, notificationPreferences: { ...current.notificationPreferences, [key]: event.target.checked } }))} />
          {key === 'orderUpdates' ? 'Order updates' : 'Offers and promotions'}
        </label>)}
      </section>
      <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
        <h2 className="font-display mb-4 text-xl font-semibold">Change password</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Current password<input className={`${inputCls} mt-1.5`} type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
          <label className="text-sm font-semibold">New password<input className={`${inputCls} mt-1.5`} type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
        </div>
      </section>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <button className={`${btnPrimary} w-full sm:w-auto`} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
    </form>
  </>
}
