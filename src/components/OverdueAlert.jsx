import { useEffect, useState } from 'react'
import { formatDate } from '../useStore.js'
import { personById } from '../auth.js'

// Всплывающее напоминание о просроченных задачах
export default function OverdueAlert({ overdueTasks, onShow, onOpenTask }) {
  const [dismissed, setDismissed] = useState(false)

  // Если появились новые просроченные — показать напоминание снова
  useEffect(() => {
    if (overdueTasks.length > 0) setDismissed(false)
  }, [overdueTasks.length])

  if (dismissed || overdueTasks.length === 0) return null

  const shown = overdueTasks.slice(0, 4)
  const rest = overdueTasks.length - shown.length

  return (
    <div className="toast toast-danger" role="alert">
      <div className="toast-head">
        <span className="toast-icon">⏰</span>
        <b>
          Просрочено: {overdueTasks.length}{' '}
          {plural(overdueTasks.length, 'задача', 'задачи', 'задач')}
        </b>
        <button className="icon-btn" onClick={() => setDismissed(true)} aria-label="Скрыть">×</button>
      </div>
      <ul className="toast-list">
        {shown.map((t) => {
          const person = personById(t.assignee)
          return (
            <li key={t.id} onClick={() => onOpenTask(t)}>
              <span className="toast-task-title">{t.title}</span>
              <span className="toast-task-meta">
                до {formatDate(t.due)}{person ? ` · ${person.name.split(' ')[0]}` : ''}
              </span>
            </li>
          )
        })}
      </ul>
      {rest > 0 && <div className="toast-more">и ещё {rest}…</div>}
      <button
        className="btn btn-sm toast-action"
        onClick={() => {
          onShow()
          setDismissed(true)
        }}
      >
        Показать все просроченные
      </button>
    </div>
  )
}

function plural(n, one, few, many) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few
  return many
}
