import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function uploadCoverToSupabase(file) {
  const fileName = `${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from('covers').upload(fileName, file);
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName);
  return publicUrl;
}