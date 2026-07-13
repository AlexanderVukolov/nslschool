import { useCallback, useEffect, useState } from 'react'
import {
  fetchTasks,
  insertTask,
  updateTaskRemote,
  moveTaskRemote,
  deleteTaskRemote,
  subscribeTasks,
} from './remote.js'

// Стор задач в удалённом режиме: общая база + живые обновления.
// API совпадает с useStore, чтобы App работал с обоими режимами одинаково.
export function useRemoteStore(enabled, user) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !user) return
    let alive = true
    const load = () =>
      fetchTasks()
        .then((ts) => {
          if (!alive) return
          setTasks(ts)
          setError(null)
          setLoading(false)
        })
        .catch((e) => {
          if (!alive) return
          console.warn('Загрузка задач не удалась:', e)
          setError(e)
          setLoading(false)
        })
    load()
    const channel = subscribeTasks(load)
    return () => {
      alive = false
      channel?.unsubscribe()
    }
  }, [enabled, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const addTask = useCallback(
    (data) => {
      insertTask(data, user?.id)
        .then((t) => setTasks((prev) => [t, ...prev.filter((x) => x.id !== t.id)]))
        .catch((e) => setError(e))
    },
    [user?.id],
  )

  const updateTask = useCallback((id, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    updateTaskRemote(id, patch).catch((e) => setError(e))
  }, [])

  const removeTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    deleteTaskRemote(id).catch((e) => setError(e))
  }, [])

  const moveTask = useCallback((id, status) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
    moveTaskRemote(id, status).catch((e) => setError(e))
  }, [])

  return { tasks, loading, error, addTask, updateTask, removeTask, moveTask }
}
