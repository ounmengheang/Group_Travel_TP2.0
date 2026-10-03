import { Toast, TopBar } from './components/Layout'
import MemberApp from './member/MemberApp'
import OrganizerApp from './organizer/OrganizerApp'
import GroupProvider from './state/GroupProvider'
import { useGroup } from './state/context'

// Two web interfaces over one shared group: switch between them in the top bar.
function Interfaces() {
  const { state, role } = useGroup()
  // Both stay mounted so switching roles never loses a half-filled form.
  // `resetKey` remounts them so "Reset demo" also clears their local state.
  return (
    <>
      <div hidden={role !== 'organizer'}>
        <OrganizerApp key={state.resetKey} />
      </div>
      <div hidden={role !== 'member'}>
        <MemberApp key={state.resetKey} />
      </div>
    </>
  )
}

export default function App() {
  return (
    <GroupProvider>
      <div className="min-h-dvh bg-slate-50">
        <TopBar />
        <Interfaces />
        <Toast />
      </div>
    </GroupProvider>
  )
}
