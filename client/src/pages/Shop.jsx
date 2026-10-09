import { useLocation } from 'react-router-dom'
import Home from './Home.jsx'

export default function Shop({ defaultGender = '' }) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  return <Home key={location.search} catalogOnly defaultGender={params.get('gender') || defaultGender} />
}
