export async function POST(req) {
  const { system, user } = await req.json()

  if (!system || !user) {
    return Response.json({ error: 'Missing system or user prompt' }, { status: 400 })
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: user }]
    })
  })

  const data = await response.json()

  if (!response.ok) {
    return Response.json({ error: data?.error?.message || 'API error' }, { status: response.status })
  }

  return Response.json({ text: data.content?.[0]?.text || '' })
}
