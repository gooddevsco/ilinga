export interface AiPromptInput {
  model: string;
  system?: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}

export interface AiPromptUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface AiCompletion {
  content: string;
  usage: AiPromptUsage;
  model: string;
  provider: string;
  latencyMs: number;
}

export interface AiStreamChunk {
  delta: string;
}

export interface AiProvider {
  name: string;
  complete(input: AiPromptInput): Promise<AiCompletion>;
  stream(input: AiPromptInput): AsyncIterable<AiStreamChunk>;
}
