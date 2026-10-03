import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { GroupContext } from './context'
import { initialState, nextAuto, reducer } from './groupState'

// Shared group state for both interfaces, plus the simulated friends.
export default function GroupProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [role, setRole] = useState('organizer') // which interface is on screen
  const [toast, setToast] = useState(null)

  // Friends act on their own, one step at a time, so the group feels alive.
  useEffect(() => {
    const action = nextAuto(state)
    if (!action) return
    const timer = setTimeout(() => dispatch(action), 1100)
    return () => clearTimeout(timer)
  }, [state])

  const notify = useCallback((message) => setToast({ id: Date.now(), message }), [])
  const value = useMemo(() => ({ state, dispatch, role, setRole, toast, notify }), [state, role, toast, notify])
  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
}
