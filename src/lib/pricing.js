import { STAYS, TRIP } from '../data/mockData'

export const stayById = (id) => STAYS.find((s) => s.id === id)

// Pair travellers into twin rooms within the same gender. An odd one out gets a single.
export function assignRooms(members) {
  const rooms = []
  for (const gender of ['F', 'M']) {
    const group = members.filter((m) => m.gender === gender)
    for (let i = 0; i < group.length; i += 2) {
      const occupants = group.slice(i, i + 2)
      rooms.push({ type: occupants.length === 2 ? 'twin' : 'single', occupants })
    }
  }
  return rooms
}

// Total stay cost for these travellers.
// `keepRooms`: keep this many twin rooms as already arranged, even if one is now half empty.
export function stayTotal(stay, members, keepRooms = null) {
  if (stay.flat) return stay.flat
  if (keepRooms) return keepRooms * stay.twin
  return assignRooms(members).reduce((sum, room) => sum + stay[room.type], 0)
}

// What one traveller pays: their own flight plus an equal part of the shared stay.
export function perPerson(stay, members, keepRooms = null) {
  if (!members.length) return 0
  return TRIP.flight.perPerson + Math.ceil(stayTotal(stay, members, keepRooms) / members.length)
}

export const stayShare = (price) => price - TRIP.flight.perPerson

export const overBudgetCount = (members, price) => members.filter((m) => m.budgetMax != null && m.budgetMax < price).length
