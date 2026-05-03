import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../../config.js';

let cachedClient: S3Client | null = null;

const client = (): S3Client => {
  if (cachedClient) return cachedClient;
  const cfg = config();
  cachedClient = new S3Client({
    endpoint: cfg.IL_S3_ENDPOINT,
    region: process.env.IL_S3_REGION ?? 'auto',
    credentials: {
      accessKeyId: process.env.IL_S3_ACCESS_KEY ?? 'mock',
      secretAccessKey: process.env.IL_S3_SECRET_KEY ?? 'mock',
    },
    forcePathStyle: process.env.IL_S3_FORCE_PATH_STYLE === 'true',
  });
  return cachedClient;
};

export const presignPut = async (
  key: string,
  contentType: string,
  expiresInSeconds = 600,
): Promise<{ url: string; key: string }> => {
  const cfg = config();
  const cmd = new PutObjectCommand({
    Bucket: process.env.IL_S3_BUCKET ?? 'ilinga-eu',
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(client(), cmd, { expiresIn: expiresInSeconds });
  void cfg;
  return { url, key };
};

export const presignGet = async (key: string, expiresInSeconds = 600): Promise<string> => {
  const cmd = new GetObjectCommand({
    Bucket: process.env.IL_S3_BUCKET ?? 'ilinga-eu',
    Key: key,
  });
  return getSignedUrl(client(), cmd, { expiresIn: expiresInSeconds });
};
