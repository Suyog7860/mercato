import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { errMsg } from '../api.js'
import { btnPrimary, inputCls } from '../components/ui.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { money } from '../utils.js'

const FIELDS = [
  ['name', 'Full name', 'text', 'name'],
  ['email', 'Email address', 'email', 'email'],
  ['phone', 'Phone number', 'tel', 'tel'],
  ['address', 'Street address', 'text', 'street-address'],
  ['city', 'City', 'text', 'address-level2'],
  ['state', 'State / province', 'text', 'address-level1'],
  ['postalCode', 'Postal code', 'text', 'postal-code'],
  ['country', 'Country', 'text', 'country-name'],
]
const PAYMENT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true)
  return new Promise((resolve) => {
    const existingScript = document.querySelector(`script[src="${PAYMENT_SCRIPT}"]`)
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true })
      existingScript.addEventListener('error', () => resolve(false), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = PAYMENT_SCRIPT
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function Checkout() {
  const { items, total, count, clear } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [shipping, setShipping] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  })
  const [paymentConfig, setPaymentConfig] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [paymentConfigError, setPaymentConfigError] = useState('')
  const [selectedAddress, setSelectedAddress] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get('/api/payments/config')
      .then(({ data }) => {
        if (!active) return
        setPaymentConfig(data)
        setPaymentMethod(data.enabled ? 'razorpay' : 'cash_on_delivery')
      })
      .catch((err) => {
        if (!active) return
        setPaymentConfigError(errMsg(err))
        setPaymentConfig({ enabled: false, currency: 'INR' })
        setPaymentMethod('cash_on_delivery')
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const addressIndex = user?.addresses?.findIndex((address) => address.isDefault) ?? -1
    const address = user?.addresses?.[addressIndex >= 0 ? addressIndex : 0]
    if (!user) return
    setShipping((current) => ({
      ...current,
      name: address?.name || user.name || current.name,
      email: user.email || current.email,
      phone: address?.phone || user.phone || current.phone,
      address: address?.address || current.address,
      city: address?.city || current.city,
      state: address?.state || current.state,
      postalCode: address?.postalCode || current.postalCode,
      country: address?.country || current.country,
    }))
    if (address) setSelectedAddress(String(addressIndex >= 0 ? addressIndex : 0))
  }, [user])

  const chooseAddress = (value) => {
    setSelectedAddress(value)
    if (value === '') return
    const address = user?.addresses?.[Number(value)]
    if (!address) return
    setShipping((current) => ({
      ...current,
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    }))
  }

  const orderItems = items.map((item) => ({ product: item._id, quantity: item.qty }))

  const completeOrder = (orderId) => {
    clear()
    toast('Your order is confirmed')
    navigate('/orders', { replace: true, state: { orderId } })
  }

  const startRazorpay = async () => {
    const scriptReady = await loadRazorpay()
    if (!scriptReady) throw new Error('Secure checkout could not load. Check your connection and try again.')

    const { data } = await api.post('/api/payments/razorpay/order', { shipping, items: orderItems })
    const checkout = new window.Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      name: 'Mercato',
      description: `${count} pair${count === 1 ? '' : 's'} from the everyday edit`,
      order_id: data.razorpayOrderId,
      prefill: data.customer,
      theme: { color: '#765436' },
      modal: { ondismiss: () => setBusy(false) },
      handler: async (response) => {
        try {
          const { data: verified } = await api.post('/api/payments/razorpay/verify', {
            orderId: data.orderId,
            ...response,
          })
          completeOrder(verified.orderId)
        } catch (err) {
          setError(`${errMsg(err)} If you were charged, please contact support before trying again.`)
          setBusy(false)
        }
      },
    })
    checkout.on('payment.failed', (event) => {
      setError(event.error?.description || 'Payment was not completed. Please try another method.')
      setBusy(false)
    })
    checkout.open()
  }

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (paymentMethod === 'razorpay') {
        await startRazorpay()
        return
      }
      const { data } = await api.post('/api/orders', { shipping, items: orderItems })
      completeOrder(data._id)
    } catch (err) {
      setError(err.response ? errMsg(err) : err.message || 'Could not start checkout. Please try again.')
      setBusy(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-line bg-white px-6 py-20 text-center">
        <p className="section-kicker text-cobalt">Your next pair is waiting</p>
        <h1 className="font-display mt-3 text-3xl font-semibold">Your bag is empty.</h1>
        <Link to="/" className={`${btnPrimary} mt-6 rounded-full`}>Explore the collection</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/cart" className="text-sm font-semibold text-mute transition hover:text-ink">
        &larr; Back to your bag
      </Link>
      <div className="mb-7 mt-4">
        <p className="section-kicker text-cobalt">Almost yours</p>
        <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">A few details, then you’re set.</h1>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_370px]">
        <form onSubmit={submit} className="space-y-7 rounded-3xl border border-line bg-white p-5 sm:p-8">
          <section>
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-tint text-sm font-bold text-cobalt">1</span>
              <h2 className="font-display text-xl font-semibold">Where should we send it?</h2>
            </div>
            {user?.addresses?.length > 0 && <label className="mb-4 block text-sm font-semibold">
              Saved address
              <select className={`${inputCls} mt-1.5`} value={selectedAddress} onChange={(event) => chooseAddress(event.target.value)}>
                <option value="">Enter a different address</option>
                {user.addresses.map((address, index) => <option key={address._id || index} value={index}>{address.name} · {address.city} · {address.address}</option>)}
              </select>
            </label>}
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map(([key, label, type, autocomplete]) => (
                <label key={key} className={`block ${key === 'address' ? 'sm:col-span-2' : ''}`}>
                  <span className="mb-1.5 block text-sm font-semibold">{label}</span>
                  <input
                    className={inputCls}
                    type={type}
                    autoComplete={autocomplete}
                    value={shipping[key]}
                    onChange={(event) => setShipping((current) => ({ ...current, [key]: event.target.value }))}
                    required
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="border-t border-line pt-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-tint text-sm font-bold text-cobalt">2</span>
              <h2 className="font-display text-xl font-semibold">Choose how to pay</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                paymentMethod === 'razorpay' ? 'border-cobalt bg-[#faf7f2]' : 'border-line hover:border-[#b9aa98]'
              } ${!paymentConfig?.enabled ? 'cursor-not-allowed opacity-60' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  disabled={!paymentConfig?.enabled || busy}
                  className="mt-1 accent-[#765436]"
                />
                <span>
                  <span className="block text-sm font-bold">Pay online</span>
                  <span className="mt-1 block text-xs leading-relaxed text-mute">UPI, cards, and net banking through Razorpay.</span>
                </span>
              </label>
              <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                paymentMethod === 'cash_on_delivery' ? 'border-cobalt bg-[#faf7f2]' : 'border-line hover:border-[#b9aa98]'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  value="cash_on_delivery"
                  checked={paymentMethod === 'cash_on_delivery'}
                  onChange={() => setPaymentMethod('cash_on_delivery')}
                  disabled={busy}
                  className="mt-1 accent-[#765436]"
                />
                <span>
                  <span className="block text-sm font-bold">Cash on delivery</span>
                  <span className="mt-1 block text-xs leading-relaxed text-mute">Pay in cash when your order arrives.</span>
                </span>
              </label>
            </div>
            {paymentConfig && !paymentConfig.enabled && (
              <p className="mt-3 text-xs text-mute">
                {paymentConfigError
                  ? `Online payment could not be checked (${paymentConfigError}). Cash on delivery is available.`
                  : 'Online payment is being set up. Cash on delivery is available in the meantime.'}
              </p>
            )}
          </section>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          <button className={`${btnPrimary} w-full rounded-full py-4`} disabled={busy}>
            {busy ? 'Opening secure checkout…' : paymentMethod === 'razorpay' ? `Pay ${money(total)} securely` : 'Place cash-on-delivery order'}
          </button>
          <p className="text-center text-xs text-mute">
            {paymentMethod === 'razorpay' ? 'Your payment details are secured by Razorpay.' : 'You’ll pay when your order is delivered.'}
          </p>
        </form>

        <aside className="h-fit rounded-3xl border border-line bg-white p-5 sm:p-6 lg:sticky lg:top-32">
          <p className="section-kicker text-cobalt">Just for you</p>
          <h2 className="font-display mt-2 text-xl font-semibold">Your bag, all together.</h2>
          <ul className="mt-5 space-y-4">
            {items.map((item) => (
              <li key={item._id} className="flex items-center gap-3">
                <img
                  src={item.image}
                  alt=""
                  width="64"
                  height="64"
                  className="h-16 w-16 rounded-xl bg-[#f0ede8] object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold capitalize">{item.title}</span>
                  <span className="mt-1 block text-xs text-mute">Qty {item.qty}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold">{money(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex justify-between text-mute"><dt>Pairs in your bag</dt><dd>{count}</dd></div>
            <div className="flex justify-between text-mute"><dt>Delivery</dt><dd>Confirmed after order</dd></div>
            <div className="flex justify-between border-t border-line pt-4 text-base font-bold text-ink">
              <dt>Total</dt><dd>{money(total)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-mute">
            Final price is calculated securely using current product prices.
          </p>
        </aside>
      </div>
    </div>
  )
}
