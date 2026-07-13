// Удалённый режим: все операции задачника через Supabase.
// Формы данных совпадают с локальным режимом, чтобы интерфейс не менялся.

import { supabase } from './supabaseClient.js'

// ---------- Аутентификация ----------

const RU_AUTH_ERRORS = {
  'Invalid login credentials': 'Неверный email или пароль',
  'Email not confirmed': 'Email не подтверждён — откройте письмо и перейдите по ссылке',
  'User already registered': 'Аккаунт с таким email уже зарегистрирован',
  'Password should be at least 6 characters.': 'Пароль должен быть не короче 6 символов',
}

const ruError = (e) =>
  new Error(RU_AUTH_ERRORS[e?.message] || e?.message || 'Что-то пошло не так, попробуйте ещё раз')

export async function remoteSignUp({ name, email, password, dept, role }) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { name: name.trim(), dept, role: role?.trim() || 'Сотрудник' } },
  })
  if (error) throw ruError(error)
  // Если включено подтверждение email — сессии ещё нет
  if (!data.session) return { needsConfirm: true }
  return { user: await fetchMyProfile(data.session.user) }
}

export async function remoteSignIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })
  if (error) throw ruError(error)
  return fetchMyProfile(data.session.user)
}

export async function remoteSignOut() {
  await supabase.auth.signOut()
}

export async function remoteGetUser() {
  const { data } = await supabase.auth.getSession()
  if (!data.session) return null
  return fetchMyProfile(data.session.user)
}

// Профиль из таблицы profiles c запасным вариантом из метаданных сессии
async function fetchMyProfile(authUser) {
  const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle()
  if (data) return data
  const meta = authUser.user_metadata || {}
  return {
    id: authUser.id,
    name: meta.name || authUser.email.split('@')[0],
    email: authUser.email,
    dept: meta.dept || null,
    role: meta.role || 'Сотрудник',
  }
}

export async function fetchProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('name')
  if (error) throw error
  return data || []
}

// ---------- Задачи ----------

const taskToApp = (r) => ({
  id: r.id,
  title: r.title,
  description: r.description || '',
  measure: r.measure || '',
  relevance: r.relevance || '',
  dept: r.dept,
  assignees: r.assignees || [],
  status: r.status,
  priority: r.priority,
  due: r.due || '',
  createdAt: (r.created_at || '').slice(0, 10),
  tags: r.tags || [],
  attachments: r.attachments || [],
})

const taskToRow = (t) => ({
  title: t.title?.trim() || 'Без названия',
  description: t.description?.trim() || '',
  measure: t.measure?.trim() || '',
  relevance: t.relevance?.trim() || '',
  dept: t.dept,
  assignees: t.assignees || [],
  status: t.status || 'todo',
  priority: t.priority || 'medium',
  due: t.due || null,
  tags: t.tags || [],
  attachments: t.attachments || [],
})

export async function fetchTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(taskToApp)
}

export async function insertTask(data, userId) {
  const { data: row, error } = await supabase
    .from('tasks')
    .insert({ ...taskToRow(data), created_by: userId })
    .select()
    .single()
  if (error) throw error
  return taskToApp(row)
}

export async function updateTaskRemote(id, patch) {
  const { error } = await supabase.from('tasks').update(taskToRow(patch)).eq('id', id)
  if (error) throw error
}

export async function moveTaskRemote(id, status) {
  const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
  if (error) throw error
}

export async function deleteTaskRemote(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

// Живые обновления доски: любой INSERT/UPDATE/DELETE от коллег
export function subscribeTasks(onChange) {
  return supabase
    .channel('tasks-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, onChange)
    .subscribe()
}

// ---------- Уведомления ----------

const notifToApp = (r) => ({
  id: r.id,
  userId: r.user_id,
  taskId: r.task_id,
  taskTitle: r.task_title,
  byName: r.by_name,
  type: r.type,
  read: r.read,
  createdAt: r.created_at,
})

export async function fetchNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data || []).map(notifToApp)
}

export async function insertNotification({ userId, taskId, taskTitle, byName }) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    task_id: taskId,
    task_title: taskTitle,
    by_name: byName,
  })
  if (error) throw error
}

export async function markAllReadRemote(userId) {
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
}

export async function clearNotifsRemote(userId) {
  await supabase.from('notifications').delete().eq('user_id', userId)
}

// Живая доставка моих уведомлений
export function subscribeNotifications(userId, onInsert) {
  return supabase
    .channel('notif-live')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onInsert(notifToApp(payload.new)),
    )
    .subscribe()
}

// ---------- Файлы-вложения ----------

export async function uploadAttachment(file) {
  const safe = file.name.replace(/[^\w.\-а-яА-ЯёЁ]+/g, '_')
  const path = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}/${safe}`
  const { error } = await supabase.storage.from('attachments').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('attachments').getPublicUrl(path)
  return data.publicUrl
}
