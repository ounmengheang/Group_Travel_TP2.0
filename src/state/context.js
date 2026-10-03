import { createContext, useContext } from 'react'

export const GroupContext = createContext(null)
export const useGroup = () => useContext(GroupContext)
