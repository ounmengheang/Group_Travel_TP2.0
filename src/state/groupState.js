import { AVATAR_COLORS, GROUP_DEFAULTS, PEOPLE, REPLACEMENT, STAYS, TRIP } from '../data/mockData'
import { assignRooms, overBudgetCount, perPerson, stayById } from '../lib/pricing'

// One shared group, seen from two interfaces (organizer and member).
// Stages: draft → inviting → voting → paying → booked, with `change` whenever someone drops out.

const toId = (name) => name.toLowerCase()
export const ORGANIZER_ID = toId(PEOPLE.find((p) => p.role === 'organizer').name)
export const ME_ID = toId(PEOPLE.find((p) => p.role === 'me').name)

const HOUR = 3600 * 1000

function makeMember(person, index) {
  const isOrganizer = person.role === 'organizer'
  return {
    id: toId(person.name),
    name: person.name,
    color: AVATAR_COLORS[index % AVATAR_COLORS.length],
    gender: person.gender,
    budgetMax: person.budget ?? null,
    prefers: person.prefers ?? null,
    late: Boolean(person.late),
    isOrganizer,
    auto: !person.role, // simulated friend
    status: isOrganizer ? 'joined' : 'invited', // invited | joined | declined | left | expired
    roomPref: 'same',
    vote: null,
    paid: 0,
    refund: 0,
    reminded: false,
    leftReason: null,
  }
}

export const initialState = {
  stage: 'draft',
  group: GROUP_DEFAULTS,
  linkShared: false,
  members: [],
  stayId: null,
  price: null, // locked price per person
  keepRooms: null,
  deadlineAt: null,
  deadlinePassed: false,
  change: null, // { dropped: [ids], priceBefore, roomsBefore, proposal, approvals, afterBooking }
  wasBooked: false,
  bookingRef: null,
  log: [],
  resetKey: 0,
}

// ---- Selectors ----

export const organizerOf = (s) => s.members.find((m) => m.isOrganizer)
export const meOf = (s) => s.members.find((m) => m.id === ME_ID)
export const joined = (s) => s.members.filter((m) => m.status === 'joined')
// Everyone still expected on the trip (used for price previews before the vote).
export const planned = (s) => s.members.filter((m) => m.status === 'joined' || m.status === 'invited')
// Seats the locked price is split between: joined people plus a replacement seat being filled.
export const travellers = (s) => s.members.filter((m) => m.status === 'joined' || (m.status === 'invited' && m.replacement))
export const owes = (s, m) => (s.price == null || m.status !== 'joined' ? 0 : Math.max(0, s.price - m.paid))
export const secured = (s) => travellers(s).reduce((sum, m) => sum + Math.min(m.paid, s.price ?? 0), 0)
export const allSettled = (s) => s.price != null && travellers(s).every((m) => m.status === 'joined' && m.paid >= s.price)
export const lockedStay = (s) => (s.stayId ? stayById(s.stayId) : null)

// Stay options for the vote. Only options every traveller can afford are votable.
export function voteOptions(s, basis = joined(s)) {
  const options = STAYS.map((stay) => {
    const price = perPerson(stay, basis)
    const over = overBudgetCount(basis, price)
    return { stay, price, over, votable: over === 0, votes: basis.filter((m) => m.vote === stay.id).length }
  })
  if (!options.some((o) => o.votable)) {
    // Nothing fits everyone: fall back to the cheapest so the group is never stuck.
    const cheapest = options.reduce((a, b) => (b.price < a.price ? b : a))
    cheapest.votable = true
  }
  return options
}

// Most votes wins. A tie goes to the cheaper option.
export function voteWinner(s) {
  return voteOptions(s)
    .filter((o) => o.votable)
    .reduce((best, o) => (!best || o.votes > best.votes || (o.votes === best.votes && o.price < best.price) ? o : best), null)
}

// The ways a group can absorb a dropout. Each shows the new price per person.
export function fixOptions(s) {
  if (!s.change) return []
  const active = joined(s)
  const stay = lockedStay(s)
  const { priceBefore, roomsBefore } = s.change
  const belowMin = active.length < s.group.min
  const build = (id, title, detail, price, extra = {}) => ({
    id,
    title,
    detail,
    price,
    delta: price - priceBefore,
    over: overBudgetCount(active, price),
    disabled: id !== 'replace' && belowMin,
    ...extra,
  })

  const options = []
  const withReplacement = [...active, { gender: REPLACEMENT.gender }]
  options.push(
    build('replace', 'Replace the traveller', 'Reshare the invite link so a friend takes the open spot. Rooms stay as they are.', perPerson(stay, withReplacement)),
  )

  const repairPrice = perPerson(stay, active)
  if (stay.flat) {
    options.push(build('absorb', 'Split the difference', `Keep the ${stay.name}. Its cost is now shared by ${active.length} people.`, repairPrice))
  } else {
    const rooms = assignRooms(active)
    const singles = rooms.filter((r) => r.type === 'single').length
    const twins = rooms.length - singles
    options.push(
      build(
        'repair',
        'Re-pair the rooms',
        `Change to ${twins} twin ${twins === 1 ? 'room' : 'rooms'}${singles ? ` and ${singles} single` : ''}. Same-gender pairing is kept.`,
        repairPrice,
      ),
    )
    const absorbPrice = perPerson(stay, active, roomsBefore)
    if (absorbPrice !== repairPrice) {
      options.push(build('absorb', 'Split the difference', `Keep all ${roomsBefore} twin rooms. One room has a single traveller.`, absorbPrice))
    }
  }

  const cheaper = STAYS.filter((o) => o.id !== stay.id)
    .map((o) => ({ stay: o, price: perPerson(o, active) }))
    .reduce((a, b) => (b.price < a.price ? b : a))
  if (cheaper.price < repairPrice) {
    options.push(
      build('switch', `Switch to ${cheaper.stay.name}`, `Move the whole group to ${cheaper.stay.fullName}. Free change until ${TRIP.freeCancelUntil}.`, cheaper.price, {
        stayId: cheaper.stay.id,
      }),
    )
  }

  // Recommend the cheapest fix that everyone can afford.
  const fits = options.filter((o) => !o.disabled && o.over === 0 && o.id !== 'replace')
  const pick = fits.length ? fits.reduce((a, b) => (b.price < a.price ? b : a)) : options[0]
  return options.map((o) => ({ ...o, recommended: o.id === pick.id }))
}

export const approvalCount = (s) => 1 + joined(s).filter((m) => !m.isOrganizer && s.change?.approvals[m.id] === true).length
export const canApplyFix = (s) => Boolean(s.change?.proposal) && approvalCount(s) > joined(s).length / 2

// What the leaver gets back. Before booking: everything. After: the airline keeps its fee.
export function refundFor(s, m) {
  if (!m.paid) return { total: 0, fee: 0 }
  const fee = s.stage === 'booked' ? TRIP.flight.cancelFee : 0
  return { total: Math.max(0, m.paid - fee), fee }
}

// ---- Simulated friends: one small action at a time ----

export function nextAuto(s) {
  const autos = s.members.filter((m) => m.auto)
  const invitee = autos.find((m) => m.status === 'invited')
  if (s.stage === 'inviting' && s.linkShared && invitee) return { type: 'JOIN', id: invitee.id }
  if (s.stage === 'voting') {
    if (invitee) return { type: 'JOIN', id: invitee.id }
    const voter = autos.find((m) => m.status === 'joined' && !m.vote)
    if (voter) {
      const options = voteOptions(s).filter((o) => o.votable)
      const choice = options.find((o) => o.stay.id === voter.prefers) ?? options.reduce((a, b) => (b.price < a.price ? b : a))
      return { type: 'VOTE', id: voter.id, stayId: choice.stay.id }
    }
  }
  if (s.stage === 'paying') {
    if (invitee?.replacement) return { type: 'JOIN', id: invitee.id }
    const payer = autos.find((m) => m.status === 'joined' && !m.late && owes(s, m) > 0)
    if (payer) return { type: 'PAY', id: payer.id }
  }
  if (s.stage === 'change' && s.change.proposal) {
    const approver = autos.find((m) => m.status === 'joined' && s.change.approvals[m.id] == null)
    if (approver) return { type: 'APPROVE', id: approver.id, ok: true }
  }
  return null
}

// ---- Reducer ----

const usd = (n) => `$${n}`
const patch = (s, id, changes) => ({ ...s, members: s.members.map((m) => (m.id === id ? { ...m, ...changes } : m)) })
const addLog = (s, text, tone = 'info') => ({ ...s, log: [{ id: s.log.length + 1, text, tone }, ...s.log] })
const nameOf = (s, id) => s.members.find((m) => m.id === id)?.name

// Someone is out: pause, and let the group choose how to absorb it.
// `prev` is the group just before they left, so we know the price and rooms to compare with.
function startChange(prev, next, droppedIds) {
  const before = prev.change
  return {
    ...next,
    stage: 'change',
    wasBooked: prev.wasBooked || prev.stage === 'booked',
    change: {
      dropped: [...(before?.dropped ?? []), ...droppedIds],
      priceBefore: before?.priceBefore ?? prev.price,
      roomsBefore: before?.roomsBefore ?? (prev.keepRooms || assignRooms(travellers(prev)).length),
      proposal: null,
      approvals: {},
    },
  }
}

// Lock a new price: refund anyone who paid more, everyone else tops up.
function settle(s, price) {
  let refunded = 0
  const members = s.members.map((m) => {
    if (m.status !== 'joined' || m.paid <= price) return m
    refunded = m.paid - price
    return { ...m, paid: price, refund: m.refund + refunded }
  })
  const next = { ...s, members, price }
  return refunded ? addLog(next, `${usd(refunded)} refunded to everyone who had paid`, 'good') : next
}

export function reducer(s, a) {
  switch (a.type) {
    case 'CREATE': {
      const members = PEOPLE.slice(0, a.group.size).map(makeMember)
      return addLog({ ...s, stage: 'inviting', group: a.group, members }, `${members[0].name} created ${a.group.name}`)
    }
    case 'SHARE':
      return s.linkShared ? s : addLog({ ...s, linkShared: true }, `Invite link shared with ${s.members.length - 1} friends`)
    case 'JOIN': {
      const m = s.members.find((x) => x.id === a.id)
      const next = patch(s, a.id, { status: 'joined', budgetMax: a.budgetMax ?? m.budgetMax, roomPref: a.roomPref ?? m.roomPref })
      return addLog(next, `${m.name} joined and added their own details`, 'good')
    }
    case 'DECLINE':
      return addLog(patch(s, a.id, { status: 'declined' }), `${nameOf(s, a.id)} declined the invite`, 'warn')
    case 'UNDECLINE':
      return patch(s, a.id, { status: 'invited' })
    case 'OPEN_VOTE':
      return addLog({ ...s, stage: 'voting' }, 'Minimum group reached. Stay vote opened')
    case 'VOTE':
      return patch(s, a.id, { vote: a.stayId })
    case 'CLOSE_VOTE': {
      const winner = voteWinner(s)
      // Anyone who never joined is no longer counted: the price is split between those who did.
      const members = s.members.map((m) => (m.status === 'invited' ? { ...m, status: 'expired' } : m))
      const next = { ...s, members, stage: 'paying', stayId: winner.stay.id, price: winner.price, deadlineAt: a.now + s.group.payHours * HOUR }
      return addLog(next, `Vote closed: ${winner.stay.name}. Price locked at ${usd(winner.price)} per person`, 'good')
    }
    case 'PAY': {
      const m = s.members.find((x) => x.id === a.id)
      const topUp = m.paid > 0
      return addLog(patch(s, a.id, { paid: s.price }), `${m.name} paid ${topUp ? `a ${usd(s.price - m.paid)} top-up` : `their ${usd(s.price)} share`}`, 'good')
    }
    case 'FAST_FORWARD': {
      const unpaid = joined(s).filter((m) => owes(s, m) > 0)
      if (!s.deadlinePassed) {
        const members = s.members.map((m) => (unpaid.includes(m) ? { ...m, reminded: true } : m))
        const names = unpaid.map((m) => m.name).join(', ')
        return addLog({ ...s, members, deadlinePassed: true }, `Payment deadline passed. ${names} reminded and given 12 more hours`, 'warn')
      }
      const ids = unpaid.map((m) => m.id)
      const members = s.members.map((m) => (ids.includes(m.id) ? { ...m, status: 'left', leftReason: 'Did not pay in time' } : m))
      return addLog(startChange(s, { ...s, members }, ids), `${unpaid.map((m) => m.name).join(', ')} did not pay. Their spot is released`, 'warn')
    }
    case 'LEAVE': {
      const m = s.members.find((x) => x.id === a.id)
      const { total } = refundFor(s, m)
      const next = patch(s, a.id, { status: 'left', leftReason: 'Cancelled', paid: 0, refund: total, vote: null })
      const logged = addLog(next, `${m.name} left the trip${total ? ` and was refunded ${usd(total)}` : ''}`, 'warn')
      // Before the price is locked nothing needs fixing: previews simply recalculate.
      return s.price == null ? logged : startChange(s, logged, [a.id])
    }
    case 'PROPOSE':
      return { ...s, change: { ...s.change, proposal: a.fixId, approvals: {} } }
    case 'APPROVE':
      return { ...s, change: { ...s.change, approvals: { ...s.change.approvals, [a.id]: a.ok } } }
    case 'APPLY_FIX': {
      const fix = fixOptions(s).find((f) => f.id === s.change.proposal)
      let next = { ...s, stage: 'paying', change: null, deadlinePassed: false, deadlineAt: a.now + 24 * HOUR }
      next = { ...next, keepRooms: fix.id === 'absorb' && !lockedStay(s).flat ? s.change.roomsBefore : null }
      if (fix.id === 'switch') next = { ...next, stayId: fix.stayId }
      if (fix.id === 'replace') {
        const newcomer = { ...makeMember(REPLACEMENT, s.members.length), auto: true, replacement: true }
        next = { ...next, members: [...next.members, newcomer] }
      }
      next = addLog(next, `Group agreed: ${fix.title.toLowerCase()}. New price ${usd(fix.price)} per person`, 'good')
      return settle(next, fix.price)
    }
    case 'BOOK': {
      const count = travellers(s).length
      return addLog(
        { ...s, stage: 'booked', bookingRef: 'TG-DPS-2618' },
        `${s.wasBooked ? 'Booking updated' : 'Booked'}: ${count} travellers, ${usd(count * s.price)} in one group booking`,
        'good',
      )
    }
    case 'RESET':
      return { ...initialState, resetKey: s.resetKey + 1 }
    default:
      return s
  }
}

// ---- Guide: whose turn is it? Shown above both interfaces. ----

export function nextStep(s) {
  const me = meOf(s)
  const org = organizerOf(s)
  const meActive = me?.status === 'joined'
  const waiting = (text) => ({ who: 'wait', text })
  const organizer = (text) => ({ who: 'organizer', text })
  const member = (text) => ({ who: 'member', text })

  switch (s.stage) {
    case 'draft':
      return organizer('Create the group trip')
    case 'inviting': {
      if (!s.linkShared) return organizer('Share the invite link')
      if (me?.status === 'invited') return member('Open the invite and join the trip')
      if (nextAuto(s)) return waiting('Friends are joining')
      if (joined(s).length < s.group.min) return organizer('Not enough people yet. Reshare the link')
      return organizer('Open the stay vote')
    }
    case 'voting': {
      if (me?.status === 'invited') return member('Join the trip before the vote closes')
      if (meActive && !me.vote) return member('Vote on where to stay')
      if (!org.vote) return organizer('Cast your vote')
      if (nextAuto(s)) return waiting('Friends are voting')
      return organizer('Close the vote and lock the price')
    }
    case 'paying': {
      if (owes(s, org) > 0) return organizer(org.paid ? 'Pay your top-up' : 'Pay your share')
      if (meActive && owes(s, me) > 0) return member(me.paid ? 'Pay your top-up' : 'Pay your share')
      if (nextAuto(s)) return waiting('Friends are paying')
      if (allSettled(s)) return organizer(s.wasBooked ? 'Update the group booking' : 'Book for the whole group')
      return { who: 'time', text: s.deadlinePassed ? 'Still unpaid. Skip the 12-hour extension' : 'One friend has not paid. Skip to the payment deadline' }
    }
    case 'change': {
      if (!s.change.proposal) return organizer('Someone dropped out. Pick a fix for the group')
      if (meActive && s.change.approvals[me.id] == null) return member('Review and approve the new plan')
      if (nextAuto(s)) return waiting('Friends are reviewing the new plan')
      return organizer(canApplyFix(s) ? 'Apply the change' : 'Pick another fix')
    }
    default:
      return { who: 'done', text: meActive ? 'Booked. To test a late cancellation, open Member and choose "Leave trip"' : 'Booked. The demo is complete' }
  }
}
