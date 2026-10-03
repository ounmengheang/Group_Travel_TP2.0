import { ArrowRight, CheckCircle2, FastForward, Loader2, RotateCcw } from 'lucide-react'
import { useGroup } from '../state/context'
import { ME_ID, ORGANIZER_ID, nextStep } from '../state/groupState'
import { PEOPLE, AVATAR_COLORS } from '../data/mockData'

// The two people the tester plays. Each has their own interface.
const ROLES = [
  { id: 'organizer', personId: ORGANIZER_ID, label: 'Organizer' },
  { id: 'member', personId: ME_ID, label: 'Member' },
].map((role) => {
  const index = PEOPLE.findIndex((p) => p.name.toLowerCase() === role.personId)
  return { ...role, name: PEOPLE[index].name, color: AVATAR_COLORS[index % AVATAR_COLORS.length] }
})

export function TopBar() {
  const { state, dispatch, role, setRole } = useGroup()
  const step = nextStep(state)
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-brand-500">Trip.com</span>
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-600">Group Trip</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-muted">Pitch prototype · dummy data</span>
        </div>

        <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Interface">
          {ROLES.map((r) => {
            const active = role === r.id
            const needsAction = step.who === r.id && !active
            return (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setRole(r.id)}
                className={`relative flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-1.5 text-left transition ${active ? 'bg-white shadow-card' : 'hover:bg-white/60'}`}
              >
                <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${r.color}`}>{r.name[0]}</span>
                <span>
                  <span className="block text-sm font-semibold leading-tight">{r.label}</span>
                  <span className="block text-xs leading-tight text-muted">{r.name}</span>
                </span>
                {needsAction && <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-rose-500 ring-2 ring-white" />}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'RESET' })
            setRole('organizer')
          }}
          className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-slate-100 hover:text-ink"
        >
          <RotateCcw className="h-4 w-4" /> Reset demo
        </button>
      </div>
      <GuideBar step={step} />
    </header>
  )
}

// One line that always says whose turn it is, so a tester is never lost between roles.
function GuideBar({ step }) {
  const { dispatch, role, setRole } = useGroup()
  const other = step.who === 'organizer' || step.who === 'member' ? ROLES.find((r) => r.id === step.who) : null
  const here = other && other.id === role
  return (
    <div className="border-t border-slate-100 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2 text-sm sm:px-6">
        <span className="rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Next step</span>
        {step.who === 'wait' && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
        {step.who === 'done' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        <p className="font-medium">
          {other && <span className="text-muted">{here ? 'You' : `${other.label} (${other.name})`}: </span>}
          {step.text}
        </p>
        {other && !here && (
          <button
            type="button"
            onClick={() => setRole(other.id)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-600"
          >
            Switch to {other.label} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
        {step.who === 'time' && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'FAST_FORWARD' })}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600"
          >
            <FastForward className="h-3.5 w-3.5" /> Fast-forward time
          </button>
        )}
      </div>
    </div>
  )
}

export function Toast() {
  const { toast } = useGroup()
  if (!toast) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-6">
      <div key={toast.id} className="flex animate-toast items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-xl">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
        {toast.message}
      </div>
    </div>
  )
}

// Page shell shared by both interfaces: a coloured role banner, then main + sidebar.
export function Page({ tone, banner, children, aside }) {
  const tones = { organizer: 'bg-brand-500 text-white', member: 'bg-amber-100 text-amber-900' }
  return (
    <div className="animate-fade-up">
      <div className={tones[tone]}>
        <p className="mx-auto max-w-6xl px-4 py-1.5 text-xs font-semibold sm:px-6">{banner}</p>
      </div>
      <div className={`mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 ${aside ? 'lg:grid-cols-[minmax(0,1fr)_340px]' : ''}`}>
        <main className="min-w-0 space-y-5">{children}</main>
        {aside && <aside className="space-y-5">{aside}</aside>}
      </div>
    </div>
  )
}
