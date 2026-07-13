// Аккаунты и сессии задачника NSL.
// Хранение — localStorage (демо-режим без сервера): пароли хэшируются SHA-256 с солью.
// Вся логика изолирована здесь, чтобы позже заменить на реальный бэкенд.

import { EMPLOYEES } from './data.js'

const USERS_KEY = 'nsl-users-v1'
const SESSION_KEY = 'nsl-session-v1'

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('Не удалось прочитать пользователей:', e)
  }
  return []
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// SHA-256 через WebCrypto; простой fallback для сред без crypto.subtle
async function hashPassword(password, salt) {
  const text = `${salt}:${password}`
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return 'fnv_' + h.toString(16)
}

const randomSalt = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Регистрация нового аккаунта. Бросает Error с понятным сообщением.
export async function registerUser({ name, email, password, dept, role }) {
  const cleanName = name?.trim()
  const cleanEmail = email?.trim().toLowerCase()
  if (!cleanName) throw new Error('Укажите имя и фамилию')
  if (!EMAIL_RE.test(cleanEmail || '')) throw new Error('Некорректный email')
  if (!password || password.length < 6) throw new Error('Пароль должен быть не короче 6 символов')

  const users = loadUsers()
  if (users.some((u) => u.email === cleanEmail)) {
    throw new Error('Аккаунт с таким email уже зарегистрирован')
  }

  const salt = randomSalt()
  const user = {
    id: `acc_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
    name: cleanName,
    email: cleanEmail,
    dept: dept || null,
    role: role?.trim() || 'Сотрудник',
    salt,
    passwordHash: await hashPassword(password, salt),
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  saveUsers(users)
  setSession(user.id)
  return publicUser(user)
}

// Вход по email и паролю
export async function loginUser(email, password) {
  const cleanEmail = email?.trim().toLowerCase()
  const user = loadUsers().find((u) => u.email === cleanEmail)
  if (!user) throw new Error('Аккаунт с таким email не найден')
  const hash = await hashPassword(password || '', user.salt)
  if (hash !== user.passwordHash) throw new Error('Неверный пароль')
  setSession(user.id)
  return publicUser(user)
}

const publicUser = ({ passwordHash, salt, ...rest }) => rest

export function setSession(userId) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, at: Date.now() }))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

// Текущий пользователь по сессии (или null)
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const { userId } = JSON.parse(raw)
    const user = loadUsers().find((u) => u.id === userId)
    return user ? publicUser(user) : null
  } catch {
    return null
  }
}

// Все люди, доступные как ответственные: штатные сотрудники + зарегистрированные аккаунты
export function getAllPeople() {
  const accounts = loadUsers().map(publicUser)
  return [...accounts, ...EMPLOYEES]
}

export function personById(id) {
  return getAllPeople().find((p) => p.id === id) || null
}
