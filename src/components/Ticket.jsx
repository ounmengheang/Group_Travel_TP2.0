import { Plane } from 'lucide-react'
import { TRIP } from '../data/mockData'

// Shared boarding-pass shell: dark top, perforated tear line, white bottom.
// Used for the trip, the payment checkout and the group-ready pass.
export default function Ticket({ top, children }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white shadow-card">
      <div className="bg-ink px-5 pb-5 pt-4 text-white">{top}</div>
      <div className="relative h-5">
        <span className="absolute -left-2.5 top-0 h-5 w-5 rounded-full bg-[#fbfcfd]" />
        <span className="absolute -right-2.5 top-0 h-5 w-5 rounded-full bg-[#fbfcfd]" />
        <span className="absolute inset-x-5 top-1/2 border-t-2 border-dashed border-slate-200" />
      </div>
      <div className="px-5 pb-5 pt-1 text-sm">{children}</div>
    </div>
  )
}

// Header row + big "PNH ✈ DPS" route.
export function TicketRoute({ label, meta = TRIP.dates, fromSub = TRIP.from.city, toSub = TRIP.to.city, middle }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-wider text-white/50">
        <span className="truncate">{label}</span>
        <span className="shrink-0">{meta}</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="text-3xl font-extrabold tracking-tight">{TRIP.from.code}</p>
          <p className="text-xs text-white/60">{fromSub}</p>
        </div>
        <div className="flex flex-1 flex-col items-center px-3">
          <div className="flex w-full items-center gap-2">
            <span className="h-px flex-1 border-t border-dashed border-white/30" />
            <Plane className="h-5 w-5 text-white" />
            <span className="h-px flex-1 border-t border-dashed border-white/30" />
          </div>
          {middle && <p className="mt-1 text-[10px] text-white/50">{middle}</p>}
        </div>
        <div className="text-right">
          <p className="text-3xl font-extrabold tracking-tight">{TRIP.to.code}</p>
          <p className="text-xs text-white/60">{toSub}</p>
        </div>
      </div>
    </>
  )
}

// Row of small labelled fields under the route.
export function TicketFields({ fields }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
      {fields.map(([label, value]) => (
        <div key={label}>
          <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
          <p className="truncate font-semibold">{value}</p>
        </div>
      ))}
    </div>
  )
}
