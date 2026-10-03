import { Check } from 'lucide-react'

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-3xl',
}

export default function Avatar({ member, size = 'md', done = false, className = '' }) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <div className={`grid place-items-center rounded-full font-bold ring-2 ring-white ${member.color} ${SIZES[size]}`}>
        {member.name[0]}
      </div>
      {done && (
        <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 animate-pop place-items-center rounded-full bg-emerald-500 ring-2 ring-white">
          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />
        </span>
      )}
    </div>
  )
}

export function AvatarStack({ members, size = 'sm' }) {
  return (
    <div className="flex -space-x-2">
      {members.map((m) => (
        <Avatar key={m.id} member={m} size={size} />
      ))}
    </div>
  )
}
