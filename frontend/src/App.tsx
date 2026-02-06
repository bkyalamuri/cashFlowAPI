import { Routes, Route, NavLink } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Payments from './pages/Payments'
import Copilot from './pages/Copilot'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/copilot" element={<Copilot />} />
      </Routes>
    </Layout>
  )
}
