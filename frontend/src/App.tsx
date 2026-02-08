import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Payments from './pages/Payments'
import Copilot from './pages/Copilot'
import Inventory from './pages/Inventory'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/copilot" element={<Copilot />} />
      </Routes>
    </Layout>
  )
}
