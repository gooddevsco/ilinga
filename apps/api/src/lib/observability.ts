/**
 * Observability hookpoints. Phase 18 keeps these dependency-free so the
 * runtime is unchanged when no collector is configured. Production sets
 * IL_OTEL_COLLECTOR and the bootstrap script swaps these no-ops for the
 * @opentelemetry/* packages without touching call sites.
 */

export const span = async <T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: () => Promise<T>,
): Promise<T> => {
  void name;
  void attributes;
  return fn();
};

export const counter = (name: string, value = 1, attributes: Record<string, string> = {}): void => {
  void name;
  void value;
  void attributes;
};

export const gauge = (name: string, value: number, attributes: Record<string, string> = {}): void => {
  void name;
  void value;
  void attributes;
};
