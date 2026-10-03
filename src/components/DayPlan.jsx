import { Landmark, PlaneLanding, PlaneTakeoff, Ship, Trees } from 'lucide-react'
import { DAY_PLAN } from '../data/mockData'

const ICONS = { arrive: PlaneLanding, nature: Trees, island: Ship, temple: Landmark, depart: PlaneTakeoff }

// Day-by-day trip plan. `compact` shows one line per day.
export default function DayPlan({ compact = false }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white shadow-card">
      <p className="px-5 pt-4 font-semibold">{compact ? 'The plan' : 'Day by day'}</p>
      <ol className="px-5 pb-3 pt-2">
        {DAY_PLAN.map((d, i) => {
          const Icon = ICONS[d.icon]
          const last = i === DAY_PLAN.length - 1
          return (
            <li key={d.day} className="relative flex gap-3 pb-3">
              {/* timeline connector */}
              {!last && <span className="absolute left-[17px] top-9 bottom-0 w-px bg-slate-200" />}
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 pt-1.5">
                <p className="text-sm">
                  <span className="font-semibold">Day {d.day}</span>
                  <span className="text-muted"> · {d.date} · </span>
                  <span className="font-semibold">{d.title}</span>
                </p>
                {!compact && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {d.places.map((p) => (
                      <span key={p} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-muted">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
