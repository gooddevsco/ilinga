import { connect, type Socket } from 'node:net';

/**
 * Minimal clamd TCP client implementing the zINSTREAM protocol.
 *
 * Spec: https://docs.clamav.net/manual/Usage/Configuration.html#tcp-socket
 * Wire format:
 *   client → "zINSTREAM\0"
 *   client → repeating { 4-byte BE length, length bytes of data }
 *   client → 4-byte BE 0  (terminator)
 *   server → "stream: OK\0"  | "stream: <signature> FOUND\0"  | error\0
 *
 * The chunk size is the clamd default (`StreamMaxLength` is enforced
 * server-side, typically 25 MB). We chunk in 64 KB writes which is
 * comfortably under any sane setting.
 */

export interface ClamdConfig {
  host: string;
  port: number;
  /** Hard upper bound on bytes streamed (defaults to 50 MB). */
  maxBytes?: number;
  /** Connection + idle timeout in ms (default 15s). */
  timeoutMs?: number;
}

export type ScanVerdict =
  | { status: 'clean' }
  | { status: 'infected'; signature: string }
  | { status: 'error'; message: string };

const CHUNK = 64 * 1024;

const writeChunk = async (sock: Socket, chunk: Buffer): Promise<void> => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(chunk.byteLength, 0);
  await new Promise<void>((resolve, reject) => {
    sock.write(Buffer.concat([len, chunk]), (err) => (err ? reject(err) : resolve()));
  });
};

const writeTerminator = async (sock: Socket): Promise<void> => {
  const term = Buffer.alloc(4);
  await new Promise<void>((resolve, reject) => {
    sock.write(term, (err) => (err ? reject(err) : resolve()));
  });
};

const readReply = async (sock: Socket, timeoutMs: number): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const onTimeout = (): void => {
      sock.destroy();
      reject(new Error('clamd reply timeout'));
    };
    const timer = setTimeout(onTimeout, timeoutMs);
    sock.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      if (chunks[chunks.length - 1]?.includes(0)) {
        clearTimeout(timer);
        resolve(Buffer.concat(chunks).toString('utf8').replace(/\0+$/u, ''));
      }
    });
    sock.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    sock.on('end', () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks).toString('utf8').replace(/\0+$/u, ''));
    });
  });
};

const openSocket = async (cfg: ClamdConfig): Promise<Socket> => {
  return new Promise<Socket>((resolve, reject) => {
    const sock = connect({ host: cfg.host, port: cfg.port });
    const timer = setTimeout(() => {
      sock.destroy();
      reject(new Error(`clamd connect timeout (${cfg.host}:${cfg.port})`));
    }, cfg.timeoutMs ?? 15_000);
    sock.once('connect', () => {
      clearTimeout(timer);
      sock.setNoDelay(true);
      resolve(sock);
    });
    sock.once('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
};

export const pingClamd = async (cfg: ClamdConfig): Promise<boolean> => {
  let sock: Socket | null = null;
  try {
    sock = await openSocket(cfg);
    await new Promise<void>((resolve, reject) => {
      sock!.write('zPING\0', (err) => (err ? reject(err) : resolve()));
    });
    const reply = await readReply(sock, cfg.timeoutMs ?? 5_000);
    return /PONG/.test(reply);
  } catch {
    return false;
  } finally {
    sock?.destroy();
  }
};

/**
 * Stream a buffer to clamd and return its verdict. Throws only on
 * connection / protocol errors — known infection states are returned as
 * `{ status: 'infected' }`.
 */
export const scanBytes = async (cfg: ClamdConfig, bytes: Buffer): Promise<ScanVerdict> => {
  const max = cfg.maxBytes ?? 50 * 1024 * 1024;
  if (bytes.byteLength > max) {
    return { status: 'error', message: `payload exceeds ${max} bytes` };
  }
  let sock: Socket | null = null;
  try {
    sock = await openSocket(cfg);
    await new Promise<void>((resolve, reject) => {
      sock!.write('zINSTREAM\0', (err) => (err ? reject(err) : resolve()));
    });
    for (let off = 0; off < bytes.byteLength; off += CHUNK) {
      const slice = bytes.subarray(off, Math.min(off + CHUNK, bytes.byteLength));
      await writeChunk(sock, Buffer.from(slice));
    }
    await writeTerminator(sock);
    const reply = await readReply(sock, cfg.timeoutMs ?? 30_000);
    // Reply forms:
    //   "stream: OK"
    //   "stream: Eicar-Test-Signature FOUND"
    //   "INSTREAM size limit exceeded. ERROR"
    if (/\bOK\b/.test(reply)) return { status: 'clean' };
    const m = reply.match(/stream:\s*(.+?)\s+FOUND/u);
    if (m) return { status: 'infected', signature: m[1]! };
    return { status: 'error', message: reply.trim() || 'unknown clamd reply' };
  } finally {
    sock?.destroy();
  }
};
