import { env } from '@/lib/env'
import { listPublishedPosts } from '@/lib/posts'
import { site } from '@/lib/site'

export const revalidate = 3600

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** RSS 2.0 feed of every published post — sermons and announcements alike. */
export async function GET() {
  const base = env.siteUrl()
  const { posts } = await listPublishedPosts({ pageSize: 50 })

  const items = posts
    .map((post) => {
      const url = `${base}/blog/${post.slug}`
      const pubDate = new Date(post.publishAt).toUTCString()
      return [
        '<item>',
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${escapeXml(url)}</link>`,
        `<guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `<pubDate>${pubDate}</pubDate>`,
        `<description>${escapeXml(post.excerpt)}</description>`,
        `<category>${post.type === 'sermon' ? 'Sermon' : 'Announcement'}</category>`,
        '</item>',
      ].join('')
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>${escapeXml(site.name)}</title>
<link>${escapeXml(base)}</link>
<description>Sermon texts and announcements from ${escapeXml(site.shortName)}</description>
<language>en-us</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}
