import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { productImage } from '../utils.js'

const Ctx = createContext(null)
export const useCart = () => useContext(Ctx)

const KEY = 'cart:v1'
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

const clamp = (n, stock = 99) => Math.max(1, Math.min(99, stock, n))

function reducer(state, a) {
  switch (a.type) {
    case 'add': {
      const found = state.find((i) => i._id === a.item._id)
      return found
        ? state.map((i) => (i._id === found._id ? { ...i, ...a.item, qty: clamp(i.qty + a.qty, a.item.stock) } : i))
        : [...state, { ...a.item, qty: clamp(a.qty, a.item.stock) }]
    }
    case 'qty':
      return state.map((i) => (i._id === a.id ? { ...i, qty: clamp(a.qty, i.stock) } : i))
    case 'remove':
      return state.filter((i) => i._id !== a.id)
    case 'clear':
      return []
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, read)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      /* storage full or blocked */
    }
  }, [items])

  // Stable callbacks, so memoized product cards don't re-render when the cart changes.
  const add = useCallback(
    (p, qty = 1) =>
      dispatch({
        type: 'add',
        qty,
        item: { _id: p._id, title: p.name || p.title, price: p.discountPrice ?? p.price, image: productImage(p), stock: p.stock },
      }),
    []
  )
  const setQty = useCallback((id, qty) => dispatch({ type: 'qty', id, qty }), [])
  const remove = useCallback((id) => dispatch({ type: 'remove', id }), [])
  const clear = useCallback(() => dispatch({ type: 'clear' }), [])

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      total: items.reduce((n, i) => n + i.qty * i.price, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [items, add, setQty, remove, clear]
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
