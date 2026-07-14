import { useEffect, useRef, useState } from 'react'
import { forUser, unreadCount, timeAgo } from '../notifications.js'

// Колокольчик уведомлений в шапке + всплывающий тост о выполненной задаче
export default function NotificationBell({ notifications, userId, onOpenTask, onMarkAllRead, onClear, tasksById }) {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState(null) // последнее свежее уведомление
  const seenIds = useRef(new Set(notifications.map((n) => n.id)))

  const mine = forUser(notifications, userId)
  const unread = unreadCount(notifications, userId)

  // Новое уведомление для меня → показать тост на несколько секунд
  useEffect(() => {
    const fresh = mine.find((n) => !seenIds.current.has(n.id))
    notifications.forEach((n) => seenIds.current.add(n.id))
    if (fresh) {
      setToast(fresh)
      const t = setTimeout(() => setToast(null), 6000)
      return () => clearTimeout(t)
    }
  }, [notifications]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && unread > 0) onMarkAllRead()
  }

  const openTask = (n) => {
    const task = tasksById[n.taskId]
    if (task) onOpenTask(task)
    setOpen(false)
    setToast(null)
  }

  return (
    <div className="user-menu">
      <button className="bell-btn" onClick={toggle} title="Уведомления" aria-label="Уведомления">
        🔔
        {unread > 0 && <span className="bell-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <>
          <div className="menu-backdrop" onClick={() => setOpen(false)} />
          <div className="dropdown notif-dropdown">
            <div className="dropdown-profile notif-head">
              <div className="dropdown-name">Уведомления</div>
              {mine.length > 0 && (
                <button className="link" type="button" onClick={onClear}>
                  Очистить
                </button>
              )}
            </div>
            {mine.length === 0 ? (
              <div className="notif-empty">Пока пусто — уведомления появятся, когда ваши задачи будут выполнены</div>
            ) : (
              <ul className="notif-list">
                {mine.slice(0, 15).map((n) => {
                  const icon = n.type === 'task_assigned' ? '📌' : n.type === 'task_new' ? '📋' : '✅'
                  return (
                    <li key={n.id} className={n.read ? '' : 'unread'} onClick={() => openTask(n)}>
                      <span className="notif-icon">{icon}</span>
                      <span className="notif-body">
                        <span className="notif-text">
                          {n.type === 'task_assigned' ? (
                            <>Вам поставлена задача <b>«{n.taskTitle}»</b>{n.byName ? <> — {n.byName}</> : null}</>
                          ) : n.type === 'task_new' ? (
                            <>Новая задача <b>«{n.taskTitle}»</b>{n.byName ? <> — поставил(а) {n.byName}</> : null}</>
                          ) : (
                            <>Задача <b>«{n.taskTitle}»</b> выполнена{n.byName ? <> — {n.byName}</> : null}</>
                          )}
                        </span>
                        <span className="notif-time">{timeAgo(n.createdAt)}</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {toast && (
        <div className="toast toast-success" role="status" onClick={() => openTask(toast)}>
          <div className="toast-head">
            <span className="toast-icon">
              {toast.type === 'task_assigned' ? '📌' : toast.type === 'task_new' ? '📋' : '✅'}
            </span>
            <b>
              {toast.type === 'task_assigned'
                ? 'Вам поставлена задача'
                : toast.type === 'task_new'
                ? 'Новая задача'
                : 'Задача выполнена'}
            </b>
            <button
              className="icon-btn"
              onClick={(e) => {
                e.stopPropagation()
                setToast(null)
              }}
              aria-label="Скрыть"
            >
              ×
            </button>
          </div>
          <div className="toast-success-text">
            {toast.type === 'task_assigned' || toast.type === 'task_new'
              ? `«${toast.taskTitle}»${toast.byName ? ` — поставил(а) ${toast.byName}` : ''}`
              : `«${toast.taskTitle}» переведена в «Готово»${toast.byName ? ` — ${toast.byName}` : ''}`}
          </div>
        </div>
      )}
    </div>
  )
}
