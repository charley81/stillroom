export function formatJournalDate(
  publicationDate: string,
  month: 'short' | 'long',
) {
  return new Date(`${publicationDate}T00:00:00Z`)
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month,
      year: 'numeric',
      timeZone: 'UTC',
    })
    .toUpperCase()
}
