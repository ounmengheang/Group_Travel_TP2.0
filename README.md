# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Organizer and member interfaces

The demo is two web interfaces over one shared group, switched from the top bar:

- **Organizer** (`src/organizer/OrganizerApp.jsx`): find the trip, create the group, share the link, open and close the stay vote, track payments, handle dropouts, book.
- **Member** (`src/member/MemberApp.jsx`): open the invitation, add own details, private budget and room preference, vote, pay own share, approve changes, get a ticket, or leave.

The "Next step" bar under the top bar always says whose turn it is. The other friends are simulated and act on their own. One of them never pays, so the dropout path (recalculate rooms and price, pick a fix, approve, settle) always appears; "Fast-forward time" skips the payment deadline.

- `src/data/mockData.js`: all dummy data (people, stays, prices).
- `src/lib/pricing.js`: room pairing and price per person (flight is per person, the stay is shared).
- `src/state/groupState.js`: the group state, the fix options, and the simulated friends.
