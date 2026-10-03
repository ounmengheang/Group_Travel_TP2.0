# Group Trip Demo Skill

## Purpose

Use this skill whenever building, modifying, or reviewing the Trip.com Group Trip pitch prototype.

The purpose of the prototype is to demonstrate one product insight:

> The organizer should not have to carry the entire group trip.

The product distributes responsibility across the travelers while keeping everyone connected to one shared booking.

---

# Product Model

There are two important roles:

## Organizer

The person who initially finds the itinerary and creates the Group Trip.

The organizer can:

* Create the group
* Set the group size
* Set the deadline
* Set minimum members
* Invite members
* See group progress
* See payment status
* See information status
* Participate in group decisions

The organizer should NOT have to:

* Collect everyone's information manually
* Pay the entire trip upfront
* Chase everyone individually

## Member

A traveler invited to the Group Trip.

Each member can:

* Join the trip
* Enter their own information
* Set their private budget
* Pay their own share
* Vote on group decisions
* See their booking responsibility

---

# Core Experience

The experience should feel like:

> “I join the trip and take care of my part.”

Not:

> “The organizer manages me.”

---

# Core Feature 1 — Create Group Trip

Start from a normal Trip.com itinerary.

Show:

* Destination
* Dates
* Flight
* Accommodation
* Total price
* Estimated per-person price

Primary CTA:

**Create Group Trip**

When clicked, convert the itinerary into a shared group experience.

---

# Core Feature 2 — Invitation

The organizer receives a shareable Group Trip link.

The demo can simulate:

* Telegram sharing
* Facebook sharing
* Copy link

Do not implement real APIs.

The important interaction is:

**Create → Invite → Friends Join**

---

# Core Feature 3 — Individual Information

The member enters their own information.

Use fields such as:

* First name
* Last name
* Passport number
* Date of birth
* Baggage preference

The UI should explicitly communicate:

> “Enter your own information.”

This is one of the strongest responses to the data-friction problem.

---

# Core Feature 4 — Individual Payment

Never make the organizer appear responsible for paying the full amount.

Example:

Trip:

$2,400

6 people:

$400/person

The member payment screen should emphasize:

> Your share: $400

After payment:

> Your spot is secured.

The dashboard should update immediately.

---

# Core Feature 5 — Private Budget

Each member can specify a personal budget.

Example:

$350–$450

The budget is private.

Use clear copy:

> Your budget is private and isn't shown to other group members.

In this prototype the budget is set on the member information screen (no separate step).

It is never shown individually. The group only sees an anonymous count on each Group Voting option, e.g.:

> Beach Villa $400 · Fits 4 of 6 budgets
> Central Hotel $370 · Fits all 6 budgets

The member also sees a private "Within / Over your budget" tag. No other recommendations.

---

# Core Feature 6 — Shared Booking Status

The organizer needs one place to understand the state of the trip.

Use a dashboard containing:

### Group progress

6/6 joined

6/6 information completed

4/6 payments completed

$1,600 / $2,400 secured

18h remaining

### Member status

Boramey
✓ Information
✓ Payment

Chesda
✓ Information
✓ Payment

Sengheng
✓ Information
✓ Payment

Panhar
✓ Information
Pending payment

MengHeang
✓ Information
✓ Payment

Tena
Pending information
Pending payment

This should replace the need for manual status checking in the group chat.

---

# Core Feature 7 — Group Voting

Voting should be simple and visual.

Example:

## Where should we stay?

### Beach Villa

$400/person

4 votes

### Central Hotel

$370/person

2 votes

Allow the member to select an option.

After voting, show the group result.

The purpose is to demonstrate:

> Everyone participates in the decision.

Do not build a sophisticated voting platform.

---

# Visual Storytelling

Important product moments should be immediately understandable.

Use visual emphasis for:

### Financial responsibility

Old:

$2,400 paid by organizer

New:

$400 paid by each traveler

### Information responsibility

Old:

Organizer collects everyone's information

New:

Each traveler enters their own information

### Coordination

Old:

Messages scattered across Telegram

New:

One shared Group Trip dashboard

---

# Component Guidance

Prefer reusable components:

* TripCard
* GroupProgress
* MemberCard
* StatusBadge
* PaymentCard
* VotingOption
* Countdown
* ShareModal
* Toast
* StepIndicator

Avoid excessive component fragmentation.

---

# State Behavior

The prototype should behave like a real product even though everything is mocked.

Important state:

```text
trip
members
payments
memberInformation
privateBudgets
votes
selectedVote
deadline
currentUser
```

When a member pays:

```text
payments.pending → payments.paid
```

Update:

```text
paidMemberCount
securedAmount
groupProgress
```

When a member completes information:

```text
information.pending → information.completed
```

When voting finishes:

```text
selectedGroupOption
voteCounts
```

The final booking screen should only appear when the demo state reaches the required completion state.

---

# Pitch Optimization

The presenter should not need to explain every UI element.

The UI should tell the story itself.

A viewer should understand:

1. This started as a normal Trip.com booking.
2. The organizer creates a Group Trip.
3. Friends join through a link.
4. Each person enters their own information.
5. Each person pays their own share.
6. The organizer sees progress in one dashboard.
7. The group votes together.
8. Everyone becomes ready.
9. The group books together.

---

# Do Not Drift

Do not introduce:

* AI
* OCR
* Chatbots
* Advanced recommendation systems
* Expense management beyond the booking share
* Social feeds
* Group messaging
* Complex profiles
* Loyalty systems
* Gamification
* Unrelated travel features

If a proposed feature does not directly support the seven core features, leave it out.

The prototype should remain small, focused, and pitch-ready.
