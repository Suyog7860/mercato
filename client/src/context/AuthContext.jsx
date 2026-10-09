import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { refreshToken, setToken } from '../api.js'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  const loadUser = useCallback(async () => {
    const { data } = await api.get('/user/infor')
    setUser(data.user ?? data)
  }, [])

  // On first load, try the refresh cookie to restore the session silently.
  useEffect(() => {
    ;(async () => {
      try {
        await refreshToken()
        await loadUser()
      } catch {
        setUser(null)
      } finally {
        setReady(true)
      }
    })()
  }, [loadUser])

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/user/login', { email, password })
      setToken(data.accesstoken)
      await loadUser()
    },
    [loadUser]
  )

  const register = useCallback(
    async (name, email, password) => {
      const { data } = await api.post('/user/register', { name, email, password })
      setToken(data.accesstoken)
      await loadUser()
    },
    [loadUser]
  )

  const refreshUser = useCallback(() => loadUser(), [loadUser])

  const logout = useCallback(async () => {
    try {
      await api.get('/user/logout')
    } catch {
      /* cookie may already be gone */
    }
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, ready, isAdmin: user?.role === 1, login, register, logout, refreshUser }),
    [user, ready, login, register, logout, refreshUser]
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
