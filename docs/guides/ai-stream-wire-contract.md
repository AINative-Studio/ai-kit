# AIStream / useAIStream wire contract

`AIStream` (and the `useAIStream` hook built on it) is a bring-your-own-backend
streaming client: it does not call any AINative-hosted endpoint directly, it
POSTs to whatever `endpoint` you configure and expects that endpoint to speak
a specific SSE contract back. This page documents that contract exactly, so
you can build a matching server route without reading the compiled source.

## Request: what the client sends

`useAIStream({ endpoint, model, systemPrompt, ... })` / `new AIStream(config)`
POSTs here on every `send(content)` call:

```
POST <config.endpoint>
Content-Type: application/json
<config.headers, if provided>

{
  "messages": [ { "id": "...", "role": "user" | "assistant", "content": "...", "timestamp": ... }, ... ],
  "model": "<config.model, if set>",
  "systemPrompt": "<config.systemPrompt, if set>",
  "stream": true
}
```

`messages` is the full running conversation (every prior turn), not just the
newest message — send the whole array to your model provider, not only the
last entry.

## Response: what your server must send back

- `Content-Type: text/event-stream`, a standard SSE response.
- Each SSE event's `data:` line must be a JSON string. The client recognizes
  exactly two shapes, and ignores everything else:
  - `{"token": "<text>"}` — one chunk of assistant content. Chunks are
    concatenated client-side (in arrival order) into the assistant message's
    `content`, and each chunk is also passed to `config.onToken` / the
    `token` event.
  - `{"usage": { "promptTokens": number, "completionTokens": number, "totalTokens": number, ... }}` —
    merged into the hook's `usage` state and passed to `config.onCost` / the
    `usage` event. Optional — send it once at the end of the response, or omit it.
- End the stream with a literal `data: [DONE]` event. The client stops
  reading on this line; it is not JSON and must not be wrapped in quotes.

Any other `data:` payload shape (e.g. `{"error": "..."}`, a tool-call
result, a custom field) is currently parsed but silently discarded — there is
no raw-event hook today. If your backend needs to send something outside
`token`/`usage`, track
[#212](https://github.com/AINative-Studio/ai-kit/issues/212) for the
proposed fix, or read the raw SSE stream yourself instead of using
`AIStream`/`useAIStream` for the network leg (you can still use the
presentational components, like `StreamingMessage`, on top of your own
reader).

## Minimal matching server route (Next.js Route Handler)

This example proxies to any OpenAI-compatible chat completions endpoint and
re-frames its `delta.content` chunks into the `{"token": ...}` shape above —
note this is a translation layer, not a passthrough, because most model
providers' native SSE format does not match `AIStream`'s format directly.

```ts
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages, model, systemPrompt } = await req.json()

  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: model ?? 'gpt-4o',
      stream: true,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
      ],
    }),
  })

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            continue
          }
          const parsed = JSON.parse(data)
          const token = parsed.choices?.[0]?.delta?.content
          if (token) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
          }
        }
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}
```

For wiring this against AINative's own chat completions API specifically
(which returns OpenAI-compatible `delta.content` chunks, same re-framing
need as above), see [#210](https://github.com/AINative-Studio/ai-kit/issues/210) —
there is currently no first-class `AINativeProvider` and no built-in
translation helper, so the route above (pointed at
`https://api.ainative.studio/api/v1/chat/completions` with your AINative API
key instead of OpenAI's) is the pattern to use until that lands.

## Related

- [#209](https://github.com/AINative-Studio/ai-kit/issues/209) — the gap
  this page closes.
- [#210](https://github.com/AINative-Studio/ai-kit/issues/210) — no
  first-class AINative backend provider.
- [#212](https://github.com/AINative-Studio/ai-kit/issues/212) — no
  raw-SSE-event hook for payload fields beyond `token`/`usage`.
