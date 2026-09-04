/**
 * Ministry departments a contact message can be routed to.
 * Shared by the contact form (select options), the info column
 * (editorial list), and the API route (validation enum).
 */
export const departments = [
  { name: 'General Enquiries', email: 'hello@amazinggracemn.org' },
  { name: 'Pastoral Care & Prayer', email: 'prayer@amazinggracemn.org' },
  { name: 'Church Office', email: 'office@amazinggracemn.org' },
  { name: 'Media & Communications', email: 'media@amazinggracemn.org' },
  { name: 'Volunteering & Serving', email: 'serve@amazinggracemn.org' },
] as const

export type DepartmentName = (typeof departments)[number]['name']

export const departmentNames = departments.map((d) => d.name) as [
  DepartmentName,
  ...DepartmentName[],
]
