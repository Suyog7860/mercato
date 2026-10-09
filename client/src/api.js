import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

// The access token lives in memory only (not localStorage), so XSS can't read it.
// The refresh token is the httpOnly cookie your backend sets on login.
let accessToken = null
export const setToken = (t) => {
  accessToken = t
}

const api = axios.create({ baseURL: BASE, withCredentials: true })

api.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`
  return cfg
})

// Single-flight refresh: many requests failing at once trigger only one refresh call.
let refreshing = null
export const refreshToken = () => {
  refreshing ??= axios
    .post(`${BASE}/user/refreshtoken`, null, { withCredentials: true })
    .then((r) => {
      setToken(r.data.accesstoken)
      return r.data.accesstoken
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const { config, response } = err
    const expired =
      response?.status === 401 &&
      config &&
      !config._retry &&
      !config.url?.includes('refreshtoken')
    if (expired) {
      config._retry = true
      try {
        const t = await refreshToken()
        config.headers.Authorization = `Bearer ${t}`
        return api(config)
      } catch {
        setToken(null)
      }
    }
    return Promise.reject(err)
  }
)

export const errMsg = (e) => e?.response?.data?.msg || e?.message || 'Something went wrong'
export default api
