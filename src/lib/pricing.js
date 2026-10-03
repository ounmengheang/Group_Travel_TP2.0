import { STAYS, TRIP } from '../data/mockData'

export const stayById = (id) => STAYS.find((s) => s.id === id)

// Two people can share a room if they are the same gender, or both said "anyone".
export const canShare = (a, b) => a.gender === b.gender || (a.roomPref === 'any' && b.roomPref === 'any')

// A room is { ids: [traveller ids], type: 'twin' | 'single' }. `type` is the room that is booked,
// so a twin can hold one person (when a roommate dropped out and the group keeps the room).
const roomFor = (occupants) => ({ ids: occupants.map((m) => m.id), type: occupants.length === 2 ? 'twin' : 'single' })

// Arrange rooms automatically: roommate wishes first, then same-gender pairs,
// then people who are happy to share with anyone. Whoever is left gets a single.
export function autoRooms(members) {
  const left = [...members]
  const rooms = []
  const pair = (a, b) => {
    rooms.push(roomFor([a, b]))
    left.splice(left.indexOf(a), 1)
    left.splice(left.indexOf(b), 1)
  }
  const wishOf = (m) => (m.roomWish ? left.find((x) => x.id === m.roomWish) : null)

  // Wishes that go both ways come first, then one-way wishes.
  for (const mutualOnly of [true, false]) {
    for (const m of members) {
      if (!left.includes(m)) continue
      const wish = wishOf(m)
      if (wish && wish !== m && canShare(m, wish) && (!mutualOnly || wish.roomWish === m.id)) pair(m, wish)
    }
  }
  for (const sameGender of [true, false]) {
    let found = true
    while (found) {
      found = false
      for (const a of left) {
        const b = left.find((x) => x !== a && canShare(a, x) && (!sameGender || x.gender === a.gender))
        if (b) {
          pair(a, b)
          found = true
          break
        }
      }
    }
  }
  left.forEach((m) => rooms.push(roomFor([m])))
  return rooms
}

// Total stay cost: a flat price for a whole villa, otherwise the sum of the rooms booked.
export const stayTotal = (stay, rooms) => stay.flat ?? rooms.reduce((sum, room) => sum + stay[room.type], 0)

// What one traveller pays: their own flight plus an equal part of the shared stay.
export const perPerson = (stay, rooms, count) => (count ? TRIP.flight.perPerson + Math.ceil(stayTotal(stay, rooms) / count) : 0)

// Price with rooms arranged automatically, used for previews before rooms are confirmed.
export const previewPrice = (stay, members) => perPerson(stay, autoRooms(members), members.length)

export const stayShare = (price) => price - TRIP.flight.perPerson

export const overBudgetCount = (members, price) => members.filter((m) => m.budgetMax != null && m.budgetMax < price).length

export const roomLabel = (stay, room) => (stay.flat ? 'Bedroom' : room.type === 'twin' ? (room.ids.length === 1 ? 'Twin room, one traveller' : 'Twin room') : 'Single room')
