const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function generateRef() {
  let suffix = ''
  for (let i = 0; i < 8; i++) {
    suffix += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return `SZQ-${suffix}`
}
