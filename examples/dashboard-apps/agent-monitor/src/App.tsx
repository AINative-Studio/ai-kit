import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { AgentDetails } from './pages/AgentDetails'
import { Logs } from './pages/Logs'
import { Performance } from './pages/Performance'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agent/:id" element={<AgentDetails />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/performance" element={<Performance />} />
      </Routes>
    </Layout>
  )
}

export default App
