import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { errMsg } from '../api.js'

const Ctx = createContext(null)
export const useProducts = () => useContext(Ctx)

const asList = (d, key) => (Array.isArray(d) ? d : d?.[key] ?? [])

// Products and categories are fetched once and shared, so navigating between pages is instant.
export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setError('')
      const [p, c] = await Promise.all([
        api.get('/api/products', { params: { limit: 100, sort: 'featured' } }),
        api.get('/api/categories'),
      ])
      setProducts(asList(p.data, 'products'))
      setCategories(asList(c.data, 'categories'))
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Products store either the category _id or its name, so resolve both.
  const catName = useCallback(
    (v) => categories.find((c) => c._id === v || c.name === v)?.name ?? v,
    [categories]
  )

  const value = useMemo(
    () => ({ products, categories, loading, error, reload: load, catName }),
    [products, categories, loading, error, load, catName]
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
