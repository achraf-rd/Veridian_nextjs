import type { Actor } from '@/types/agent2'

interface Props {
  actors: Actor[]
}

export default function ActorsPanel({ actors }: Props) {
  if (actors.length === 0) {
    return <p className="text-xs text-vrd-text-dim italic">No dynamic actors</p>
  }

  return (
    <div className="space-y-1.5">
      {actors.map((a) => (
        <div key={a.id} className="rounded-lg bg-vrd-card-hover px-3 py-2 text-xs grid grid-cols-2 gap-x-4 gap-y-0.5">
          <span className="text-vrd-text-dim">ID</span>
          <span className="font-mono text-vrd-text">{a.id}</span>
          <span className="text-vrd-text-dim">Type</span>
          <span className="text-vrd-text capitalize">{a.type}</span>
          <span className="text-vrd-text-dim">Lane</span>
          <span className="text-vrd-text">{a.lane}</span>
          <span className="text-vrd-text-dim">Distance</span>
          <span className="text-vrd-text">{a.initial_distance} m</span>
          <span className="text-vrd-text-dim">Speed</span>
          <span className="text-vrd-text">{a.speed} km/h</span>
          <span className="text-vrd-text-dim">Behavior</span>
          <span className="text-vrd-text">{a.behavior}</span>
        </div>
      ))}
    </div>
  )
}
