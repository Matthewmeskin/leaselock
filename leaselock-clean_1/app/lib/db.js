'use client'
import { createClient } from './supabase/client'

// Async data-access layer backed by Supabase (per-user via RLS).
// Functions return objects shaped like the old localStorage records so the
// UI components need minimal changes.

const QUIZ_FIELDS = ['pets', 'roommates', 'cosigner', 'departure', 'furnished']

export async function getCurrentUser() {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
}

/* ---------------- Household (shared lease) ---------------- */
let _householdId = null

export function clearHouseholdCache() { _householdId = null }

// The caller's active lease/household id. Cached for the session.
export async function activeHouseholdId() {
  if (_householdId) return _householdId
  const supabase = createClient()
  const { data, error } = await supabase.rpc('ensure_household')
  if (error) throw error
  if (!data) throw new Error('Could not set up your lease. Try opening Lease & roommates first.')
  _householdId = data
  return _householdId
}

// Full household details + members (with names) for the Lease & roommates page.
export async function getHousehold() {
  const supabase = createClient()
  const hid = await activeHouseholdId()
  if (!hid) return null
  const user = await getCurrentUser()

  const { data: hh, error: e1 } = await supabase
    .from('households')
    .select('id, name, invite_code, created_by, created_at')
    .eq('id', hid)
    .maybeSingle()
  if (e1) throw e1
  if (!hh) return null

  const { data: members, error: e2 } = await supabase
    .from('household_members')
    .select('user_id, role, joined_at')
    .eq('household_id', hid)
    .order('joined_at', { ascending: true })
  if (e2) throw e2

  const ids = (members || []).map((m) => m.user_id)
  let profileMap = {}
  if (ids.length) {
    const { data: profiles, error: e3 } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', ids)
    if (e3) throw e3
    profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
  }

  const list = (members || []).map((m) => ({
    userId: m.user_id,
    role: m.role,
    name: profileMap[m.user_id]?.full_name || 'Roommate',
    avatar: profileMap[m.user_id]?.avatar_url || null,
    isYou: user && m.user_id === user.id,
  }))
  return {
    id: hh.id,
    name: hh.name,
    inviteCode: hh.invite_code,
    createdBy: hh.created_by,
    isOwner: user && hh.created_by === user.id,
    members: list,
    isShared: list.length > 1,
  }
}

export async function joinHousehold(code) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('join_household', { p_code: (code || '').trim() })
  if (error) throw error
  clearHouseholdCache()
  return Array.isArray(data) ? data[0] : data
}

export async function leaveHousehold() {
  const supabase = createClient()
  const { error } = await supabase.rpc('leave_household')
  if (error) throw error
  clearHouseholdCache()
}

export async function renameHousehold(name) {
  const supabase = createClient()
  const { error } = await supabase.rpc('rename_household', { p_name: name })
  if (error) throw error
}

export async function regenerateInvite() {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('regenerate_invite_code')
  if (error) throw error
  return data
}

/* ---------------- Profile / quiz answers ---------------- */
export async function getProfile() {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, pets, roommates, cosigner, departure, furnished, household_id')
    .eq('id', user.id)
    .maybeSingle()
  if (error) throw error
  return data
}

// True once the user has completed the setup quiz.
export function quizComplete(profile) {
  if (!profile) return false
  return QUIZ_FIELDS.every((f) => profile[f] != null && profile[f] !== '')
}

export async function saveQuizAnswers(answers) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Not signed in')
  // Ensure profile + household row exists (created on signup, but may be missing for older accounts).
  await activeHouseholdId()
  const row = { id: user.id, updated_at: new Date().toISOString() }
  for (const f of QUIZ_FIELDS) row[f] = answers[f] ?? null
  const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' })
  if (error) throw error
}

/* ---------------- Calendar ---------------- */
export async function listCalendar() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('calendar_events')
    .select('id, type, title, date')
    .order('date', { ascending: true })
  if (error) throw error
  return data || []
}

export async function addCalendar({ type, title, date }) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Not signed in')
  const household_id = await activeHouseholdId()
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({ user_id: user.id, household_id, type, title, date })
    .select('id, type, title, date')
    .single()
  if (error) throw error
  return data
}

export async function deleteCalendar(id) {
  const supabase = createClient()
  const { error } = await supabase.from('calendar_events').delete().eq('id', id)
  if (error) throw error
}

/* ---------------- Maintenance ---------------- */
function mapMaint(r) {
  return { id: r.id, title: r.title, room: r.room, note: r.note, status: r.status, msg: r.msg || '', created: r.created_at }
}

export async function listMaintenance() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('maintenance_issues')
    .select('id, title, room, note, status, msg, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapMaint)
}

export async function addMaintenance({ title, room, note }) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Not signed in')
  const household_id = await activeHouseholdId()
  const { data, error } = await supabase
    .from('maintenance_issues')
    .insert({ user_id: user.id, household_id, title, room, note, status: 'open', msg: '' })
    .select('id, title, room, note, status, msg, created_at')
    .single()
  if (error) throw error
  return mapMaint(data)
}

export async function updateMaintenance(id, patch) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('maintenance_issues')
    .update(patch)
    .eq('id', id)
    .select('id, title, room, note, status, msg, created_at')
    .single()
  if (error) throw error
  return mapMaint(data)
}

export async function deleteMaintenance(id) {
  const supabase = createClient()
  const { error } = await supabase.from('maintenance_issues').delete().eq('id', id)
  if (error) throw error
}

/* ---------------- Rent ---------------- */
function mapRent(r) {
  return { id: r.id, month: r.month, amount: r.amount, method: r.method, paid: r.paid_at }
}

export async function listRent() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rent_payments')
    .select('id, month, amount, method, paid_at')
    .order('paid_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapRent)
}

export async function addRent({ month, amount, method }) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Not signed in')
  const household_id = await activeHouseholdId()
  const { data, error } = await supabase
    .from('rent_payments')
    .insert({ user_id: user.id, household_id, month, amount, method })
    .select('id, month, amount, method, paid_at')
    .single()
  if (error) throw error
  return mapRent(data)
}

export async function deleteRent(id) {
  const supabase = createClient()
  const { error } = await supabase.from('rent_payments').delete().eq('id', id)
  if (error) throw error
}

/* ---------------- Roommate agreement ---------------- */
const RM_BLANK = { address: '', startDate: '', roommates: [], terms: {}, generated: '', generatedAt: '', signatures: {} }

function mapRoommate(r) {
  if (!r) return { ...RM_BLANK }
  return {
    address: r.address || '',
    startDate: r.start_date || '',
    roommates: r.roommates || [],
    terms: r.terms || {},
    generated: r.generated || '',
    generatedAt: r.generated_at || '',
    signatures: r.signatures || {},
  }
}

export async function getRoommate() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('roommate_agreements')
    .select('address, start_date, roommates, terms, generated, generated_at, signatures')
    .maybeSingle()
  if (error) throw error
  return mapRoommate(data)
}

export async function saveRoommate(d) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Not signed in')
  const household_id = await activeHouseholdId()
  const row = {
    household_id,
    user_id: user.id,
    address: d.address || null,
    start_date: d.startDate || null,
    roommates: d.roommates || [],
    terms: d.terms || {},
    generated: d.generated || null,
    generated_at: d.generatedAt || null,
    signatures: d.signatures || {},
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase
    .from('roommate_agreements')
    .upsert(row, { onConflict: 'household_id' })
  if (error) throw error
}

/* ---------------- Lease review (shared, latest per household) ---------------- */
export async function getLeaseReview() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lease_reviews')
    .select('data, reviewed_at')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { ...data.data, reviewedAt: data.reviewed_at }
}

export async function saveLeaseReview(reviewData) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Not signed in')
  const household_id = await activeHouseholdId()
  const { error } = await supabase
    .from('lease_reviews')
    .upsert(
      { household_id, data: reviewData, reviewed_at: new Date().toISOString(), created_by: user.id },
      { onConflict: 'household_id' }
    )
  if (error) throw error
}

/* ---------------- Move-in reports (saved + shared with landlord) ---------------- */
export async function saveMoveInReport({ unitAddress, tenantName, reportText, rooms, property }) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Not signed in')
  let household_id = null
  try { household_id = await activeHouseholdId() } catch { /* report still saves without household */ }
  const { data, error } = await supabase
    .from('shared_reports')
    .insert({
      created_by: user.id,
      household_id,
      unit_address: unitAddress || null,
      tenant_name: tenantName || null,
      report_text: reportText,
      rooms: rooms || [],
      property: property || null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

// All reports visible to this user (their own + household ones).
export async function listMoveInReports() {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('shared_reports')
    .select('id, token, unit_address, tenant_name, locked_at, landlord_name, landlord_signed_at, created_by, property')
    .order('locked_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function latestMoveInReport() {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('shared_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function refreshMoveInReport(id) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shared_reports')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateMoveInReportText(id, text) {
  const supabase = createClient()
  const { error } = await supabase
    .from('shared_reports')
    .update({ report_text: text })
    .eq('id', id)
  if (error) throw error
}

// Photos shared with the landlord view live in a public bucket under an
// unguessable per-report folder — same trust model as the signing token.
export async function uploadReportPhoto(path, blob) {
  const supabase = createClient()
  const { error } = await supabase.storage
    .from('report-photos')
    .upload(path, blob, { contentType: blob.type || 'image/jpeg' })
  if (error) throw error
  return supabase.storage.from('report-photos').getPublicUrl(path).data.publicUrl
}

/* ---------------- Household documents (storage-backed) ---------------- */
export async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl)
  return res.blob()
}

// Upload a file/blob to household storage and record it. Visible to all roommates.
export async function uploadDocument(blob, { name, kind = 'file', context = null }) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Not signed in')
  const household_id = await activeHouseholdId()
  const safeName = (name || 'file').replace(/[^a-zA-Z0-9._ -]/g, '_')
  const path = `${household_id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`
  const { error: upErr } = await supabase.storage
    .from('documents')
    .upload(path, blob, { contentType: blob.type || 'application/octet-stream' })
  if (upErr) throw upErr
  const { data, error } = await supabase
    .from('documents')
    .insert({ household_id, uploaded_by: user.id, name: safeName, kind, context, storage_path: path, size_bytes: blob.size })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function listDocuments() {
  const supabase = createClient()
  await activeHouseholdId() // ensure membership exists before RLS-scoped select
  const { data, error } = await supabase
    .from('documents')
    .select('id, name, kind, context, storage_path, size_bytes, created_at, uploaded_by')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function documentUrl(storagePath) {
  const supabase = createClient()
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(storagePath, 3600)
  if (error) throw error
  return data.signedUrl
}

export async function deleteDocument(doc) {
  const supabase = createClient()
  await supabase.storage.from('documents').remove([doc.storage_path])
  const { error } = await supabase.from('documents').delete().eq('id', doc.id)
  if (error) throw error
}

export async function signOut() {
  const supabase = createClient()
  clearHouseholdCache()
  await supabase.auth.signOut()
}
