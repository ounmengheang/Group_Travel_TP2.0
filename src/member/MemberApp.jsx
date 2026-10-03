import { Ban, Check, CheckCircle2, Hourglass, Inbox, LogOut, Plane, ShieldCheck, UserMinus } from 'lucide-react'
import { useState } from 'react'
import Avatar, { AvatarStack } from '../components/Avatar'
import DayPlan from '../components/DayPlan'
import { Page } from '../components/Layout'
import { MemberList, Modal, PayCard, RoomsCard, Row, RulesCard, SectionTitle, StageSteps, VoteCard, Why } from '../components/shared'
import Ticket, { TicketFields, TicketRoute } from '../components/Ticket'
import TripOverview from '../components/TripOverview'
import { Button, Card } from '../components/ui'
import { BAGGAGE_OPTIONS, BUDGET_RANGES, MEMBER_INFO_PREFILL, PAY_WINDOWS, ROOM_PREFS, TRIP } from '../data/mockData'
import { groupLink, usd } from '../lib/format'
import { canShare, roomLabel } from '../lib/pricing'
import { useGroup } from '../state/context'
import { ME_ID, fixOptions, joined, lockedStay, memberById, meOf, organizerOf, owes, planned, refundFor, roomOf, roomsPrice, travellers, voteOptions } from '../state/groupState'

const BANNER = 'Member interface · You are Panhar, one of the invited friends. You add your own details, vote, and pay only your share.'
const inputClass =
  'mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[15px] font-medium outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100'

export default function MemberApp() {
  const { state, dispatch } = useGroup()
  const me = meOf(state)
  const [screen, setScreen] = useState('invite') // invite | form, before joining

  if (!me || !state.linkShared) {
    return (
      <Notice
        icon={Inbox}
        title="No invitation yet"
        text="When the organizer creates a group trip and shares the link, the invitation appears here. Switch to the Organizer interface to do that."
      />
    )
  }
  if (state.stage === 'cancelled' && me.status === 'joined') {
    return (
      <Notice
        icon={Ban}
        title="This trip was cancelled"
        text={me.refund ? `The group could not continue. ${usd(me.refund)} is on its way back to your payment method.` : 'The group could not continue. You were not charged.'}
      />
    )
  }
  if (me.status === 'declined') {
    return (
      <Notice icon={UserMinus} title="You declined this trip" text={`${organizerOf(state).name} has been told and can invite someone else.`}>
        {['inviting', 'voting'].includes(state.stage) && (
          <Button className="sm:w-auto" variant="secondary" onClick={() => dispatch({ type: 'UNDECLINE', id: ME_ID })}>
            I changed my mind
          </Button>
        )}
      </Notice>
    )
  }
  if (me.status === 'expired') {
    return <Notice icon={Hourglass} title="This group is already locked" text="The vote closed and the price was split between the people who had joined. Ask the organizer if a spot opens up." />
  }
  if (me.status === 'left') {
    return (
      <Notice
        icon={LogOut}
        title="You left the trip"
        text={me.refund ? `${usd(me.refund)} is on its way back to your payment method. The rest of the group is adjusting rooms and price.` : 'You were not charged. The rest of the group carries on without you.'}
      />
    )
  }
  if (me.status === 'invited') {
    return screen === 'form' ? <JoinForm onBack={() => setScreen('invite')} /> : <Invitation onJoin={() => setScreen('form')} />
  }
  return <Home />
}

function Notice({ icon: Icon, title, text, children }) {
  return (
    <Page tone="member" banner={BANNER}>
      <Card className="mx-auto max-w-xl space-y-4 py-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-muted">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-extrabold tracking-tight">{title}</p>
          <p className="mx-auto mt-2 max-w-md text-muted">{text}</p>
        </div>
        {children && <div className="flex justify-center">{children}</div>}
      </Card>
    </Page>
  )
}

// Price range the member can expect, for the people currently in or invited.
function usePriceRange() {
  const { state } = useGroup()
  const basis = state.stage === 'inviting' ? planned(state) : joined(state)
  const prices = voteOptions(state, basis).map((o) => o.price)
  return [Math.min(...prices), Math.max(...prices), basis.length]
}

// ---- The invitation: everything needed to decide, before joining ----

function Invitation({ onJoin }) {
  const { state, dispatch } = useGroup()
  const organizer = organizerOf(state)
  const [low, high, count] = usePriceRange()
  const inGroup = joined(state)
  const windowLabel = PAY_WINDOWS.find((w) => w.hours === state.group.payHours).label

  return (
    <Page
      tone="member"
      banner={BANNER}
      aside={
        <>
          <Card className="space-y-4">
            <div>
              <p className="text-sm text-muted">Your share, flight + stay</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight">
                {usd(low)}–{usd(high)}
              </p>
              <p className="text-xs text-muted">For {count} travellers. The exact amount is fixed after the group votes on the stay. You pay nothing today.</p>
            </div>
            <Button onClick={onJoin}>Join {state.group.name}</Button>
            <button type="button" onClick={() => dispatch({ type: 'DECLINE', id: ME_ID })} className="w-full cursor-pointer py-1 text-sm font-medium text-muted hover:text-ink">
              Not for me
            </button>
          </Card>
          <Card className="space-y-3">
            <SectionTitle hint={`${inGroup.length} of ${state.members.length}`}>Who's in so far</SectionTitle>
            <div className="flex items-center gap-3">
              <AvatarStack members={inGroup} />
              <p className="text-sm text-muted">{inGroup.map((m) => m.name).join(', ')}</p>
            </div>
          </Card>
          <RulesCard />
        </>
      }
    >
      <Card className="flex items-start gap-4">
        <Avatar member={organizer} size="lg" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Invitation · {groupLink(state.group.name)}</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">{organizer.name} invited you to {state.group.name}</p>
          <p className="mt-1 text-muted">Read what's planned and what joining means. It takes about two minutes.</p>
        </div>
      </Card>

      <TripOverview />

      <Card className="space-y-4">
        <SectionTitle>What happens after you join</SectionTitle>
        {[
          ['Add your own details', 'Your passport goes to the airline only. The organizer never sees it.'],
          ['Set a private budget and room preference', 'The group only gets stay options that everyone can afford.'],
          ['Vote on the stay', 'Anonymous. The winner fixes your exact price.'],
          [`Pay only your share within ${windowLabel}`, 'Held by Trip.com and charged only when the whole group books.'],
          ['Travel', 'You get your own ticket and room confirmation.'],
        ].map(([title, text], i) => (
          <div key={title} className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">{i + 1}</span>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted">{text}</p>
            </div>
          </div>
        ))}
      </Card>

      <DayPlan />
    </Page>
  )
}

// ---- Join: own details, private budget, room preference ----

function Choice({ options, value, onChange, columns = 'sm:grid-cols-4' }) {
  return (
    <div className={`mt-1.5 grid grid-cols-2 gap-2 ${columns}`}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`cursor-pointer rounded-2xl border-2 px-3 py-2.5 text-sm font-semibold transition ${
            value === o.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-100 text-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </label>
  )
}

function JoinForm({ onBack }) {
  const { state, dispatch, notify } = useGroup()
  const [form, setForm] = useState(MEMBER_INFO_PREFILL)
  const [budget, setBudget] = useState('mid')
  const [roomPref, setRoomPref] = useState('same')
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const valid = form.firstName && form.lastName && form.passport && form.dob
  const [low, high] = usePriceRange()

  const join = () => {
    dispatch({ type: 'JOIN', id: ME_ID, budgetMax: BUDGET_RANGES.find((b) => b.id === budget).max, roomPref })
    notify(`You joined ${state.group.name}`)
  }

  return (
    <Page
      tone="member"
      banner={BANNER}
      aside={
        <Card className="space-y-3">
          <SectionTitle>Almost in</SectionTitle>
          <p className="text-sm text-muted">Joining costs nothing. You pay only after the vote, once you know your exact price.</p>
          <Button disabled={!valid} onClick={join}>
            Save &amp; join the group
          </Button>
          <button type="button" onClick={onBack} className="w-full cursor-pointer py-1 text-sm font-medium text-muted hover:text-ink">
            Back to the invitation
          </button>
        </Card>
      }
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Join {state.group.name}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Your part of the trip</h1>
        <p className="mt-1 text-muted">You enter this yourself, so nobody has to collect it from you.</p>
      </div>

      <Card className="space-y-4">
        <SectionTitle>1. Traveller details</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="First name">
            <input className={inputClass} value={form.firstName} onChange={set('firstName')} />
          </Field>
          <Field label="Last name">
            <input className={inputClass} value={form.lastName} onChange={set('lastName')} />
          </Field>
          <Field label="Passport number">
            <input className={`${inputClass} tracking-wider`} value={form.passport} onChange={set('passport')} />
          </Field>
          <Field label="Date of birth">
            <input type="date" className={inputClass} value={form.dob} onChange={set('dob')} />
          </Field>
        </div>
        <div>
          <span className="text-sm font-semibold">Checked baggage</span>
          <Choice options={BAGGAGE_OPTIONS} value={form.baggage} onChange={(baggage) => setForm((f) => ({ ...f, baggage }))} columns="sm:grid-cols-3" />
        </div>
        <p className="flex items-center gap-2 text-sm text-brand-700">
          <ShieldCheck className="h-4 w-4 shrink-0" /> Only you and the airline see these details. This is a demo: keep the sample data.
        </p>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>2. Your budget per person</SectionTitle>
        <p className="text-sm text-muted">
          Options for this trip run from {usd(low)} to {usd(high)}. Pick the most you're comfortable paying.
        </p>
        <Choice options={BUDGET_RANGES} value={budget} onChange={setBudget} />
        <Why>Your budget is private. The group never sees a number, only whether an option fits everyone. Options above someone's budget are left out of the vote.</Why>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>3. Room sharing</SectionTitle>
        <p className="text-sm text-muted">Rooms are twin rooms. Who are you comfortable sharing with?</p>
        <Choice options={ROOM_PREFS} value={roomPref} onChange={setRoomPref} columns="sm:grid-cols-2" />
        <Why>This is used to pair rooms now, and to re-pair them fairly if someone drops out later.</Why>
      </Card>
    </Page>
  )
}

// ---- Member home: one clear action at a time ----

function Home() {
  const { state } = useGroup()
  const { stage } = state
  return (
    <Page tone="member" banner={BANNER} aside={<Sidebar />}>
      <Card className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Your group trip</p>
          <h1 className="text-3xl font-extrabold tracking-tight">{state.group.name}</h1>
          <p className="text-sm text-muted">
            {TRIP.from.city} → {TRIP.to.city} · {TRIP.dates}
          </p>
        </div>
        <StageSteps />
      </Card>

      {stage === 'inviting' && <WaitingToVote />}
      {stage === 'voting' && <VoteCard viewerId={ME_ID} />}
      {stage === 'rooms' && <RoomWish />}
      {stage === 'paying' && <Paying />}
      {stage === 'change' && <PlanChange />}
      {stage === 'booked' && <MyTicket />}

      <div className="space-y-3">
        <SectionTitle hint="You see progress, never budgets or votes">The group</SectionTitle>
        <MemberList viewerId={ME_ID} />
      </div>
    </Page>
  )
}

function Sidebar() {
  const { state } = useGroup()
  const me = meOf(state)
  const stay = lockedStay(state)
  const [low, high] = usePriceRange()
  const [leaving, setLeaving] = useState(false)
  const due = owes(state, me)

  return (
    <>
      <Card className="space-y-2">
        <p className="text-sm text-muted">Your price</p>
        {state.price == null && state.stage !== 'rooms' ? (
          <>
            <p className="text-3xl font-extrabold tracking-tight">
              {usd(low)}–{usd(high)}
            </p>
            <p className="text-xs text-muted">Final after the stay vote. Nothing to pay yet.</p>
          </>
        ) : state.price == null && state.stage === 'rooms' ? (
          <>
            <p className="text-3xl font-extrabold tracking-tight">≈ {usd(roomsPrice(state))}</p>
            <p className="text-xs text-muted">
              {stay.name} won the vote. The price locks when {organizerOf(state).name} confirms the rooms. Nothing to pay yet.
            </p>
          </>
        ) : (
          <>
            <p className="text-3xl font-extrabold tracking-tight">{usd(state.price)}</p>
            <p className="text-xs text-muted">
              Flight {usd(TRIP.flight.perPerson)} + your part of {stay.name}. {due ? `${usd(due)} still to pay.` : 'Paid in full.'}
            </p>
          </>
        )}
      </Card>
      <RoomsCard highlightId={ME_ID} />
      <RulesCard />
      <button
        type="button"
        onClick={() => setLeaving(true)}
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-white hover:text-rose-600"
      >
        <LogOut className="h-4 w-4" /> Can't make it? Leave trip
      </button>
      {leaving && <LeaveModal onClose={() => setLeaving(false)} />}
    </>
  )
}

function LeaveModal({ onClose }) {
  const { state, dispatch, notify } = useGroup()
  const me = meOf(state)
  const { total, fee } = refundFor(state, me)
  const others = joined(state).length - 1
  return (
    <Modal title="Leave this trip?" subtitle="Here is exactly what happens if you do." onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-slate-50 p-4 text-sm">
          <Row label="You paid" value={usd(me.paid)} />
          {fee > 0 && <Row label="Airline cancellation fee" value={`− ${usd(fee)}`} />}
          <Row label="Refunded to you" value={usd(total)} strong />
        </div>
        <Why tone="amber">
          {state.stage === 'booked'
            ? `The trip is already booked, so the airline keeps its fee. The stay is free to change until ${TRIP.freeCancelUntil}.`
            : me.paid
              ? 'The trip is not booked yet, so you get everything back.'
              : 'You have not paid, so there is nothing to refund.'}{' '}
          {state.price != null && `The other ${others} travellers will see new rooms and a new price, and choose how to adjust.`}
        </Why>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="danger"
            onClick={() => {
              dispatch({ type: 'LEAVE', id: ME_ID })
              notify('You left the trip')
              onClose()
            }}
          >
            Leave trip
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Stay in
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function WaitingToVote() {
  const { state } = useGroup()
  const inGroup = joined(state).length
  const ready = inGroup >= state.group.min
  return (
    <Card className="flex items-start gap-4">
      <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
      <div>
        <p className="text-xl font-bold">You're in. Nothing to do right now</p>
        <p className="mt-1 text-sm text-muted">
          {inGroup} of {state.members.length} have joined.{' '}
          {ready ? `The minimum of ${state.group.min} is reached, so ${organizerOf(state).name} can open the stay vote.` : `The group needs ${state.group.min} to go ahead.`} You'll
          vote next.
        </p>
      </div>
    </Card>
  )
}

function Paying() {
  const { state } = useGroup()
  const me = meOf(state)
  const people = travellers(state)
  const unpaid = people.filter((m) => m.status !== 'joined' || owes(state, m) > 0)
  return (
    <>
      <Card className="space-y-2">
        <p className="text-xl font-bold">
          Rooms are confirmed. Your price is locked at {usd(state.price)}
        </p>
        <p className="text-sm text-muted">This is the final amount for {people.length} travellers. It only changes if someone drops out, and then only with the group's approval.</p>
      </Card>
      <PayCard viewerId={ME_ID} />
      {owes(state, me) === 0 && (
        <Card className="text-sm text-muted">
          {unpaid.length
            ? `Waiting for ${unpaid.map((m) => m.name).join(', ')}. Reminders are sent automatically, so you don't have to chase anyone.`
            : `Everyone has paid. ${organizerOf(state).name} can now book for the whole group.`}
        </Card>
      )}
    </>
  )
}

// ---- Rooms: say who you would like to share with ----

function RoomWish() {
  const { state, dispatch, notify } = useGroup()
  const me = meOf(state)
  const stay = lockedStay(state)
  const organizer = organizerOf(state)
  const options = joined(state).filter((m) => m.id !== ME_ID && canShare(me, m))
  const room = roomOf(state, ME_ID)
  const roommate = room.ids.find((id) => id !== ME_ID)
  const choose = (wish) => {
    dispatch({ type: 'ROOM_WISH', id: ME_ID, wish })
    notify(wish ? `Asked to share with ${memberById(state, wish).name}` : 'Saved: no roommate preference')
  }

  return (
    <Card className="space-y-4">
      <SectionTitle hint={stay.name}>Who would you like to share a room with?</SectionTitle>
      <p className="text-sm text-muted">
        {stay.fullName} won the vote. Rooms sleep two. Pick a roommate, or leave it to {organizer.name}. You only see people you can share with under everyone's room
        preference.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((m) => {
          const selected = me.wished && me.roomWish === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => choose(m.id)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-2xl border-2 px-3 py-2.5 text-left transition ${selected ? 'border-brand-500 bg-brand-50/40' : 'border-slate-100 hover:border-brand-200'}`}
            >
              <Avatar member={m} size="sm" />
              <span className="text-sm font-semibold">{m.name}</span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => choose(null)}
          className={`cursor-pointer rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition ${me.wished && !me.roomWish ? 'border-brand-500 bg-brand-50/40' : 'border-slate-100 text-muted hover:border-brand-200'}`}
        >
          No preference
        </button>
      </div>
      {me.wished && (
        <p className="flex items-start gap-2 text-sm font-medium text-emerald-700">
          <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={3} />
          Saved. Right now you are in a {roomLabel(stay, room).toLowerCase()}
          {roommate ? ` with ${memberById(state, roommate).name}` : ' on your own'}. {organizer.name} confirms the final rooms, and that locks the price.
        </p>
      )}
      <Why>A wish is honoured when both people can share and nobody else is left without a bed. You can change it until the rooms are confirmed.</Why>
    </Card>
  )
}

// ---- Someone dropped out: see the impact, then approve ----

function PlanChange() {
  const { state, dispatch, notify } = useGroup()
  const { change } = state
  const organizer = organizerOf(state)
  const dropped = state.members.filter((m) => change.dropped.includes(m.id)).map((m) => m.name)
  const proposal = fixOptions(state).find((o) => o.id === change.proposal)
  const answer = change.approvals[ME_ID]
  const answerWith = (ok) => {
    dispatch({ type: 'APPROVE', id: ME_ID, ok })
    notify(ok ? 'You approved the new plan' : `${organizer.name} will see you want another option`)
  }

  return (
    <Card className="space-y-4 border-amber-200">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
          <UserMinus className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xl font-bold">
            {dropped.join(' and ')} {dropped.length === 1 ? 'is' : 'are'} out. The trip is still on
          </p>
          <p className="text-sm text-muted">Your flight is unaffected. The stay is shared, so rooms and price need adjusting. Nothing changes until the group approves.</p>
        </div>
      </div>

      {!proposal ? (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm text-muted">{organizer.name} is choosing how to adjust. You'll be asked to approve it here.</p>
      ) : (
        <>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{organizer.name} proposes</p>
            <p className="mt-1 font-bold">{proposal.title}</p>
            <p className="text-sm text-muted">{proposal.detail}</p>
            <div className="mt-3 text-sm">
              <Row label="Your price now" value={usd(change.priceBefore)} />
              <Row label="Your new price" value={usd(proposal.price)} strong />
              <Row
                label={proposal.delta > 0 ? 'You would top up' : proposal.delta < 0 ? 'You would be refunded' : 'Difference'}
                value={proposal.delta === 0 ? 'None' : usd(Math.abs(proposal.delta))}
              />
            </div>
          </div>
          {answer == null ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="sm:w-auto" onClick={() => answerWith(true)}>
                Approve the new plan
              </Button>
              <Button variant="secondary" className="sm:w-auto" onClick={() => answerWith(false)}>
                Ask for another option
              </Button>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <Check className="h-4 w-4" strokeWidth={3} />
              {answer ? `You approved. Waiting for ${organizer.name} to apply it.` : `You asked for another option. ${organizer.name} has been told.`}
            </p>
          )}
        </>
      )}
    </Card>
  )
}

// ---- Booked: the member's own ticket ----

function MyTicket() {
  const { state } = useGroup()
  const me = meOf(state)
  const stay = lockedStay(state)
  const people = travellers(state)
  const roommateId = roomOf(state, ME_ID)?.ids.find((id) => id !== ME_ID)
  const roommate = roommateId ? memberById(state, roommateId) : null
  return (
    <>
      <Card className="flex items-start gap-4 border-emerald-100 bg-emerald-50/60">
        <div className="grid h-12 w-12 shrink-0 animate-pop place-items-center rounded-full bg-emerald-500 text-white">
          <Check className="h-6 w-6" strokeWidth={3} />
        </div>
        <div>
          <p className="text-2xl font-extrabold tracking-tight">You're booked</p>
          <p className="text-sm text-muted">
            {organizerOf(state).name} booked for all {people.length} travellers. You paid {usd(me.paid)}, your share only.
          </p>
        </div>
      </Card>
      <Ticket
        top={
          <>
            <TicketRoute label={`E-ticket · ${state.bookingRef}`} fromSub={`${TRIP.flight.depart} · ${TRIP.from.city}`} toSub={`${TRIP.to.city} · ${TRIP.flight.arrive}`} middle={TRIP.flight.duration} />
            <TicketFields
              fields={[
                ['Passenger', `${MEMBER_INFO_PREFILL.firstName} ${MEMBER_INFO_PREFILL.lastName}`],
                ['Stay', stay.name],
                ['Room', roommate ? `With ${roommate.name}` : 'Own room'],
              ]}
            />
          </>
        }
      >
        <p className="flex items-center gap-2 text-sm text-muted">
          <Plane className="h-4 w-4 text-brand-500" /> {TRIP.dates} · {TRIP.nights} nights · {stay.fullName}
        </p>
      </Ticket>
    </>
  )
}
