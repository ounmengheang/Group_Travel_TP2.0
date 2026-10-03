import { AlarmClock, Check, Copy, Link2, MessageCircle, Minus, PartyPopper, Plus, Send, UserMinus, UsersRound, X } from 'lucide-react'
import { useState } from 'react'
import Avatar from '../components/Avatar'
import DayPlan from '../components/DayPlan'
import { Page } from '../components/Layout'
import { MemberList, Modal, PayCard, RoomsCard, Row, RulesCard, SectionTitle, StageSteps, StayIcon, VoteCard, Why } from '../components/shared'
import TripOverview from '../components/TripOverview'
import { Button, Card, ProgressBar } from '../components/ui'
import { GROUP_DEFAULTS, PAY_WINDOWS, PEOPLE, STAYS, TRIP } from '../data/mockData'
import { groupLink, usd } from '../lib/format'
import { perPerson } from '../lib/pricing'
import { useTimeLeft } from '../lib/useTimeLeft'
import { useGroup } from '../state/context'
import {
  ORGANIZER_ID,
  allSettled,
  approvalCount,
  canApplyFix,
  fixOptions,
  joined,
  lockedStay,
  organizerOf,
  owes,
  secured,
  travellers,
  voteOptions,
  voteWinner,
} from '../state/groupState'

const BANNER = 'Organizer interface · You are Boramey. You set the trip up and book it. You never collect passports or pay for others.'

export default function OrganizerApp() {
  const { state } = useGroup()
  const [creating, setCreating] = useState(false)
  if (state.stage === 'draft') return creating ? <CreateGroup onBack={() => setCreating(false)} /> : <TripPage onCreate={() => setCreating(true)} />
  return <Dashboard />
}

// Price range across the stay options for a group of `size`, before anyone has joined.
function priceRange(size) {
  const people = PEOPLE.slice(0, size)
  const prices = STAYS.map((stay) => perPerson(stay, people))
  return [Math.min(...prices), Math.max(...prices)]
}

// ---- Step 1: the trip the organizer found ----

function TripPage({ onCreate }) {
  const [low, high] = priceRange(GROUP_DEFAULTS.size)
  return (
    <Page
      tone="organizer"
      banner={BANNER}
      aside={
        <>
          <Card className="space-y-4">
            <div>
              <p className="text-sm text-muted">Flight + stay, per person</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight">
                {usd(low)}–{usd(high)}
              </p>
              <p className="text-xs text-muted">For a group of {GROUP_DEFAULTS.size}. Depends on the stay the group votes for.</p>
            </div>
            <Button onClick={onCreate}>
              <UsersRound className="h-5 w-5" /> Create Group Trip
            </Button>
            <p className="text-center text-xs text-muted">Free to set up. Nobody pays until the price is locked.</p>
          </Card>
          <Card className="space-y-3">
            <SectionTitle>Going with friends?</SectionTitle>
            {[
              'Share one link. Friends add their own passport details.',
              'The group votes on a stay everyone can afford.',
              'Everyone pays their own share. You never front the money.',
              'If someone drops out, the trip adjusts instead of collapsing.',
            ].map((line) => (
              <p key={line} className="flex gap-2.5 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3} /> {line}
              </p>
            ))}
          </Card>
        </>
      }
    >
      <TripOverview />
      <DayPlan />
    </Page>
  )
}

// ---- Step 2: group size, minimum, payment window ----

function Stepper({ value, min, max, onChange }) {
  const button = 'grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'
  return (
    <div className="flex items-center gap-3">
      <button type="button" aria-label="Decrease" className={button} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-6 text-center text-xl font-bold">{value}</span>
      <button type="button" aria-label="Increase" className={button} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

function CreateGroup({ onBack }) {
  const { dispatch, notify } = useGroup()
  const [name, setName] = useState(GROUP_DEFAULTS.name)
  const [size, setSize] = useState(GROUP_DEFAULTS.size)
  const [min, setMin] = useState(GROUP_DEFAULTS.min)
  const [payHours, setPayHours] = useState(GROUP_DEFAULTS.payHours)
  const safeMin = Math.min(min, size)
  const invitees = PEOPLE.slice(1, size)
  const [low, high] = priceRange(size)

  const create = () => {
    dispatch({ type: 'CREATE', group: { name: name.trim() || GROUP_DEFAULTS.name, size, min: safeMin, payHours } })
    notify('Group created. Now share the invite link')
  }

  return (
    <Page
      tone="organizer"
      banner={BANNER}
      aside={
        <Card className="space-y-3">
          <SectionTitle>Summary</SectionTitle>
          <div className="text-sm">
            <Row label="Trip" value={TRIP.title} />
            <Row label="Dates" value={TRIP.dates} />
            <Row label="Travellers" value={size} />
            <Row label="Goes ahead with" value={`${safeMin} or more`} />
            <Row label="Per person" value={`${usd(low)}–${usd(high)}`} strong />
          </div>
          <Button onClick={create}>Create &amp; get invite link</Button>
          <button type="button" onClick={onBack} className="w-full cursor-pointer py-1 text-sm font-medium text-muted hover:text-ink">
            Back to the trip
          </button>
        </Card>
      }
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Create group trip</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Set the group rules once</h1>
        <p className="mt-1 text-muted">Your friends see these rules, and the reason for each, before they join.</p>
      </div>

      <Card className="space-y-6">
        <label className="block">
          <span className="text-sm font-semibold">Group name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">How many travellers, including you?</p>
              <p className="text-xs text-muted">You plus {invitees.map((p) => p.name).join(', ')}</p>
            </div>
            <Stepper value={size} min={4} max={PEOPLE.length} onChange={setSize} />
          </div>
          <div className="flex flex-wrap gap-2">
            {PEOPLE.slice(0, size).map((p, i) => (
              <span key={p.name} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-1 pr-3 text-xs font-medium">
                <Avatar member={{ name: p.name, color: 'bg-white text-ink' }} size="xs" /> {p.name}
                {i === 0 && ' (you)'}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Minimum travellers for the trip to go ahead</p>
              <p className="text-xs text-muted">Between 2 and {size}</p>
            </div>
            <Stepper value={safeMin} min={2} max={size} onChange={setMin} />
          </div>
          <Why>
            With a minimum of {safeMin}, the trip is booked as soon as {safeMin} people have paid. One slow or missing friend can't block everyone else. If fewer than{' '}
            {safeMin} commit, nobody is charged.
          </Why>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold">How long does everyone get to pay?</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PAY_WINDOWS.map((w) => (
              <button
                key={w.hours}
                type="button"
                onClick={() => setPayHours(w.hours)}
                className={`cursor-pointer rounded-2xl border-2 py-2.5 text-sm font-semibold transition ${
                  payHours === w.hours ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-100 text-muted'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
          <Why>
            The clock starts when the group has voted and the price is locked. Airlines and hotels only hold a price for a limited time, so a shorter window keeps today's
            price. Anyone late gets a reminder and 12 extra hours.
          </Why>
        </div>
      </Card>
    </Page>
  )
}

// ---- The organizer's master dashboard ----

function Dashboard() {
  const { state } = useGroup()
  const { stage } = state
  return (
    <Page tone="organizer" banner={BANNER} aside={<Sidebar />}>
      <Card className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Group dashboard</p>
            <h1 className="text-3xl font-extrabold tracking-tight">{state.group.name}</h1>
            <p className="text-sm text-muted">
              {TRIP.from.city} → {TRIP.to.city} · {TRIP.dates}
            </p>
          </div>
        </div>
        <StageSteps />
      </Card>

      {stage === 'inviting' && <InviteStep />}
      {stage === 'voting' && <VoteStep />}
      {stage === 'paying' && <PayStep />}
      {stage === 'change' && <ChangeStep />}
      {stage === 'booked' && <BookedStep />}

      <div className="space-y-3">
        <SectionTitle hint="Budgets and votes stay private, even from you">Travellers</SectionTitle>
        <MemberList viewerId={ORGANIZER_ID} detailed />
      </div>

      <Activity />
    </Page>
  )
}

function Sidebar() {
  const { state } = useGroup()
  const stay = lockedStay(state)
  const people = travellers(state)
  const inGroup = joined(state)
  const invited = state.members.filter((m) => !['declined', 'expired', 'left'].includes(m.status))
  const timeLeft = useTimeLeft(state.deadlineAt)
  const total = state.price != null ? state.price * people.length : null
  const voted = inGroup.filter((m) => m.vote).length
  const paid = people.filter((m) => m.status === 'joined' && owes(state, m) === 0).length

  return (
    <>
      <Card className="space-y-4">
        <SectionTitle>Group status</SectionTitle>
        {stay ? (
          <div className="flex items-center gap-3">
            <StayIcon id={stay.id} />
            <div>
              <p className="font-semibold">{stay.fullName}</p>
              <p className="text-xs text-muted">Chosen by group vote</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">
            {state.stage === 'voting' ? 'The group is voting on the stay now.' : 'Stay not chosen yet. The group votes once enough people have joined.'}
          </p>
        )}

        {state.price != null && (
          <div className="rounded-2xl bg-ink p-4 text-white">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-white/60">Secured</p>
                <p className="text-2xl font-extrabold tracking-tight">
                  {usd(secured(state))} <span className="text-sm font-medium text-white/60">/ {usd(total)}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/60">Per person</p>
                <p className="text-lg font-bold">{usd(state.price)}</p>
              </div>
            </div>
            <div className="mt-3">
              <ProgressBar value={secured(state)} max={total} dark />
            </div>
            {isCollecting(state) && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-white/70">
                <AlarmClock className="h-3.5 w-3.5" /> {state.deadlinePassed ? 'Deadline passed · 12h extension running' : `Payment window: ${timeLeft}`}
              </p>
            )}
          </div>
        )}

        <Progress label="Joined, with own details" value={inGroup.length} max={invited.length} />
        {state.stage === 'voting' && <Progress label="Voted" value={voted} max={inGroup.length} />}
        {state.price != null && <Progress label="Paid in full" value={paid} max={people.length} />}
        <p className="text-xs text-muted">
          Minimum to go ahead: {state.group.min}. {inGroup.length >= state.group.min ? 'Reached.' : `${state.group.min - inGroup.length} more needed.`}
        </p>
      </Card>
      <RoomsCard />
      <RulesCard />
    </>
  )
}

const isCollecting = (state) => state.stage === 'paying' && !allSettled(state)

function Progress({ label, value, max }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-semibold">
          {value}/{max}
        </span>
      </div>
      <ProgressBar value={value} max={max} />
    </div>
  )
}

// ---- Stage: invite ----

function InviteStep() {
  const { state, dispatch, notify } = useGroup()
  const [sharing, setSharing] = useState(false)
  const link = groupLink(state.group.name)
  const inGroup = joined(state).length
  const waiting = state.members.filter((m) => m.status === 'invited').length
  const ready = inGroup >= state.group.min

  const share = (channel) => {
    dispatch({ type: 'SHARE' })
    setSharing(false)
    notify(channel === 'copy' ? 'Link copied' : `Invite sent on ${channel}`)
  }

  return (
    <Card className="space-y-4">
      <SectionTitle hint={`${inGroup} of ${state.members.length} joined`}>{state.linkShared ? 'Friends are joining' : 'Invite your friends'}</SectionTitle>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium">
          <Link2 className="h-4 w-4 shrink-0 text-brand-500" />
          <span className="truncate">{link}</span>
        </div>
        <Button className="sm:w-auto" variant={state.linkShared ? 'secondary' : 'primary'} onClick={() => setSharing(true)}>
          <Send className="h-4 w-4" /> {state.linkShared ? 'Share again' : 'Share invite link'}
        </Button>
      </div>
      <p className="text-sm text-muted">Each friend opens the link, adds their own traveller details, and sets a private budget and room preference.</p>

      {state.linkShared && (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <Button className="sm:w-auto" disabled={!ready} onClick={() => dispatch({ type: 'OPEN_VOTE' })}>
            Open the stay vote
          </Button>
          <Why tone={ready ? 'green' : 'brand'}>
            {ready
              ? `Minimum of ${state.group.min} reached, so you can start the vote.${waiting ? ` ${waiting} invited ${waiting === 1 ? 'friend has' : 'friends have'} not joined yet and can still join until you close the vote.` : ''}`
              : `You need ${state.group.min - inGroup} more to reach your minimum of ${state.group.min}. Remind friends or share the link again.`}
          </Why>
        </div>
      )}

      {sharing && (
        <Modal title="Share the invite link" subtitle={link} onClose={() => setSharing(false)}>
          <div className="grid gap-2">
            {[
              ['Telegram', Send],
              ['Messenger', MessageCircle],
            ].map(([channel, Icon]) => (
              <Button key={channel} variant="secondary" onClick={() => share(channel)}>
                <Icon className="h-4 w-4" /> Send on {channel}
              </Button>
            ))}
            <Button variant="ghost" onClick={() => share('copy')}>
              <Copy className="h-4 w-4" /> Copy link
            </Button>
          </div>
        </Modal>
      )}
    </Card>
  )
}

// ---- Stage: vote ----

function VoteStep() {
  const { state, dispatch } = useGroup()
  const people = joined(state)
  const voted = people.filter((m) => m.vote).length
  const leader = voteWinner(state)
  const over = voteOptions(state).filter((o) => !o.votable).length
  const canClose = Boolean(organizerOf(state).vote) && voted > people.length / 2

  return (
    <>
      <VoteCard viewerId={ORGANIZER_ID} />
      <Card className="space-y-3">
        <SectionTitle hint={`${voted} of ${people.length} voted`}>Close the vote</SectionTitle>
        <p className="text-sm text-muted">
          {voted === people.length ? 'Everyone has voted. ' : 'You can close once more than half have voted. '}
          Closing makes <span className="font-semibold text-ink">{leader.stay.name}</span> the final stay and locks the price at{' '}
          <span className="font-semibold text-ink">{usd(leader.price)} per person</span>. The payment window then starts.
        </p>
        {over > 0 && (
          <Why>
            {over} {over === 1 ? 'option is' : 'options are'} left out because {over === 1 ? 'it is' : 'they are'} above someone's private budget. This keeps people from
            dropping out after the vote.
          </Why>
        )}
        <Button className="sm:w-auto" disabled={!canClose} onClick={() => dispatch({ type: 'CLOSE_VOTE', now: Date.now() })}>
          Close vote &amp; lock the price
        </Button>
      </Card>
    </>
  )
}

// ---- Stage: pay, then book ----

function PayStep() {
  const { state, dispatch, notify } = useGroup()
  const people = travellers(state)
  const unpaid = people.filter((m) => m.status !== 'joined' || owes(state, m) > 0)
  const settled = allSettled(state)

  return (
    <>
      {settled ? (
        <Card className="space-y-4 border-emerald-100 bg-emerald-50/60">
          <div className="flex items-start gap-4">
            <PartyPopper className="mt-0.5 h-7 w-7 shrink-0 text-emerald-600" />
            <div>
              <p className="text-xl font-bold">Everyone is in and paid</p>
              <p className="text-sm text-muted">
                {people.length} travellers · {usd(state.price * people.length)} secured · {lockedStay(state).fullName}
              </p>
            </div>
          </div>
          <Button className="sm:w-auto" onClick={() => dispatch({ type: 'BOOK' })}>
            {state.wasBooked ? 'Update the group booking' : `Book for all ${people.length} travellers`}
          </Button>
          <p className="text-sm text-muted">One tap books every flight and room together. Each traveller gets their own ticket.</p>
        </Card>
      ) : (
        <Card className="space-y-3">
          <SectionTitle hint={`${people.length - unpaid.length} of ${people.length} paid`}>Waiting for payments</SectionTitle>
          <p className="text-sm text-muted">
            Still to pay: <span className="font-semibold text-ink">{unpaid.map((m) => m.name).join(', ')}</span>. You don't need to chase anyone: reminders go out
            automatically.
          </p>
          {state.deadlinePassed && (
            <Why tone="amber">
              The payment deadline has passed. Unpaid travellers were reminded and have 12 more hours. After that their spot is released and you choose how the group adjusts.
            </Why>
          )}
          <Button variant="secondary" className="sm:w-auto" onClick={() => notify('Reminder sent to unpaid travellers')}>
            Send a reminder now
          </Button>
        </Card>
      )}
      <PayCard viewerId={ORGANIZER_ID} />
    </>
  )
}

// ---- Stage: someone dropped out ----

function ChangeStep() {
  const { state, dispatch } = useGroup()
  const { change } = state
  const options = fixOptions(state)
  const [choice, setChoice] = useState(() => options.find((o) => o.recommended)?.id)
  const dropped = state.members.filter((m) => change.dropped.includes(m.id))
  const active = joined(state)
  const proposal = options.find((o) => o.id === change.proposal)
  const rejected = active.filter((m) => change.approvals[m.id] === false)

  return (
    <Card className="space-y-4 border-amber-200">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
          <UserMinus className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xl font-bold">
            {dropped.map((m) => m.name).join(' and ')} {dropped.length === 1 ? 'is' : 'are'} out of the trip
          </p>
          <p className="text-sm text-muted">
            {dropped.map((m) => `${m.name}: ${m.leftReason.toLowerCase()}`).join(' · ')}. The trip is on hold, not cancelled. {active.length} travellers remain and the price
            was {usd(change.priceBefore)} each.
          </p>
        </div>
      </div>

      {!proposal ? (
        <>
          <p className="text-sm font-semibold">Pick how the group absorbs it. The remaining travellers approve before anything changes.</p>
          <div className="grid gap-3 md:grid-cols-2">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                disabled={o.disabled}
                onClick={() => setChoice(o.id)}
                className={`rounded-3xl border-2 p-4 text-left transition ${choice === o.id ? 'border-brand-500 bg-brand-50/40' : 'border-slate-100'} ${
                  o.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-brand-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold">{o.title}</p>
                  {o.recommended && <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Recommended</span>}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted">{o.detail}</p>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold tracking-tight">{usd(o.price)}</span>
                  <span className="text-xs text-muted">/ person</span>
                  <Delta value={o.delta} />
                </p>
                <p className={`mt-2 text-xs font-semibold ${o.disabled || o.over ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {o.disabled
                    ? `Leaves fewer than your minimum of ${state.group.min}`
                    : o.over
                      ? `Over budget for ${o.over} ${o.over === 1 ? 'traveller' : 'travellers'}`
                      : "Fits everyone's budget"}
                </p>
              </button>
            ))}
          </div>
          <Why>
            Flights are per person, so they leave with the traveller. The stay is shared, so its cost is split between fewer people. That is why the price can move.
          </Why>
          <Button className="sm:w-auto" disabled={!choice} onClick={() => dispatch({ type: 'PROPOSE', fixId: choice })}>
            Propose this to the group
          </Button>
        </>
      ) : (
        <>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Your proposal</p>
            <p className="mt-1 font-bold">{proposal.title}</p>
            <p className="text-sm text-muted">{proposal.detail}</p>
            <p className="mt-2 flex items-baseline gap-2 text-sm">
              New price <span className="text-xl font-extrabold">{usd(proposal.price)}</span> per person <Delta value={proposal.delta} />
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">
              Approvals: {approvalCount(state)} of {active.length} <span className="font-normal text-muted">(yours counts, more than half needed)</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {active.map((m) => {
                const answer = m.isOrganizer ? true : change.approvals[m.id]
                return (
                  <span key={m.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-1 pr-3 text-xs font-medium">
                    <Avatar member={m} size="xs" /> {m.name}
                    {answer === true && <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={3} />}
                    {answer === false && <X className="h-3.5 w-3.5 text-rose-600" strokeWidth={3} />}
                    {answer == null && <span className="text-muted">…</span>}
                  </span>
                )
              })}
            </div>
          </div>
          {rejected.length > 0 && <Why tone="amber">{rejected.map((m) => m.name).join(', ')} asked for another option. You can pick a different fix.</Why>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="sm:w-auto" disabled={!canApplyFix(state)} onClick={() => dispatch({ type: 'APPLY_FIX', now: Date.now() })}>
              Apply the change
            </Button>
            <Button variant="secondary" className="sm:w-auto" onClick={() => dispatch({ type: 'PROPOSE', fixId: null })}>
              Pick a different fix
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}

function Delta({ value }) {
  if (value === 0) return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-muted">No change</span>
  const up = value > 0
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${up ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
      {up ? '+' : '−'}
      {usd(Math.abs(value))} each
    </span>
  )
}

// ---- Stage: booked ----

function BookedStep() {
  const { state } = useGroup()
  const people = travellers(state)
  const stay = lockedStay(state)
  const total = state.price * people.length
  return (
    <Card className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 animate-pop place-items-center rounded-full bg-emerald-500 text-white">
          <Check className="h-6 w-6" strokeWidth={3} />
        </div>
        <div>
          <p className="text-2xl font-extrabold tracking-tight">Booking confirmed</p>
          <p className="text-sm text-muted">
            Reference {state.bookingRef} · {people.length} travellers · {stay.fullName}
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          [people.length, 'seats and beds booked together'],
          [usd(total), 'paid by the group, share by share'],
          [usd(state.price), 'is all you paid yourself'],
        ].map(([value, label]) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-4">
            <p className="text-2xl font-extrabold tracking-tight">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted">
        Every traveller received their own e-ticket and room confirmation. If someone cancels now, refunds follow the airline and hotel rules and the group gets the same
        fix options.
      </p>
    </Card>
  )
}

// ---- Activity feed ----

function Activity() {
  const { state } = useGroup()
  const dots = { good: 'bg-emerald-500', warn: 'bg-amber-500', info: 'bg-brand-500' }
  return (
    <div className="space-y-3">
      <SectionTitle hint="Everything that happened, newest first">Activity</SectionTitle>
      <Card className="space-y-2.5">
        {state.log.map((entry) => (
          <p key={entry.id} className="flex items-start gap-2.5 text-sm">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dots[entry.tone]}`} />
            {entry.text}
          </p>
        ))}
      </Card>
    </div>
  )
}
