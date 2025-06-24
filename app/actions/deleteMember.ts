'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function deleteAuthUserByEmail(email: string): Promise<boolean> {
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (listError) {
    console.error('List Users Error:', listError.message)
    return false
  }

  const user = listData.users.find((u) => u.email === email)

  if (!user) {
    console.warn('Auth user not found for email:', email)
    return false
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

  if (deleteError) {
    console.error('Delete Auth User Error:', deleteError.message)
    return false
  }

  return true
}
