import { AVATAR_COLORS, GROUP_DEFAULTS, PEOPLE, REPLACEMENT, STAYS, TRIP } from '../data/mockData'
import { autoRooms, canShare, overBudgetCount, perPerson, previewPrice, stayById } from '../lib/pricing'

// One shared group, seen from two interfaces (organizer and member).
// Stages: draft → inviting → voting → rooms → paying → booked,
// with `change` whenever someone drops out, and `cancelled` if the group cannot continue.

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
    roomWish: person.roomWish ? toId(person.roomWish) : null, // who they ask to share with
    wished: isOrganizer, // has answered the roommate question (the organizer arranges directly)
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
  voteEndsAt: null,
  stayId: null,
  rooms: null, // [{ ids, type }] once the stay is chosen
  roomsEdited: false, // the organizer moved someone by hand
  price: null, // locked price per person
  deadlineAt: null,
  deadlinePassed: false,
  change: null, // { dropped: [ids], priceBefore, roomsBefore, proposal, approvals }
  wasBooked: false,
  bookingRef: null,
  log: [],
  resetKey: 0,
}

// ---- Selectors ----

export const organizerOf = (s) => s.members.find((m) => m.isOrganizer)
export const meOf = (s) => s.members.find((m) => m.id === ME_ID)
export const memberById = (s, id) => s.members.find((m) => m.id === id)
export const joined = (s) => s.members.filter((m) => m.status === 'joined')
// Everyone still expected on the trip (used for price previews before the vote).
export const planned = (s) => s.members.filter((m) => m.status === 'joined' || m.status === 'invited')
// Seats the locked price is split between: joined people plus a replacement seat being filled.
export const travellers = (s) => s.members.filter((m) => m.status === 'joined' || (m.status === 'invited' && m.replacement))
export const owes = (s, m) => (s.price == null || m.status !== 'joined' ? 0 : Math.max(0, s.price - m.paid))
export const secured = (s) => travellers(s).reduce((sum, m) => sum + Math.min(m.paid, s.price ?? 0), 0)
export const allSettled = (s) => s.price != null && travellers(s).every((m) => m.status === 'joined' && m.paid >= s.price)
export const lockedStay = (s) => (s.stayId ? stayById(s.stayId) : null)
export const roomOf = (s, id) => s.rooms?.find((room) => room.ids.includes(id)) ?? null

// Stay options for the vote. Only options every traveller can afford are votable.
export function voteOptions(s, basis = joined(s)) {
  const options = STAYS.map((stay) => {
    const price = previewPrice(stay, basis)
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

// Price per person for the rooms as currently arranged (before it is locked).
export const roomsPrice = (s) => perPerson(lockedStay(s), s.rooms, joined(s).length)

// Reasons the current room arrangement cannot be confirmed.
export function roomProblems(s) {
  const stay = lockedStay(s)
  const problems = []
  for (const room of s.rooms) {
    const [a, b] = room.ids.map((id) => memberById(s, id))
    if (b && !canShare(a, b)) problems.push(`${a.name} and ${b.name} cannot share: at least one of them asked for same-gender rooms only.`)
  }
  if (stay.bedrooms && s.rooms.length > stay.bedrooms) problems.push(`The ${stay.name} has only ${stay.bedrooms} bedrooms.`)
  const over = overBudgetCount(joined(s), roomsPrice(s))
  if (over) problems.push(`This arrangement costs more than ${over} ${over === 1 ? "traveller's" : "travellers'"} private budget.`)
  return problems
}

const roomSummary = (rooms) => {
  const twins = rooms.filter((r) => r.type === 'twin').length
  const singles = rooms.length - twins
  return [twins && `${twins} twin ${twins === 1 ? 'room' : 'rooms'}`, singles && `${singles} single`].filter(Boolean).join(' and ')
}

// The ways a group can absorb a dropout. Each shows the new price per person and the rooms it leads to.
export function fixOptions(s) {
  if (!s.change) return []
  const active = joined(s)
  const activeIds = active.map((m) => m.id)
  const stay = lockedStay(s)
  const { priceBefore, roomsBefore } = s.change
  const build = (id, title, detail, rooms, count, extra = {}) => {
    const price = perPerson(extra.stay ?? stay, rooms, count)
    return {
      id,
      title,
      detail,
      rooms,
      price,
      delta: price - priceBefore,
      over: overBudgetCount(active, price),
      disabled: count < s.group.min,
      stayId: (extra.stay ?? stay).id,
    }
  }

  // The rooms as booked, minus whoever left. A twin with one person left stays a twin.
  const kept = roomsBefore.map((room) => ({ ...room, ids: room.ids.filter((id) => activeIds.includes(id)) })).filter((room) => room.ids.length)

  // Replace: the newcomer takes a free bed next to someone they can share with, otherwise a single.
  const newcomer = { id: toId(REPLACEMENT.name), gender: REPLACEMENT.gender, roomPref: 'same' }
  const host = kept.find((room) => room.type === 'twin' && room.ids.length === 1 && canShare(memberById(s, room.ids[0]), newcomer))
  const withNewcomer = host
    ? kept.map((room) => (room === host ? { ...room, ids: [...room.ids, newcomer.id] } : room))
    : [...kept, { ids: [newcomer.id], type: 'single' }]

  const repaired = autoRooms(active)
  const options = [
    build('replace', 'Replace the traveller', 'Reshare the invite link so a friend takes the open spot. Rooms stay as they are.', withNewcomer, active.length + 1),
  ]
  if (stay.flat) {
    options.push(build('absorb', 'Split the difference', `Keep the ${stay.name}. Its cost is now shared by ${active.length} people.`, repaired, active.length))
  } else {
    options.push(build('repair', 'Re-pair the rooms', `Change to ${roomSummary(repaired)}. Room preferences are kept.`, repaired, active.length))
    const absorb = build('absorb', 'Split the difference', `Keep the rooms as booked (${roomSummary(kept)}). One room has a single traveller.`, kept, active.length)
    if (absorb.price !== options[1].price) options.push(absorb)
  }

  const cheaper = STAYS.filter((o) => o.id !== stay.id)
    .map((o) => ({ stay: o, price: previewPrice(o, active) }))
    .reduce((a, b) => (b.price < a.price ? b : a))
  if (cheaper.price < options[1].price) {
    options.push(
      build('switch', `Switch to ${cheaper.stay.name}`, `Move the whole group to ${cheaper.stay.fullName}. Free change until ${TRIP.freeCancelUntil}.`, repaired, active.length, {
        stay: cheaper.stay,
      }),
    )
  }

  // Recommend the cheapest fix that everyone can afford.
  const fits = options.filter((o) => !o.disabled && o.over === 0 && o.id !== 'replace')
  const pick = fits.length ? fits.reduce((a, b) => (b.price < a.price ? b : a)) : options[0]
  return options.map((o) => ({ ...o, recommended: o.id === pick.id }))
}

export const belowMinimum = (s) => joined(s).length < s.group.min
export const approvalCount = (s) => 1 + joined(s).filter((m) => !m.isOrganizer && s.change?.approvals[m.id] === true).length
export const canApplyFix = (s) => Boolean(s.change?.proposal) && approvalCount(s) > joined(s).length / 2

// What someone gets back. Before booking: everything. After: the airline keeps its fee.
export function refundFor(s, m) {
  if (!m.paid) return { total: 0, fee: 0 }
  const fee = s.stage === 'booked' || s.wasBooked ? TRIP.flight.cancelFee : 0
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
  if (s.stage === 'rooms') {
    const undecided = autos.find((m) => m.status === 'joined' && !m.wished)
    if (undecided) return { type: 'ROOM_WISH', id: undecided.id, wish: undecided.roomWish }
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
const nameOf = (s, id) => memberById(s, id)?.name
const retype = (rooms) => rooms.filter((room) => room.ids.length).map((room) => ({ ids: room.ids, type: room.ids.length === 2 ? 'twin' : 'single' }))

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
      roomsBefore: before?.roomsBefore ?? prev.rooms,
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
      const m = memberById(s, a.id)
      const next = patch(s, a.id, { status: 'joined', budgetMax: a.budgetMax ?? m.budgetMax, roomPref: a.roomPref ?? m.roomPref })
      return addLog(next, `${m.name} joined and added their own details`, 'good')
    }
    case 'DECLINE':
      return addLog(patch(s, a.id, { status: 'declined' }), `${nameOf(s, a.id)} declined the invite`, 'warn')
    case 'UNDECLINE':
      return patch(s, a.id, { status: 'invited' })
    case 'SET_MIN':
      return addLog({ ...s, group: { ...s.group, min: a.min } }, `Minimum lowered to ${a.min} so the group can continue`, 'warn')
    case 'OPEN_VOTE':
      return addLog({ ...s, stage: 'voting', voteEndsAt: a.now + 24 * HOUR }, 'Minimum group reached. Stay vote opened for 24 hours')
    case 'VOTE':
      return patch(s, a.id, { vote: a.stayId })
    case 'CLOSE_VOTE': {
      const winner = voteWinner(s)
      // Anyone who never joined is no longer counted: the cost is split between those who did.
      const members = s.members.map((m) => (m.status === 'invited' ? { ...m, status: 'expired' } : m))
      const next = { ...s, members, stage: 'rooms', stayId: winner.stay.id, roomsEdited: false }
      return addLog({ ...next, rooms: autoRooms(joined(next)) }, `Vote closed: ${winner.stay.name} won. Now arranging rooms`, 'good')
    }
    case 'ROOM_WISH': {
      const next = patch(s, a.id, { roomWish: a.wish, wished: true })
      const wish = a.wish ? `asked to share with ${nameOf(s, a.wish)}` : 'has no roommate preference'
      // Wishes re-arrange the rooms automatically until the organizer starts moving people by hand.
      return addLog(s.roomsEdited ? next : { ...next, rooms: autoRooms(joined(next)) }, `${nameOf(s, a.id)} ${wish}`)
    }
    case 'MOVE': {
      // Move one traveller to another room (`to` is a room index) or to a room of their own ('new').
      const target = a.to === 'new' ? null : s.rooms[a.to]
      const rooms = s.rooms.map((room) => {
        const ids = room.ids.filter((id) => id !== a.id)
        return { ...room, ids: room === target ? [...ids, a.id] : ids }
      })
      if (!target) rooms.push({ ids: [a.id] })
      return { ...s, rooms: retype(rooms), roomsEdited: true }
    }
    case 'AUTO_ROOMS':
      return { ...s, rooms: autoRooms(joined(s)), roomsEdited: false }
    case 'CONFIRM_ROOMS': {
      const price = roomsPrice(s)
      const next = { ...s, stage: 'paying', price, deadlineAt: a.now + s.group.payHours * HOUR }
      return addLog(next, `Rooms confirmed. Price locked at ${usd(price)} per person`, 'good')
    }
    case 'PAY': {
      const m = memberById(s, a.id)
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
      const m = memberById(s, a.id)
      const { total } = refundFor(s, m)
      const next = patch(s, a.id, { status: 'left', leftReason: 'Cancelled', paid: 0, refund: total, vote: null })
      const logged = addLog(next, `${m.name} left the trip${total ? ` and was refunded ${usd(total)}` : ''}`, 'warn')
      if (s.price != null) return startChange(s, logged, [a.id])
      // Before the price is locked nothing needs fixing: previews and rooms simply recalculate.
      return s.rooms ? { ...logged, rooms: autoRooms(joined(logged)), roomsEdited: false } : logged
    }
    case 'PROPOSE':
      return { ...s, change: { ...s.change, proposal: a.fixId, approvals: {} } }
    case 'APPROVE':
      return { ...s, change: { ...s.change, approvals: { ...s.change.approvals, [a.id]: a.ok } } }
    case 'APPLY_FIX': {
      const fix = fixOptions(s).find((f) => f.id === s.change.proposal)
      let next = { ...s, stage: 'paying', change: null, deadlinePassed: false, deadlineAt: a.now + 24 * HOUR, stayId: fix.stayId, rooms: fix.rooms }
      if (fix.id === 'replace') {
        const newcomer = { ...makeMember(REPLACEMENT, s.members.length), auto: true, replacement: true, wished: true }
        next = { ...next, members: [...next.members, newcomer] }
      }
      next = addLog(next, `Group agreed: ${fix.title.toLowerCase()}. New price ${usd(fix.price)} per person`, 'good')
      return settle(next, fix.price)
    }
    case 'CANCEL_TRIP': {
      const members = s.members.map((m) => (m.status === 'joined' ? { ...m, paid: 0, refund: m.refund + refundFor(s, m).total } : m))
      return addLog({ ...s, members, stage: 'cancelled', change: null }, 'Trip cancelled by the organizer. Everyone who paid was refunded', 'warn')
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
      if (belowMinimum(s)) return organizer('Not enough people joined. Reshare the link or lower the minimum')
      return organizer('Open the stay vote')
    }
    case 'voting': {
      if (me?.status === 'invited') return member('Join the trip before the vote closes')
      if (meActive && !me.vote) return member('Vote on where to stay')
      if (!org.vote) return organizer('Cast your vote')
      if (nextAuto(s)) return waiting('Friends are voting')
      return organizer('Close the vote')
    }
    case 'rooms': {
      if (meActive && !me.wished) return member('Choose who you would like to share a room with')
      if (nextAuto(s)) return waiting('Friends are choosing roommates')
      return organizer('Review the rooms, then confirm them to lock the price')
    }
    case 'paying': {
      if (owes(s, org) > 0) return organizer(org.paid ? 'Pay your top-up' : 'Pay your share')
      if (meActive && owes(s, me) > 0) return member(me.paid ? 'Pay your top-up' : 'Pay your share')
      if (nextAuto(s)) return waiting('Friends are paying')
      if (allSettled(s)) return organizer(s.wasBooked ? 'Update the group booking' : 'Book for the whole group')
      return { who: 'time', text: s.deadlinePassed ? 'Still unpaid. Skip the 12-hour extension' : 'One friend has not paid. Skip to the payment deadline' }
    }
    case 'change': {
      if (!s.change.proposal) return organizer(belowMinimum(s) ? 'The group is below its minimum. Decide whether it can continue' : 'Someone dropped out. Pick a fix for the group')
      if (meActive && s.change.approvals[me.id] == null) return member('Review and approve the new plan')
      if (nextAuto(s)) return waiting('Friends are reviewing the new plan')
      return organizer(canApplyFix(s) ? 'Apply the change' : 'Pick another fix')
    }
    case 'cancelled':
      return { who: 'done', text: 'Trip cancelled and everyone refunded. Reset the demo to start again' }
    default:
      return { who: 'done', text: meActive ? 'Booked. To test a late cancellation, open Member and choose "Leave trip"' : 'Booked. The demo is complete' }
  }
}
