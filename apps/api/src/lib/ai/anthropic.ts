import type { AiCompletion, AiProvider, AiPromptInput, AiStreamChunk } from './types.js';

const VERSION = '2023-06-01';

export const anthropicProvider = (
  apiKey: string,
  baseUrl = 'https://api.anthropic.com',
): AiProvider => ({
  name: 'anthropic',
  async complete(input: AiPromptInput): Promise<AiCompletion> {
    const start = performance.now();
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': VERSION,
      },
      body: JSON.stringify({
        model: input.model,
        system: input.system,
        messages: input.messages.filter((m) => m.role !== 'system'),
        max_tokens: input.maxTokens ?? 4096,
        temperature: input.temperature ?? 0.2,
      }),
      ...(input.signal ? { signal: input.signal } : {}),
    });
    if (!res.ok) throw new Error(`anthropic complete ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as {
      content: { type: string; text?: string }[];
      usage: { input_tokens: number; output_tokens: number };
    };
    return {
      content: body.content
        .filter((c) => c.type === 'text' && c.text)
        .map((c) => c.text!)
        .join(''),
      usage: { inputTokens: body.usage.input_tokens, outputTokens: body.usage.output_tokens },
      model: input.model,
      provider: 'anthropic',
      latencyMs: Math.round(performance.now() - start),
    };
  },
  async *stream(input: AiPromptInput): AsyncIterable<AiStreamChunk> {
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': VERSION,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        model: input.model,
        system: input.system,
        messages: input.messages.filter((m) => m.role !== 'system'),
        max_tokens: input.maxTokens ?? 4096,
        stream: true,
      }),
      ...(input.signal ? { signal: input.signal } : {}),
    });
    if (!res.ok || !res.body) throw new Error(`anthropic stream ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const ev of events) {
        const dataLine = ev.split('\n').find((l) => l.startsWith('data:'));
        if (!dataLine) continue;
        const data = dataLine.slice(5).trim();
        try {
          const json = JSON.parse(data) as {
            type: string;
            delta?: { type: string; text?: string };
          };
          if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
            yield { delta: json.delta.text ?? '' };
          }
        } catch {
          /* ignore */
        }
      }
    }
  },
});
