export function camel2DbFormat(s: string) {
  const result = s.replace(/([A-Z])/g, '_$1')
  return result.toLowerCase()
}

export function dbFormat2Camel(s: string) {
  const res = s.split('_').map(t => t.charAt(0).toUpperCase() + t.slice(1)).join('')
  return res.charAt(0).toLowerCase() + res.slice(1)
}