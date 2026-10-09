import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api.js'
import { useAuth } from './AuthContext.jsx'

const Ctx = createContext(null)
export const useWishlist = () => useContext(Ctx)
const KEY = 'wishlist:guest:v1'

function readGuestWishlist() {
  try {
    const items = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

export function WishlistProvider({ children }) {
  const { user, ready } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ready) return
    let active = true
    if (!user) {
      setItems(readGuestWishlist())
      setLoading(false)
      setError('')
      return () => { active = false }
    }
    setLoading(true)
    setError('')
    const guestItems = readGuestWishlist()
    Promise.all(guestItems.map((product) =>
      api.post(`/user/wishlist/${product._id}`).catch((err) => {
        if (err.response?.status !== 404) throw err
      })
    ))
      .then(() => api.get('/user/wishlist'))
      .then(({ data }) => {
        if (!active) return
        setItems(data)
        localStorage.removeItem(KEY)
      })
      .catch((err) => { if (active) setError(err.response?.data?.msg || 'Wishlist could not be loaded') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user, ready])

  const reload = useCallback(async () => {
    if (!user) {
      setItems(readGuestWishlist())
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/user/wishlist')
      setItems(data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Wishlist could not be loaded')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (ready && !user) {
      try {
        localStorage.setItem(KEY, JSON.stringify(items))
      } catch (error) {
        console.error('Guest wishlist could not be saved:', error.message)
      }
    }
  }, [items, user, ready])

  const has = useCallback((id) => items.some((product) => product._id === id), [items])
  const toggle = useCallback(async (product) => {
    const exists = items.some((item) => item._id === product._id)
    if (user) {
      await api.request({
        url: `/user/wishlist/${product._id}`,
        method: exists ? 'DELETE' : 'POST',
      })
    }
    setItems((current) => exists
      ? current.filter((item) => item._id !== product._id)
      : [...current, product])
  }, [items, user])
  const remove = useCallback(async (id) => {
    if (user) await api.delete(`/user/wishlist/${id}`)
    setItems((current) => current.filter((product) => product._id !== id))
  }, [user])

  const value = useMemo(
    () => ({ items, count: items.length, has, toggle, remove, loading, error, reload }),
    [items, has, toggle, remove, loading, error, reload]
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
