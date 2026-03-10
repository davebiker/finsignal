export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createSupabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/profile — get current user's profile (approved status, role)
export async function GET() {
  const supabaseAuth = createServerComponentClient({ cookies })
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const admin = createSupabaseAdmin()
  const { data: profile, error } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If no profile exists yet (edge case — trigger hasn't fired), create one
  if (!profile) {
    const isAdmin = user.email === 'david@beska.cz'
    const { data: newProfile, error: insertError } = await admin
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        role: isAdmin ? 'admin' : 'user',
        approved: isAdmin,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ profile: newProfile })
  }

  return NextResponse.json({ profile })
}
