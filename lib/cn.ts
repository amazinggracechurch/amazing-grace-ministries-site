/**
 * Join class names, dropping falsy values. Intentionally tiny — no
 * dependency, no tailwind-merge. Conditional classes stay explicit.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
