/** Matches `server/src/lib/passwordPolicy.ts` for new passwords. */
export const PASSWORD_MIN_LENGTH = 8

const UPPER = /[A-Z]/
const DIGIT = /[0-9]/
const SPECIAL = /[^A-Za-z0-9]/

export function passwordHasMinLength(p: string): boolean {
  return p.length >= PASSWORD_MIN_LENGTH
}

export function passwordHasUppercase(p: string): boolean {
  return UPPER.test(p)
}

export function passwordHasDigit(p: string): boolean {
  return DIGIT.test(p)
}

export function passwordHasSpecial(p: string): boolean {
  return SPECIAL.test(p)
}

export function isNewPasswordValid(password: string): boolean {
  return (
    passwordHasMinLength(password) &&
    passwordHasUppercase(password) &&
    passwordHasDigit(password) &&
    passwordHasSpecial(password)
  )
}
