import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req) {
  try {
    const { system, user, images, pdf } = await req.json()
    const content = []
    if (pdf) {
      const data = pdf.includes(',') ? pdf.split(',')[1] : pdf
      content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } })
    }
    if (images?.length) {
      for (const img of images) {
        const [header, data] = img.split(',')
        const mediaType = header.match(/data:(.*?);/)?.[1] || 'image/jpeg'
        content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data } })
      }
    }
    content.push({ type: 'text', text: user })
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content }],
    })
    return Response.json({ text: msg.content[0].text })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
