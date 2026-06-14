/**
 * monument controller
 *
 * Resolves inline cross-references in `content` at read time:
 *   @slug@            -> <a href="/{slug}">{title}</a>      (title in the requested locale)
 *   @slug|some text@  -> <a href="/{slug}">some text</a>
 *
 * The marker key is locale-stable: you write the SAME key in cs and en content
 * (typically the cs slug, or a documentId). The link href + auto-title are emitted
 * for the locale of the request, so one marker localizes correctly both ways.
 * Stored content keeps the friendly markers; nothing is rewritten in the DB.
 */

import { factories } from '@strapi/strapi'

const UID = 'api::monument.monument'
const TTL_MS = 60_000

// cache: key(slug|documentId) -> documentId, and documentId -> {slug,title} per locale
let cache: { at: number, byKey: Map<string, string>, byDoc: Record<string, Map<string, { slug: string, title: string }>> } | null = null

async function getLookup(strapi) {
  if (cache && Date.now() - cache.at < TTL_MS) return cache
  const byKey = new Map<string, string>()
  const byDoc: Record<string, Map<string, { slug: string, title: string }>> = { cs: new Map(), en: new Map() }
  for (const locale of ['cs', 'en']) {
    const items = await strapi.documents(UID).findMany({
      locale, status: 'published', fields: ['slug', 'title'], pagination: { pageSize: 500 },
    })
    for (const it of items) {
      if (it.slug) byKey.set(it.slug, it.documentId)
      byKey.set(it.documentId, it.documentId)
      byDoc[locale].set(it.documentId, { slug: it.slug, title: it.title })
    }
  }
  cache = { at: Date.now(), byKey, byDoc }
  return cache
}

function resolveRefs(content: string, locale: string, lk): string {
  if (!content || !content.includes('@')) return content
  const loc = locale === 'en' ? 'en' : 'cs'
  // @slug@ or @slug|text@ ; key looks like a slug (lowercase a-z0-9 with hyphens) or a documentId
  return content.replace(/@([a-z0-9]+(?:-[a-z0-9]+)*)(?:\|([^@]+))?@/gi, (m, key, text) => {
    const docId = lk.byKey.get(key)
    if (!docId) return m // unknown key -> leave the marker untouched
    const target = lk.byDoc[loc].get(docId) || lk.byDoc.cs.get(docId)
    if (!target || !target.slug) return m
    const href = loc === 'en' ? `/en/${target.slug}` : `/${target.slug}`
    const label = (text && text.trim()) ? text.trim() : target.title
    return `<a href="${href}">${label}</a>`
  })
}

export default factories.createCoreController(UID, ({ strapi }) => ({
  // Find by slug (existing behavior) + resolve @refs@
  findOne: async (ctx) => {
    const { id } = ctx.params
    const locale = (ctx.query.locale as string) || 'cs'

    const result = await strapi.documents(UID).findFirst({
      filters: { slug: id },
      locale,
      status: 'published',
      populate: { image: true, carousel: { populate: { files: true } } },
    })
    if (!result) return ctx.notFound()
    const lk = await getLookup(strapi)
    if (typeof result.content === 'string') result.content = resolveRefs(result.content, locale, lk)
    return result
  },

  // Find by documentId - useful for locale switching + resolve @refs@
  findByDocumentId: async (ctx) => {
    const { documentId } = ctx.params
    const locale = (ctx.query.locale as string) || 'cs'

    const result = await strapi.documents(UID).findOne({
      documentId,
      locale,
      status: 'published',
      populate: { image: true, carousel: { populate: { files: true } } },
    })
    if (!result) return ctx.notFound()
    const lk = await getLookup(strapi)
    if (typeof result.content === 'string') result.content = resolveRefs(result.content, locale, lk)
    return result
  },
}))
