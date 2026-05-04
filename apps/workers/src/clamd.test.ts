import { afterEach, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:net';
import { scanBytes, pingClamd } from './clamd.js';

interface MockClamd {
  port: number;
  close(): Promise<void>;
}

const mockClamd = async (
  reply: (firstCommand: string, body: Buffer) => string,
): Promise<MockClamd> => {
  const srv: Server = createServer((sock) => {
    const chunks: Buffer[] = [];
    let firstCommand = '';
    const bodyChunks: Buffer[] = [];
    let inStream = false;
    sock.on('data', (chunk) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      chunks.push(buf);
      const all = Buffer.concat(chunks);
      if (!firstCommand && all.includes(0)) {
        const idx = all.indexOf(0);
        firstCommand = all.subarray(0, idx).toString('utf8');
        if (firstCommand === 'zPING') {
          sock.write('PONG\0');
          sock.end();
          return;
        }
        if (firstCommand === 'zINSTREAM') {
          inStream = true;
          // anything after the NUL is stream content (length-prefixed chunks).
          const tail = all.subarray(idx + 1);
          if (tail.length > 0) bodyChunks.push(tail);
        }
      } else if (inStream) {
        bodyChunks.push(buf);
      }
      // detect terminator (4 zero bytes at end)
      if (inStream) {
        const merged = Buffer.concat(bodyChunks);
        if (
          merged.length >= 4 &&
          merged[merged.length - 4] === 0 &&
          merged[merged.length - 3] === 0 &&
          merged[merged.length - 2] === 0 &&
          merged[merged.length - 1] === 0
        ) {
          // Decode chunked stream into a single body buffer for the assertion.
          const body: Buffer[] = [];
          let off = 0;
          while (off < merged.length - 4) {
            const len = merged.readUInt32BE(off);
            off += 4;
            body.push(merged.subarray(off, off + len));
            off += len;
          }
          const text = `${reply(firstCommand, Buffer.concat(body))}\0`;
          sock.write(text);
          sock.end();
        }
      }
    });
  });
  await new Promise<void>((resolve) => srv.listen(0, '127.0.0.1', resolve));
  const addr = srv.address();
  if (typeof addr === 'string' || addr === null) throw new Error('no port');
  return {
    port: addr.port,
    close: () =>
      new Promise<void>((resolve) => {
        srv.close(() => resolve());
      }),
  };
};

let server: MockClamd | null = null;

afterEach(async () => {
  if (server) {
    await server.close();
    server = null;
  }
});

describe('clamd zINSTREAM protocol', () => {
  it('parses a clean reply', async () => {
    server = await mockClamd(() => 'stream: OK');
    const verdict = await scanBytes(
      { host: '127.0.0.1', port: server.port },
      Buffer.from('hello world'),
    );
    expect(verdict).toEqual({ status: 'clean' });
  });

  it('parses an infected reply with the signature name', async () => {
    server = await mockClamd(() => 'stream: Eicar-Test-Signature FOUND');
    const verdict = await scanBytes(
      { host: '127.0.0.1', port: server.port },
      Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'),
    );
    expect(verdict).toEqual({ status: 'infected', signature: 'Eicar-Test-Signature' });
  });

  it('returns error verdict on size limit reply', async () => {
    server = await mockClamd(() => 'INSTREAM size limit exceeded. ERROR');
    const verdict = await scanBytes(
      { host: '127.0.0.1', port: server.port },
      Buffer.from('payload'),
    );
    expect(verdict.status).toBe('error');
  });

  it('streams the payload bytes verbatim', async () => {
    let received: Buffer | null = null;
    server = await mockClamd((_cmd, body) => {
      received = body;
      return 'stream: OK';
    });
    const payload = Buffer.from('the quick brown fox jumps over the lazy dog');
    await scanBytes({ host: '127.0.0.1', port: server.port }, payload);
    expect(received).not.toBeNull();
    expect(Buffer.compare(received!, payload)).toBe(0);
  });

  it('pingClamd returns true on PONG', async () => {
    server = await mockClamd(() => 'PONG');
    const ok = await pingClamd({ host: '127.0.0.1', port: server.port });
    expect(ok).toBe(true);
  });

  it('pingClamd returns false when host refuses', async () => {
    const ok = await pingClamd({ host: '127.0.0.1', port: 1, timeoutMs: 200 });
    expect(ok).toBe(false);
  });
});
