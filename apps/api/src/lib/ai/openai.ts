import type { AiCompletion, AiProvider, AiPromptInput, AiStreamChunk } from './types.js';

export const openAiProvider = (apiKey: string, baseUrl = 'https://api.openai.com'): AiProvider => ({
  name: 'openai',
  async complete(input: AiPromptInput): Promise<AiCompletion> {
    const start = performance.now();
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        messages: [
          ...(input.system ? [{ role: 'system', content: input.system }] : []),
          ...input.messages,
        ],
        max_tokens: input.maxTokens,
        temperature: input.temperature ?? 0.2,
      }),
      ...(input.signal ? { signal: input.signal } : {}),
    });
    if (!res.ok) throw new Error(`openai complete ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as {
      choices: { message: { content: string } }[];
      usage: { prompt_tokens: number; completion_tokens: number };
    };
    return {
      content: body.choices[0]?.message.content ?? '',
      usage: { inputTokens: body.usage.prompt_tokens, outputTokens: body.usage.completion_tokens },
      model: input.model,
      provider: 'openai',
      latencyMs: Math.round(performance.now() - start),
    };
  },
  async *stream(input: AiPromptInput): AsyncIterable<AiStreamChunk> {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        model: input.model,
        messages: [
          ...(input.system ? [{ role: 'system', content: input.system }] : []),
          ...input.messages,
        ],
        max_tokens: input.maxTokens,
        temperature: input.temperature ?? 0.2,
        stream: true,
      }),
      ...(input.signal ? { signal: input.signal } : {}),
    });
    if (!res.ok || !res.body) throw new Error(`openai stream ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl = buffer.indexOf('\n');
      while (nl !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        nl = buffer.indexOf('\n');
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') return;
        try {
          const json = JSON.parse(data) as { choices: { delta: { content?: string } }[] };
          const delta = json.choices[0]?.delta.content;
          if (delta) yield { delta };
        } catch {
          /* ignore malformed line */
        }
      }
    }
  },
});
