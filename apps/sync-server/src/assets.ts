import { Readable } from 'stream'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import fs from 'fs/promises'
import path from 'path'

// Fallback to local storage if S3 isn't configured
const LOCAL_DIR = path.resolve('./.assets')
const USE_S3 = process.env.MINIO_ENDPOINT ? true : false

const s3Client = USE_S3 ? new S3Client({
    region: 'auto',
    endpoint: process.env.MINIO_ENDPOINT,
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || '',
        secretAccessKey: process.env.MINIO_SECRET_KEY || ''
    },
    forcePathStyle: true // Needed for MinIO
}) : null

const BUCKET_NAME = process.env.MINIO_BUCKET || 'sonagi-draw'

export async function storeAsset(id: string, stream: Readable) {
    if (USE_S3 && s3Client) {
        // Collect chunks from stream
        const chunks: Buffer[] = []
        for await (const chunk of stream) {
            chunks.push(chunk)
        }
        const body = Buffer.concat(chunks)

        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: id,
            Body: body,
            // You can also add ContentType if parsed
        }))
    } else {
        await fs.mkdir(LOCAL_DIR, { recursive: true })
        await fs.writeFile(path.join(LOCAL_DIR, id), stream)
    }
}

export async function loadAsset(id: string) {
    if (USE_S3 && s3Client) {
        // Return presigned URL or fetch object
        // Since the current API expects to return the data directly (buffer/stream), 
        // we will fetch and return the buffer.
        const response = await s3Client.send(new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: id
        }))
        const byteArray = await response.Body?.transformToByteArray()
        return Buffer.from(byteArray || [])
    } else {
        return await fs.readFile(path.join(LOCAL_DIR, id))
    }
}
