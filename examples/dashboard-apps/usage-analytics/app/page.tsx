import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Overview } from '@/components/dashboard/Overview'
import { UsageMetrics } from '@/components/dashboard/UsageMetrics'
import { CostAnalysis } from '@/components/dashboard/CostAnalysis'
import { ModelComparison } from '@/components/dashboard/ModelComparison'

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <Overview />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UsageMetrics />
            <CostAnalysis />
          </div>
          <ModelComparison />
        </main>
      </div>
    </div>
  )
}
