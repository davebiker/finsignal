export const dynamic = 'force-dynamic'

import { createSupabaseAdmin } from '@/lib/supabase'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

import { SUPERADMIN_EMAIL } from '@/lib/constants'

// GET /api/admin/users — list pending users
export async function GET(req: NextRequest) {
  const supabaseAuth = createServerComponentClient({ cookies })
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user || user.email !== SUPERADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ users: data })
}

// PATCH /api/admin/users — approve or reject a user
export async function PATCH(req: NextRequest) {
  const supabaseAuth = createServerComponentClient({ cookies })
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user || user.email !== SUPERADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await req.json()
  const { userId, action } = body as { userId: string; action: 'approve' | 'reject' }

  if (!userId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()

  if (action === 'approve') {
    const { error } = await admin
      .from('profiles')
      .update({ approved: true, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'reject') {
    // Delete the profile and the auth user
    const { error: profileError } = await admin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

    // Also delete from auth.users
    const { error: authError } = await admin.auth.admin.deleteUser(userId)
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
