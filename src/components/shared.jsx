import {
  AlarmClock,
  BedDouble,
  Building2,
  Check,
  CheckCircle2,
  EyeOff,
  Info,
  Palmtree,
  ShieldCheck,
  Trees,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { PAY_WINDOWS, PAYMENT_METHODS, TRIP } from '../data/mockData'
import { usd } from '../lib/format'
import { roomLabel, stayShare } from '../lib/pricing'
import { useTimeLeft } from '../lib/useTimeLeft'
import { useGroup } from '../state/context'
import { joined, lockedStay, memberById, organizerOf, owes, travellers, voteOptions } from '../state/groupState'
import Avatar from './Avatar'
import StatusBadge from './StatusBadge'
import { Button, Card } from './ui'

const STAY_ICONS = { villa: Palmtree, hotel: Building2, guest: Trees }
const STAY_TILES = { villa: 'bg-teal-50 text-teal-600', hotel: 'bg-indigo-50 text-indigo-600', guest: 'bg-emerald-50 text-emerald-600' }

export function StayIcon({ id, className = 'h-12 w-12' }) {
  const Icon = STAY_ICONS[id]
  return (
    <div className={`grid shrink-0 place-items-center rounded-2xl ${STAY_TILES[id]} ${className}`}>
      <Icon className="h-1/2 w-1/2" />
    </div>
  )
}

export function SectionTitle({ children, hint }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-lg font-bold tracking-tight">{children}</h2>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

// A one-line reason next to a rule, so nobody has to guess why it exists.
export function Why({ children, tone = 'brand' }) {
  const tones = { brand: 'bg-brand-50 text-brand-700', amber: 'bg-amber-50 text-amber-800', green: 'bg-emerald-50 text-emerald-800' }
  return (
    <div className={`flex gap-2.5 rounded-2xl p-3.5 text-sm leading-relaxed ${tones[tone]}`}>
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{children}</p>
    </div>
  )
}

export function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/40 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-md animate-pop rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold">{title}</p>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// A prominent countdown, so a deadline is never a surprise.
export function Deadline({ label, at, passed }) {
  const timeLeft = useTimeLeft(at)
  if (!at) return null
  return (
    <div className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl px-4 py-3 ${passed ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-900'}`}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <AlarmClock className="h-4 w-4 shrink-0" /> {passed ? `${label}: deadline passed` : label}
      </p>
      <p className="text-xl font-extrabold tabular-nums tracking-tight">{passed ? '12h extension running' : timeLeft}</p>
    </div>
  )
}

// Join → Vote → Rooms → Pay → Booked, so everyone knows where the group is.
const STEPS = [
  { id: 'inviting', label: 'Join' },
  { id: 'voting', label: 'Vote' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'paying', label: 'Pay' },
  { id: 'booked', label: 'Booked' },
]

export function StageSteps() {
  const { state } = useGroup()
  const stage = state.stage === 'change' ? 'paying' : state.stage
  const current = STEPS.findIndex((s) => s.id === stage)
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((step, i) => {
        const done = i < current || state.stage === 'booked'
        const active = i === current && state.stage !== 'booked'
        return (
          <li key={step.id} className="flex flex-1 items-center gap-2">
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                done ? 'bg-emerald-500 text-white' : active ? 'bg-brand-500 text-white' : 'bg-slate-100 text-muted'
              }`}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
            </span>
            <span className={`text-sm font-semibold ${active ? 'text-ink' : 'hidden text-muted sm:inline'}`}>
              {step.label}
              {active && state.stage === 'change' && <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800">Plan change</span>}
            </span>
            {i < STEPS.length - 1 && <span className={`h-px flex-1 ${done ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
          </li>
        )
      })}
    </ol>
  )
}

// ---- Vote ----

export function VoteCard({ viewerId }) {
  const { state, dispatch, notify } = useGroup()
  const viewer = state.members.find((m) => m.id === viewerId)
  const organizer = organizerOf(state)
  const options = voteOptions(state)
  const voters = joined(state)
  const voted = voters.filter((m) => m.vote).length
  const [choice, setChoice] = useState(viewer.vote)
  const hasVoted = Boolean(viewer.vote)
  // If prices move (someone joined late) and the pick is no longer in the vote, clear it.
  const validChoice = options.find((o) => o.stay.id === choice && o.votable) ? choice : null

  const submit = () => {
    dispatch({ type: 'VOTE', id: viewerId, stayId: validChoice })
    notify(hasVoted ? 'Vote changed' : 'Vote submitted')
  }

  return (
    <Card className="space-y-4">
      <SectionTitle hint={`${voted} of ${voters.length} voted`}>Where should the group stay?</SectionTitle>
      <Deadline label="Vote closes in" at={state.voteEndsAt} />
      <p className="text-sm text-muted">
        Prices are per person for {voters.length} travellers: your flight ({usd(TRIP.flight.perPerson)}) plus your part of the stay. The exact price is locked once rooms
        are arranged.
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        {options.map(({ stay, price, over, votable, votes }) => {
          const selected = validChoice === stay.id
          return (
            <button
              key={stay.id}
              type="button"
              disabled={!votable}
              onClick={() => setChoice(stay.id)}
              className={`flex flex-col rounded-3xl border-2 p-4 text-left transition ${
                selected ? 'border-brand-500 bg-brand-50/40' : 'border-slate-100 bg-white'
              } ${votable ? 'cursor-pointer hover:border-brand-200' : 'cursor-not-allowed opacity-60'}`}
            >
              <div className="flex items-start justify-between">
                <StayIcon id={stay.id} />
                <span className={`grid h-6 w-6 place-items-center rounded-full border-2 ${selected ? 'border-brand-500 bg-brand-500' : 'border-slate-200'}`}>
                  {selected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </span>
              </div>
              <p className="mt-3 font-bold">{stay.name}</p>
              <p className="text-xs text-muted">{stay.area} · ★ {stay.rating}</p>
              <p className="mt-2 text-2xl font-extrabold tracking-tight">
                {usd(price)}
                <span className="text-xs font-medium text-muted"> / person</span>
              </p>
              <p className="mt-2 text-xs text-muted">{stay.perks.join(' · ')}</p>
              <p className={`mt-3 text-xs font-semibold ${votable ? 'text-emerald-700' : 'text-rose-600'}`}>
                {votable && over === 0 && "Fits everyone's budget"}
                {votable && over > 0 && 'Closest to every budget'}
                {!votable && `Over budget for ${over} ${over === 1 ? 'traveller' : 'travellers'} · not in this vote`}
              </p>
              {hasVoted && votable && (
                <div className="mt-3 w-full">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${(votes / voters.length) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs font-semibold">
                    {votes} {votes === 1 ? 'vote' : 'votes'}
                  </p>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button className="sm:w-auto" onClick={submit} disabled={!validChoice || validChoice === viewer.vote}>
          {hasVoted ? 'Change my vote' : 'Submit my vote'}
        </Button>
        {hasVoted && <p className="text-sm font-medium text-emerald-700">You voted. Totals update as others vote.</p>}
      </div>

      <Why>
        Votes are anonymous: everyone sees totals, not who chose what. You can change your vote until {viewer.isOrganizer ? 'you close' : `${organizer.name} closes`} the
        vote, or the timer runs out. The winner becomes the final stay. A tie goes to the cheaper option.
      </Why>
    </Card>
  )
}

// ---- Pay ----

export function PayCard({ viewerId }) {
  const { state, dispatch, notify } = useGroup()
  const viewer = state.members.find((m) => m.id === viewerId)
  const stay = lockedStay(state)
  const due = owes(state, viewer)
  const count = travellers(state).length
  const [method, setMethod] = useState(PAYMENT_METHODS[0].id)
  const isTopUp = viewer.paid > 0

  if (due === 0) {
    return (
      <Card className="flex items-start gap-4 border-emerald-100 bg-emerald-50/60">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
        <div>
          <p className="font-bold">You paid {usd(viewer.paid)}</p>
          <p className="mt-0.5 text-sm text-muted">
            {state.stage === 'booked' ? 'Charged at booking.' : 'Held by Trip.com until the whole group is ready to book.'}
            {viewer.refund > 0 && ` ${usd(viewer.refund)} was refunded after the price dropped.`}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="space-y-4">
      <SectionTitle>{isTopUp ? 'Pay your top-up' : 'Pay your share'}</SectionTitle>
      <Deadline label="Time left to pay" at={state.deadlineAt} passed={state.deadlinePassed} />

      <div className="rounded-2xl bg-slate-50 p-4 text-sm">
        <Row label={`Flight ${TRIP.from.code} → ${TRIP.to.code} (yours alone)`} value={usd(TRIP.flight.perPerson)} />
        <Row label={`${stay.name}, split between ${count}`} value={usd(stayShare(state.price))} />
        <Row label="Your price" value={usd(state.price)} strong />
        {isTopUp && <Row label="Already paid" value={`− ${usd(viewer.paid)}`} />}
        <div className="mt-3 flex items-end justify-between border-t border-slate-200 pt-3">
          <span className="font-semibold">{isTopUp ? 'Top-up due now' : 'Due now'}</span>
          <span className="text-3xl font-extrabold tracking-tight">{usd(due)}</span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id)}
            className={`cursor-pointer rounded-2xl border-2 px-4 py-3 text-left transition ${method === m.id ? 'border-brand-500 bg-brand-50/40' : 'border-slate-100'}`}
          >
            <p className="text-sm font-semibold">{m.label}</p>
            <p className="text-xs text-muted">{m.detail}</p>
          </button>
        ))}
      </div>

      <Button
        className="sm:w-auto"
        onClick={() => {
          dispatch({ type: 'PAY', id: viewerId })
          notify(`Paid ${usd(due)} · held until the group books`)
        }}
      >
        Pay {usd(due)}
      </Button>

      <Why>
        Trip.com holds your payment and only charges it when the whole group books. If the trip doesn't go ahead, you get all of it back.
      </Why>
    </Card>
  )
}

export function Row({ label, value, strong }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-1 ${strong ? 'font-semibold' : 'text-muted'}`}>
      <span>{label}</span>
      <span className={strong ? '' : 'font-medium text-ink'}>{value}</span>
    </div>
  )
}

// ---- Rooms ----

export function RoomsCard({ highlightId }) {
  const { state } = useGroup()
  const stay = lockedStay(state)
  if (!stay || !state.rooms) return null
  if (state.stage === 'change') {
    return (
      <Card className="space-y-2">
        <SectionTitle hint={stay.name}>Rooms</SectionTitle>
        <p className="text-sm text-muted">On hold. Rooms are re-arranged once the group agrees how to adjust.</p>
      </Card>
    )
  }
  const nameOf = (id) => {
    const m = memberById(state, id)
    return `${m.name}${m.status === 'invited' ? ' (joining)' : ''}`
  }
  return (
    <Card className="space-y-3">
      <SectionTitle hint={stay.name}>Rooms</SectionTitle>
      {state.rooms.map((room) => {
        const mine = room.ids.includes(highlightId)
        return (
          <div key={room.ids.join('-')} className={`flex items-center gap-3 rounded-2xl p-3 ${mine ? 'bg-brand-50' : 'bg-slate-50'}`}>
            <BedDouble className={`h-5 w-5 shrink-0 ${mine ? 'text-brand-600' : 'text-muted'}`} />
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {roomLabel(stay, room)}
                {mine && <span className="ml-1.5 text-xs font-medium text-brand-600">Your room</span>}
              </p>
              <p className="truncate text-xs text-muted">{room.ids.map(nameOf).join(' + ')}</p>
            </div>
          </div>
        )
      })}
      <p className="text-xs text-muted">
        {state.price == null ? 'Not final yet. The organizer confirms the rooms.' : 'Arranged from roommate wishes and room preferences.'}
      </p>
    </Card>
  )
}

// ---- Rules, each with its reason ----

export function RulesCard() {
  const { state } = useGroup()
  const { min, payHours } = state.group
  const windowLabel = PAY_WINDOWS.find((w) => w.hours === payHours)?.label ?? `${payHours} hours`
  const rules = [
    [Users, `Minimum ${min} travellers`, `The trip goes ahead once ${min} people have paid, so one slow person can't block everyone. If the group falls below it, the organizer decides: replace, continue with fewer, or cancel with refunds.`],
    [AlarmClock, `${windowLabel} to pay`, 'Flight and room prices are only held for a short time. Late payers get a reminder and 12 extra hours before their spot is released.'],
    [ShieldCheck, 'If someone drops out', 'Rooms and price are recalculated and the group picks a fix. Nobody pays more without approving it.'],
    [EyeOff, 'Private by default', 'Budgets and votes are never shown to the group. Passport details go only to the airline.'],
  ]
  return (
    <Card className="space-y-4">
      <SectionTitle>How this group works</SectionTitle>
      {rules.map(([Icon, title, text]) => (
        <div key={title} className="flex gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs leading-relaxed text-muted">{text}</p>
          </div>
        </div>
      ))}
    </Card>
  )
}

// ---- Members ----

function memberBadges(state, m, detailed) {
  if (m.status === 'invited') return [['invited', m.replacement ? 'Invited to the open spot' : state.linkShared ? 'Invited' : 'Not invited yet']]
  if (m.status === 'declined') return [['removed', 'Declined']]
  if (m.status === 'expired') return [['removed', 'Did not join in time']]
  if (m.status === 'left') return [['removed', m.leftReason ?? 'Left']]
  const badges = [['done', 'Details added']]
  if (state.stage === 'voting') badges.push(m.vote ? ['done', 'Voted'] : ['pending', 'Not voted yet'])
  if (state.stage === 'rooms' && !m.isOrganizer) badges.push(m.wished ? ['done', 'Roommate chosen'] : ['pending', 'Choosing roommate'])
  if (state.stage === 'cancelled') return [...badges, m.refund ? ['done', detailed ? `Refunded ${usd(m.refund)}` : 'Refunded'] : ['invited', 'Nothing to refund']]
  if (state.price != null) {
    const due = owes(state, m)
    if (due === 0) badges.push(['done', detailed ? `Paid ${usd(m.paid)}` : 'Paid'])
    else if (m.paid > 0) badges.push(['pending', detailed ? `Top-up ${usd(due)} due` : 'Top-up due'])
    else badges.push([state.deadlinePassed ? 'due' : 'pending', 'Not paid yet'])
    if (m.reminded && due > 0) badges.push(['reminded', 'Reminded · 12h extension'])
  }
  if (state.change?.proposal && !m.isOrganizer) {
    const answer = state.change.approvals[m.id]
    badges.push(answer === true ? ['done', 'Approved change'] : answer === false ? ['due', 'Wants another option'] : ['pending', 'Reviewing change'])
  }
  return badges
}

// `detailed`: the organizer's view, with amounts and room preference.
export function MemberList({ viewerId, detailed = false }) {
  const { state } = useGroup()
  return (
    <Card className="space-y-1 p-3!">
      {state.members.map((m) => {
        const gone = ['left', 'declined', 'expired'].includes(m.status)
        return (
          <div key={m.id} className={`flex flex-wrap items-center gap-3 rounded-2xl px-3 py-2.5 ${m.id === viewerId ? 'bg-brand-50' : ''} ${gone ? 'opacity-60' : ''}`}>
            <Avatar member={m} done={m.status === 'joined' && state.price != null && owes(state, m) === 0} />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 text-[15px] font-semibold">
                {m.name}
                {m.id === viewerId && <span className="text-xs font-medium text-brand-600">(You)</span>}
                {m.isOrganizer && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-muted">Organizer</span>}
              </p>
              {detailed && m.status === 'joined' && (
                <p className="text-xs text-muted">Budget set (private) · Room: {m.roomPref === 'same' ? 'same gender only' : 'anyone'}</p>
              )}
            </div>
            <div className="flex basis-full flex-wrap gap-1.5 pl-[52px] sm:basis-auto sm:justify-end sm:pl-0">
              {memberBadges(state, m, detailed).map(([tone, text]) => (
                <StatusBadge key={text} tone={tone}>
                  {text}
                </StatusBadge>
              ))}
            </div>
          </div>
        )
      })}
    </Card>
  )
}
