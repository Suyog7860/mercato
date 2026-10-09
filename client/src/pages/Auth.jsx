import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { errMsg } from '../api.js'
import { btnPrimary, inputCls } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

export default function Auth({ mode }) {
  const isLogin = mode === 'login'
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const toast = useToast()

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (isLogin) await login(form.email.trim(), form.password)
      else await register(form.name.trim(), form.email.trim(), form.password)
      toast(isLogin ? 'Signed in' : 'Account created')
      navigate(state?.from || '/', { replace: true })
    } catch (err) {
      setError(errMsg(err))
      setBusy(false)
    }
  }

  if (user && !busy) return <Navigate to={state?.from || '/'} replace />

  return (
    <div className="mx-auto max-w-md py-5 sm:py-12">
      <div className="rounded-3xl border border-line bg-white p-6 sm:p-9">
      <p className="section-kicker text-cobalt">{isLogin ? 'Good to have you back' : 'Join the everyday edit'}</p>
      <h1 className="font-display mt-3 text-4xl font-semibold">{isLogin ? 'Welcome back.' : 'Find your people.'}</h1>
      <p className="mt-2 text-mute">
        {isLogin ? "New here? " : 'Already registered? '}
        <Link to={isLogin ? '/register' : '/login'} state={state} className="font-semibold text-cobalt hover:underline">
          {isLogin ? 'Create an account' : 'Sign in'}
        </Link>
      </p>

      <form onSubmit={submit} className="mt-7 space-y-4" noValidate={false}>
        {!isLogin && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Name</span>
            <input className={inputCls} value={form.name} onChange={set('name')} required autoComplete="name" />
          </label>
        )}
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Email</span>
          <input
            className={inputCls}
            type="email"
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Password</span>
          <input
            className={inputCls}
            type="password"
            value={form.password}
            onChange={set('password')}
            required
            minLength={6}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
          {!isLogin && <span className="mt-1 block text-xs text-mute">At least 6 characters.</span>}
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <button className={`${btnPrimary} w-full rounded-full py-3.5`} disabled={busy}>
          {busy ? 'One moment…' : isLogin ? 'Sign in' : 'Create my account'}
        </button>
      </form>
      </div>
      <p className="mt-5 text-center text-xs text-mute">Your details stay private and secure.</p>
    </div>
  )
}
