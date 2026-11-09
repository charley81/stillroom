export function splitRegisteredMark(text: string) {
  const hasRegisteredMark = text.endsWith('®')

  return {
    text: hasRegisteredMark ? text.slice(0, -1) : text,
    hasRegisteredMark,
  }
}
