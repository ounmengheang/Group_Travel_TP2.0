import { BedDouble, CalendarDays, Moon, Star } from 'lucide-react'
import { TRIP } from '../data/mockData'
import Ticket, { TicketRoute } from './Ticket'

function BeachScene() {
  return (
    <svg viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe3ff" />
          <stop offset="1" stopColor="#fdf1dc" />
        </linearGradient>
      </defs>
      <rect width="400" height="140" fill="url(#sky)" />
      <circle cx="305" cy="46" r="24" fill="#ffd27a" />
      <path d="M0 84 Q100 74 200 84 T400 84 V140 H0Z" fill="#7fd0ef" />
      <path d="M0 100 Q100 92 200 100 T400 100 V140 H0Z" fill="#3aaee0" />
      <path d="M0 124 Q130 110 260 122 T400 118 V140 H0Z" fill="#f4dcae" />
      <path d="M78 128 Q86 90 104 60" stroke="#8a5a3b" strokeWidth="5" fill="none" strokeLinecap="round" />
      <g fill="#2f9e63">
        <path d="M104 60 Q82 48 60 58 Q84 54 104 63Z" />
        <path d="M104 60 Q124 40 148 48 Q126 51 105 63Z" />
        <path d="M104 60 Q101 38 86 30 Q99 44 102 62Z" />
        <path d="M104 60 Q128 60 140 78 Q122 65 103 63Z" />
      </g>
    </svg>
  )
}

// Hero + flight ticket. `stay` is optional: before the vote there is no stay yet.
export default function TripOverview({ stay, subtitle }) {
  const { from, to, flight } = TRIP
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl bg-white shadow-card">
        <div className="h-36 sm:h-44">
          <BeachScene />
        </div>
        <div className="space-y-2 p-5">
          <h1 className="text-3xl font-extrabold tracking-tight">{TRIP.title}</h1>
          <p className="text-muted">{subtitle ?? `${from.city} → ${to.city}`}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              [CalendarDays, TRIP.dates],
              [Moon, `${TRIP.nights} nights`],
            ].map(([Icon, label]) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                <Icon className="h-3.5 w-3.5 text-brand-500" /> {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <Ticket
        top={
          <TicketRoute
            label="Flight"
            fromSub={`${flight.depart} · ${from.city}`}
            toSub={`${to.city} · ${flight.arrive}`}
            middle={`${flight.duration} · ${flight.stops}`}
          />
        }
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <BedDouble className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{stay ? stay.fullName : 'Stay chosen by group vote'}</p>
            <p className="text-xs text-muted">
              {TRIP.nights} nights · {TRIP.dates}
            </p>
          </div>
          {stay && (
            <span className="flex items-center gap-1 font-semibold">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {stay.rating}
            </span>
          )}
        </div>
      </Ticket>
    </div>
  )
}
