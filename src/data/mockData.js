// All demo data lives here. Edit this file to change the story:
// people, destination, stays and prices. Both interfaces derive from it.

export const TRIP = {
  title: 'Bali Beach Escape',
  from: { city: 'Phnom Penh', code: 'PNH' },
  to: { city: 'Bali', code: 'DPS' },
  dates: 'Dec 18–22, 2026',
  nights: 4,
  freeCancelUntil: 'Dec 4',
  flight: {
    depart: '07:40',
    arrive: '15:25',
    duration: '6h 45m',
    stops: '1 stop · KUL',
    perPerson: 180, // a per-person cost: it leaves with the traveller
    cancelFee: 60, // airline fee if someone cancels after booking
  },
}

// Day-by-day plan shown on the itinerary. `icon`: arrive | nature | island | temple | depart
export const DAY_PLAN = [
  { day: 1, date: 'Dec 18', title: 'Arrive & sunset', icon: 'arrive', places: ['Airport pickup', 'Check-in', 'Double Six Beach'] },
  { day: 2, date: 'Dec 19', title: 'Ubud', icon: 'nature', places: ['Tegallalang Rice Terraces', 'Monkey Forest', 'Ubud Market'] },
  { day: 3, date: 'Dec 20', title: 'Nusa Penida', icon: 'island', places: ['Kelingking Beach', 'Broken Beach', 'Crystal Bay snorkel'] },
  { day: 4, date: 'Dec 21', title: 'Uluwatu', icon: 'temple', places: ['Padang Padang Beach', 'Uluwatu Temple', 'Kecak fire dance'] },
  { day: 5, date: 'Dec 22', title: 'Fly home', icon: 'depart', places: ['Breakfast', 'Seminyak shopping', 'Flight to PNH'] },
]

// Stays are a SHARED cost: the total is split between whoever travels.
// `flat`: one price for the whole place. `twin` / `single`: price per room for the whole stay.
export const STAYS = [
  {
    id: 'villa',
    name: 'Beach Villa',
    fullName: 'Seminyak Beach Villa',
    area: 'Seminyak',
    rating: 4.8,
    flat: 1320,
    bedrooms: 3,
    perks: ['Private pool', '2 min to beach', '3 bedrooms'],
  },
  {
    id: 'hotel',
    name: 'Central Hotel',
    fullName: 'Kuta Central Hotel',
    area: 'Kuta',
    rating: 4.5,
    twin: 380,
    single: 300,
    perks: ['Breakfast included', 'Walk to nightlife', 'Twin rooms'],
  },
  {
    id: 'guest',
    name: 'Garden Guesthouse',
    fullName: 'Canggu Garden Guesthouse',
    area: 'Canggu',
    rating: 4.3,
    twin: 300,
    single: 240,
    perks: ['Quiet garden', 'Near surf beach', 'Twin rooms'],
  },
]

export const GROUP_DEFAULTS = { name: 'Bali Squad 2026', size: 6, min: 4, payHours: 72 }

// How long everyone gets to pay once the price is locked.
export const PAY_WINDOWS = [
  { hours: 48, label: '48 hours' },
  { hours: 72, label: '3 days' },
  { hours: 120, label: '5 days' },
  { hours: 168, label: '7 days' },
]

// The travellers, in invite order.
// role 'organizer' runs the Organizer interface, 'me' runs the Member interface.
// Everyone else is simulated: they join, vote, pay and approve on their own.
// `late`: never pays, so the "someone drops out" path always appears.
// `budget`: private max per person. Never shown to others, only counted.
// `gender` is only used to pair rooms. `prefers`: the stay this friend votes for.
// `roomWish`: who this friend asks to share a room with.
export const PEOPLE = [
  { name: 'Boramey', role: 'organizer', gender: 'F', budget: 450 },
  { name: 'Panhar', role: 'me', gender: 'M' },
  { name: 'Tena', gender: 'F', budget: 380, prefers: 'guest', late: true, roomWish: 'Boramey' },
  { name: 'Chesda', gender: 'M', budget: 420, prefers: 'hotel', roomWish: 'Sengheng' },
  { name: 'Sengheng', gender: 'M', budget: 400, prefers: 'guest', roomWish: 'Chesda' },
  { name: 'MengHeang', gender: 'M', budget: 500, prefers: 'hotel' },
]

// Joins if the group chooses "Replace" after someone drops out.
export const REPLACEMENT = { name: 'Dara', gender: 'F', budget: 450 }

export const AVATAR_COLORS = [
  'bg-sky-100 text-sky-700',
  'bg-amber-100 text-amber-700',
  'bg-teal-100 text-teal-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-indigo-100 text-indigo-700',
]

export const MEMBER_INFO_PREFILL = {
  firstName: 'Panhar',
  lastName: 'Sok',
  passport: 'N04829157',
  dob: '1998-04-12',
  baggage: '20kg',
}

export const BAGGAGE_OPTIONS = [
  { id: 'carry', label: 'Carry-on' },
  { id: '20kg', label: '+20 kg' },
  { id: '30kg', label: '+30 kg' },
]

export const BUDGET_RANGES = [
  { id: 'low', label: 'Up to $350', max: 350 },
  { id: 'mid', label: 'Up to $450', max: 450 },
  { id: 'high', label: 'Up to $550', max: 550 },
  { id: 'flex', label: 'Flexible', max: Infinity },
]

export const ROOM_PREFS = [
  { id: 'same', label: 'Same gender only' },
  { id: 'any', label: 'Anyone in the group' },
]

export const PAYMENT_METHODS = [
  { id: 'aba', label: 'ABA Pay', detail: 'Linked account' },
  { id: 'visa', label: 'Visa •••• 4821', detail: 'Expires 08/29' },
]
