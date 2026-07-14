import { useCallback, useEffect, useMemo, useState } from 'react'
import { SEED_TASKS, PRIORITIES, byId } from './data.js'

const STORAGE_KEY = 'nsl-tasks-v1'

// Миграция id отделов из ранних версий на актуальную структуру NSL
const DEPT_MIGRATION = {
  education: 'product',
  methodology: 'product',
  curators: 'curation',
  marketing: 'smm',
  content: 'smm',
  support: 'curation',
  hr: 'admin',
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const tasks = JSON.parse(raw)
      return tasks.map((t) => {
        const next = DEPT_MIGRATION[t.dept] ? { ...t, dept: DEPT_MIGRATION[t.dept] } : { ...t }
        // Миграция: одиночный assignee -> массив assignees
        if (!Array.isArray(next.assignees)) {
          next.assignees = next.assignee ? [next.assignee] : []
        }
        delete next.assignee
        return next
      })
    }
  } catch (e) {
    console.warn('Не удалось прочитать сохранённые задачи:', e)
  }
  return SEED_TASKS
}

let idCounter = Date.now()
const nextId = () => `t${idCounter++}`

// Единый стор задачника: хранит задачи, сохраняет их в localStorage
// и отдаёт методы для добавления/изменения/удаления/перемещения.
export function useStore() {
  const [tasks, setTasks] = useState(loadTasks)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch (e) {
      console.warn('Не удалось сохранить задачи:', e)
      alert(
        'Хранилище браузера переполнено — изменения не сохранились. ' +
          'Удалите крупные файлы из задач или прикрепляйте их ссылками.',
      )
    }
  }, [tasks])

  const addTask = useCallback((data) => {
    const task = {
      id: nextId(),
      title: data.title?.trim() || 'Без названия',
      description: data.description?.trim() || '',
      measure: data.measure?.trim() || '',
      relevance: data.relevance?.trim() || '',
      dept: data.dept,
      assignees: data.assignees || [],
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      due: data.due || '',
      dueTime: data.dueTime || '',
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy: data.createdBy || null,
      tags: data.tags || [],
      attachments: data.attachments || [],
    }
    setTasks((prev) => [task, ...prev])
    return task
  }, [])

  const updateTask = useCallback((id, patch) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)),
    )
  }, [])

  const removeTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const moveTask = useCallback((id, status) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t)),
    )
  }, [])

  const resetDemo = useCallback(() => {
    setTasks(SEED_TASKS)
  }, [])

  const clearAll = useCallback(() => {
    setTasks([])
  }, [])

  return { tasks, addTask, updateTask, removeTask, moveTask, resetDemo, clearAll }
}

// Дедлайн-статус задачи: overdue / soon / ok / none.
// Если указано время — просрочка считается с точностью до минуты,
// без времени задача «горит» только со следующего дня.
export function deadlineState(due, dueTime) {
  if (!due) return 'none'
  const now = new Date()
  const deadline = new Date(`${due}T${dueTime || '23:59'}`)
  if (deadline < now) return 'overdue'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(due)
  d.setHours(0, 0, 0, 0)
  if (Math.round((d - today) / 86400000) <= 2) return 'soon'
  return 'ok'
}

export function formatDate(iso, time) {
  if (!iso) return '—'
  const d = new Date(iso)
  const date = d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
  return time ? `${date} ${time}` : date
}

// Фильтрация + сортировка списка задач
export function useFilteredTasks(tasks, filters) {
  return useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    let list = tasks.filter((t) => {
      if (filters.dept !== 'all' && t.dept !== filters.dept) return false
      if (filters.assignee !== 'all' && !(t.assignees || []).includes(filters.assignee)) return false
      if (filters.priority !== 'all' && t.priority !== filters.priority) return false
      if (filters.onlyOverdue && deadlineState(t.due, t.dueTime) !== 'overdue') return false
      if (q) {
        const hay = `${t.title} ${t.description} ${(t.tags || []).join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    if (filters.sort === 'priority') {
      list = [...list].sort(
        (a, b) => (byId(PRIORITIES, b.priority)?.weight || 0) - (byId(PRIORITIES, a.priority)?.weight || 0),
      )
    } else if (filters.sort === 'due') {
      list = [...list].sort((a, b) => {
        if (!a.due) return 1
        if (!b.due) return -1
        return (
          new Date(`${a.due}T${a.dueTime || '23:59'}`) - new Date(`${b.due}T${b.dueTime || '23:59'}`)
        )
      })
    }
    return list
  }, [tasks, filters])
}
