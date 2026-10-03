export const usd = (amount) =>
  `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`

export const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const groupLink = (groupName) => `trip.com/group/${slugify(groupName)}`
