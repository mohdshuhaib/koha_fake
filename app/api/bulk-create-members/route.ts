// app/api/bulk-create-members/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // MUST be Service Role
)

export async function POST(req: NextRequest) {
  try {
    const members = await req.json()

    const addedMembers = []
    const errors = []

    for (const member of members) {
      const { name, category, barcode, batch } = member
      const cleanBarcode = String(barcode || '').trim()

      if (!name || !category || !cleanBarcode || !batch) {
        errors.push({ barcode: cleanBarcode || 'missing-barcode', error: 'Missing required fields' })
        continue
      }

      // Create auth user
      const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: `${cleanBarcode.toLowerCase()}@member.pmsa`,
        password: cleanBarcode.padEnd(6, '0'),
        email_confirm: true
      })

      if (userError) {
        console.error('Auth user creation error:', userError)
        errors.push({ barcode: cleanBarcode, error: userError.message })
        continue
      }

      // Insert into members table
      const { error: insertError } = await supabaseAdmin.from('members').insert([
        {
          id: user.user.id,
          name,
          category,
          barcode: cleanBarcode,
          batch
        }
      ])

      if (insertError) {
        console.error('Members table insert error:', insertError)
        await supabaseAdmin.auth.admin.deleteUser(user.user.id)
        errors.push({ barcode: cleanBarcode, error: insertError.message })
        continue
      }

      addedMembers.push(cleanBarcode)
    }

    return NextResponse.json({
      success: true,
      addedCount: addedMembers.length,
      failed: errors
    })
  } catch (err) {
    console.error('Bulk creation error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
