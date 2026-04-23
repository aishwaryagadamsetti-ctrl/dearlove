import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

function genCode() {
  return Array.from(
    { length: 6 },
    () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
  ).join('')
}

export async function saveLetter(data) {
  let code = genCode()
  // retry on collision (very unlikely but safe)
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase
      .from('letters')
      .select('code')
      .eq('code', code)
      .single()
    if (!existing) break
    code = genCode()
  }

  const { error } = await supabase.from('letters').insert({
    code,
    payload: data,
  })
  if (error) throw error
  return code
}

export async function loadLetter(code) {
  const { data, error } = await supabase
    .from('letters')
    .select('payload')
    .eq('code', code.toLowerCase().trim())
    .single()
  if (error || !data) return null
  return data.payload
}
