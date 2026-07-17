import Anthropic from '@anthropic-ai/sdk'

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error(
      'AI is not configured. Add ANTHROPIC_API_KEY to Vercel → Settings → Environment Variables, then redeploy.'
    )
  }
  return new Anthropic({ apiKey })
}

// Map Anthropic SDK errors to messages a user (or the Vercel log) can act on.
function friendlyError(e) {
  if (e instanceof Anthropic.AuthenticationError) {
    return { status: 503, message: 'The Anthropic API key is invalid or revoked. Update ANTHROPIC_API_KEY in Vercel and redeploy.' }
  }
  if (e instanceof Anthropic.NotFoundError) {
    return { status: 503, message: `Model "${MODEL}" was not found. Check the ANTHROPIC_MODEL env var in Vercel (or remove it to use the default).` }
  }
  if (e instanceof Anthropic.RateLimitError) {
    return { status: 429, message: 'The AI service is receiving too many requests right now. Wait a minute and try again.' }
  }
  if (e instanceof Anthropic.BadRequestError) {
    return { status: 400, message: `The AI request was rejected: ${e.message}` }
  }
  if (e instanceof Anthropic.APIConnectionError) {
    return { status: 503, message: 'Could not reach the AI service. Try again shortly.' }
  }
  const message = e?.message || 'AI request failed'
  return { status: message.includes('ANTHROPIC_API_KEY') ? 503 : 500, message }
}

export async function POST(req) {
  try {
    const client = getClient()
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
      model: MODEL,
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content }],
    })
    return Response.json({ text: msg.content[0].text })
  } catch (e) {
    // Log the real failure so it shows up in Vercel's runtime logs.
    console.error('Claude API error:', e?.status || '', e?.name || '', e?.message)
    const { status, message } = friendlyError(e)
    return Response.json({ error: message }, { status })
  }
}
