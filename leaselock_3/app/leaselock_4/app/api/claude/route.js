export async function POST(req) {
  const { system, user, images } = await req.json()

  if (!user) {
    return Response.json({ error: 'Missing user prompt' }, { status: 400 })
  }

  let content
  if (Array.isArray(images) && images.length > 0) {
    content = []
    for (const dataUrl of images.slice(0, 8)) {
      const match = /^data:(image\/\w+);base64,(.+)$/.exec(dataUrl)
      if (match) {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: match[1], data: match[2] },
        })
      }
    }
    content.push({ type: 'text', text: user })
  } else {
    content = user
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: system || 'You are a helpful assistant.',
      messages: [{ role: 'user', content }],
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    return Response.json({ error: data?.error?.message || 'API error' }, { status: response.status })
  }

  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n')
  return Response.json({ text })
}
