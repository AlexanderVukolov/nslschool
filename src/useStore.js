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
      return tasks.map((t) => (DEPT_MIGRATION[t.dept] ? { ...t, dept: DEPT_MIGRATION[t.dept] } : t))
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
    }
  }, [tasks])

  const addTask = useCallback((data) => {
    const task = {
      id: nextId(),
      title: data.title?.trim() || 'Без названия',
      description: data.description?.trim() || '',
      dept: data.dept,
      assignee: data.assignee || null,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      due: data.due || '',
      createdAt: new Date().toISOString().slice(0, 10),
      tags: data.tags || [],
    }
    setTasks((prev) => [task, ...prev])
    return task
  }, [])

  const updateTask = useCallback((id, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  const removeTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const moveTask = useCallback((id, status) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
  }, [])

  const resetDemo = useCallback(() => {
    setTasks(SEED_TASKS)
  }, [])

  const clearAll = useCallback(() => {
    setTasks([])
  }, [])

  return { tasks, addTask, updateTask, removeTask, moveTask, resetDemo, clearAll }
}

// Дедлайн-статус задачи: overdue / soon / ok / none
export function deadlineState(due) {
  if (!due) return 'none'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(due)
  d.setHours(0, 0, 0, 0)
  const diffDays = Math.round((d - today) / 86400000)
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 2) return 'soon'
  return 'ok'
}

export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

// Фильтрация + сортировка списка задач
export function useFilteredTasks(tasks, filters) {
  return useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    let list = tasks.filter((t) => {
      if (filters.dept !== 'all' && t.dept !== filters.dept) return false
      if (filters.assignee !== 'all' && t.assignee !== filters.assignee) return false
      if (filters.priority !== 'all' && t.priority !== filters.priority) return false
      if (filters.onlyOverdue && deadlineState(t.due) !== 'overdue') return false
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
        return new Date(a.due) - new Date(b.due)
      })
    }
    return list
  }, [tasks, filters])
}
