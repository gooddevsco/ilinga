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
    region: cfg.IL_S3_REGION,
    credentials: {
      accessKeyId: cfg.IL_S3_ACCESS_KEY,
      secretAccessKey: cfg.IL_S3_SECRET_KEY,
    },
    forcePathStyle: cfg.IL_S3_FORCE_PATH_STYLE === 'true',
  });
  return cachedClient;
};

export const presignPut = async (
  key: string,
  contentType: string,
  expiresInSeconds = 600,
): Promise<{ url: string; key: string }> => {
  const cmd = new PutObjectCommand({
    Bucket: config().IL_S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(client(), cmd, { expiresIn: expiresInSeconds });
  return { url, key };
};

export const presignGet = async (key: string, expiresInSeconds = 600): Promise<string> => {
  const cmd = new GetObjectCommand({ Bucket: config().IL_S3_BUCKET, Key: key });
  return getSignedUrl(client(), cmd, { expiresIn: expiresInSeconds });
};
