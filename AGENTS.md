# AGENTS.md

## Project

This is a React prototype for a Trip.com Group Trip pitch.

The prototype demonstrates how group travel can remove the burden from the person organizing the trip.

This is a **pitch demo**, not a production application.

## Primary Goal

Build a polished, believable, interactive demo that can be presented in approximately 2–3 minutes.

The central product idea is:

> One group booking, without one person carrying the whole trip.

## Development Principles

* Prioritize UX and visual polish over backend architecture.
* Keep implementation simple.
* Use mock data.
* Use frontend state only.
* Do not build unnecessary infrastructure.
* Do not create a backend.
* Do not integrate real APIs.
* Do not over-engineer.

Before implementing anything, ask:

> Does this help demonstrate the core Group Trip concept?

If not, do not add it.

## Tech Stack

Use:

* React
* Vite
* JavaScript or TypeScript
* Tailwind CSS
* Lucide React

Use React state and simple shared state where appropriate.

Avoid adding dependencies unless they are genuinely useful to the demo.

## Core Features

Only focus on:

1. Create Group Trip
2. Group Invitation Link
3. Individual Member Information
4. Individual Payment
5. Private Budget
6. Shared Booking Status
7. Group Voting

## Out of Scope

Do not implement:

* AI Agent
* Passport OCR
* AI itinerary generation
* Chatbot
* Real Trip.com API
* Real payment gateway
* Backend
* Database
* Authentication
* Real Telegram integration
* Real Facebook integration
* Production booking infrastructure

Social sharing can be simulated with UI interactions.

Payments can be simulated.

## Demo Flow

The application should support this complete flow:

Trip Itinerary
→ Create Group Trip
→ Invite Friends
→ Member Joins
→ Member Information + Private Budget
→ Group Dashboard
→ Group Voting
→ Individual Payment
→ Group Ready
→ Booking Confirmed

## Important UX Principle

The prototype must clearly communicate the difference between the old and new experience.

### Old

Organizer:

Find trip
→ collect information
→ pay everything
→ chase friends
→ wait
→ risk losing the booking

### New

Group Trip:

Create
→ invite
→ everyone enters their own information
→ everyone pays their own share
→ vote together
→ track progress
→ book together

## UI

The application should feel like a modern travel platform.

Prefer:

* Clean layouts
* Strong typography
* Spacious cards
* Clear hierarchy
* Consistent spacing
* Clear CTAs
* Subtle animations
* Responsive layouts

Avoid:

* Generic SaaS dashboards
* Excessive gradients
* Excessive animations
* Too much text
* Unnecessary charts
* Complex navigation

## Most Important Screen

The Group Dashboard is the most important screen.

It should immediately show:

* Group name
* Destination
* Total cost
* Cost per person
* Member count
* Information completion
* Payment completion
* Amount secured
* Booking deadline
* Voting status

Example:

6/6 members joined

6/6 information completed

4/6 payments completed

$1,600 / $2,400 secured

18h remaining

## Demo State

Use realistic mock data:

Trip:
Bali Squad 2026

Route:
Phnom Penh → Bali

Dates:
Dec 18–22, 2026

Members:
6

Total:
$2,400

Share:
$400/person

Minimum members:
4

Members:

* Boramey
* Chesda
* Sengheng
* Panhar
* MengHeang
* Tena

The application should update its state when demo actions occur.

For example:

Before payment:
4/6 paid
$1,600 secured

After payment:
5/6 paid
$2,000 secured

## Code Quality

Keep the code:

* Readable
* Simple
* Modular
* Easy to modify
* Easy to demo

Do not create abstractions simply for the sake of abstraction.

Do not rewrite working code unnecessarily.

When modifying an existing feature, preserve existing behavior unless the task explicitly requires changing it.

## Before Finishing

Verify:

* The app builds successfully.
* No obvious console errors.
* Main navigation works.
* Demo state updates correctly.
* All core screens are reachable.
* The full pitch flow can be completed without a dead end.
* The UI is visually consistent.
