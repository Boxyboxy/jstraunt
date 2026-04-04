import { createAdminClient } from '@/lib/supabase/admin'

export type StorageBucket = 'venue-photos' | 'dish-photos'

export async function uploadImage(
  bucket: StorageBucket,
  file: File,
  path: string
): Promise<string> {
  const supabase = createAdminClient()

  const ext = file.name.split('.').pop()
  const filePath = `${path}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '31536000',
      upsert: false,
    })

  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}

export async function deleteImage(bucket: StorageBucket, url: string): Promise<void> {
  const supabase = createAdminClient()

  // Extract path from public URL
  const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/)
  if (!match) return

  await supabase.storage.from(bucket).remove([match[1]])
}
