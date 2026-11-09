import { useEffect, useState } from 'react'
import {
  getPublishedId,
  type SlugInputProps,
  useClient,
  useFormValue,
} from 'sanity'
import { SANITY_API_VERSION } from '../constants'

interface PublishedDocumentClient {
  fetch: (query: string, params: Record<string, string>) => Promise<boolean>
}

export function publishedDocumentExists(
  client: PublishedDocumentClient,
  documentId: string,
) {
  return client.fetch('defined(*[_id == $publishedId][0]._id)', {
    publishedId: getPublishedId(documentId),
  })
}

export function PublishedSlugInput(props: SlugInputProps) {
  const client = useClient({ apiVersion: SANITY_API_VERSION })
  const documentId = useFormValue(['_id'])
  const [hasPublishedDocument, setHasPublishedDocument] = useState<
    boolean | null
  >(null)

  useEffect(() => {
    if (typeof documentId !== 'string') return

    const publishedId = getPublishedId(documentId)
    let active = true
    const refresh = async () => {
      const exists = await publishedDocumentExists(client, publishedId)
      if (active) setHasPublishedDocument(exists)
    }

    void refresh()
    const subscription = client
      .listen('*[_id == $publishedId]', { publishedId })
      .subscribe({ next: () => void refresh() })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [client, documentId])

  return props.renderDefault({
    ...props,
    readOnly: props.readOnly || hasPublishedDocument !== false,
  })
}
