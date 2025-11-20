import { useParams } from 'react-router-dom'

export function AgentDetails() {
  const { id } = useParams()

  return (
    <div>
      <h1 className="text-3xl font-bold">Agent Details: {id}</h1>
      <p className="text-muted-foreground mt-2">
        Detailed view of agent execution and performance
      </p>
    </div>
  )
}
