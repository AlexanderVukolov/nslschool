import { DEPARTMENTS, PRIORITIES, byId } from '../data.js'
import { deadlineState, formatDate } from '../useStore.js'
import { personById } from '../auth.js'

export function initials(name) {
  if (!name) return '?'
  const p = name.trim().split(/\s+/)
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase()
}

// Цвет аватара по хешу имени
export function avatarColor(id) {
  const palette = ['#1f8a4c', '#0284c7', '#d946ef', '#ea580c', '#7c3aed', '#0d9488', '#db2777', '#2563eb', '#65a30d']
  let h = 0
  for (const c of id || '') h = (h * 31 + c.charCodeAt(0)) % palette.length
  return palette[h]
}

// Кружок человека: фото профиля, если загружено, иначе цветные инициалы
export function PersonCircle({ person, className = 'circle' }) {
  if (person?.avatar_url) {
    return <img className={className} src={person.avatar_url} alt={person.name || ''} />
  }
  return (
    <span className={className} style={{ background: avatarColor(person?.id || '?') }}>
      {initials(person?.name)}
    </span>
  )
}

// Стопка аватаров нескольких ответственных: до 3 кружков + счётчик
export function AvatarStack({ userIds }) {
  const ids = userIds || []
  if (ids.length === 0) return <Avatar userId={null} />
  if (ids.length === 1) return <Avatar userId={ids[0]} />
  const people = ids.map((id) => personById(id)).filter(Boolean)
  const shown = people.slice(0, 3)
  const rest = people.length - shown.length
  return (
    <span className="avatar-stack" title={people.map((p) => p.name).join(', ')}>
      {shown.map((p) => (
        <PersonCircle key={p.id} person={p} />
      ))}
      {rest > 0 && <span className="circle more">+{rest}</span>}
    </span>
  )
}

export function Avatar({ userId }) {
  const user = personById(userId)
  if (!user) {
    return (
      <span className="avatar">
        <span className="circle" style={{ background: '#cbd5cf' }}>—</span>
        Не назначен
      </span>
    )
  }
  return (
    <span className="avatar" title={`${user.name} · ${user.role}`}>
      <PersonCircle person={user} />
      {user.name.split(' ')[0]}
    </span>
  )
}

export default function TaskCard({ task, onClick, onDragStart, onDragEnd, dragging }) {
  const dept = byId(DEPARTMENTS, task.dept)
  const prio = byId(PRIORITIES, task.priority)
  const dl = deadlineState(task.due, task.dueTime)
  const isBurning = dl === 'overdue' && task.status !== 'done'
  const author = task.createdBy ? personById(task.createdBy) : null

  return (
    <div
      className={`card ${dragging ? 'dragging' : ''} ${isBurning ? 'burning' : ''}`}
      style={{ borderLeftColor: isBurning ? 'var(--danger)' : prio?.color }}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <div className="card-top">
        <span className="chip" style={{ background: (dept?.color || '#888') + '1a', color: dept?.color }}>
          {dept?.icon} {dept?.name}
        </span>
        {isBurning && <span className="chip chip-burning">🔥 Просрочена</span>}
        <span className="priority-flag" style={{ background: prio?.color, marginLeft: 'auto' }} title={`Приоритет: ${prio?.name}`} />
      </div>

      <p className="card-title">{task.title}</p>
      {task.measure && (
        <p className="card-measure" title={`Измеримый результат: ${task.measure}`}>
          🎯 {task.measure}
        </p>
      )}
      {task.description && <p className="card-desc">{task.description}</p>}
      {task.status === 'done' && task.result && (
        <p className="card-result" title={`Результат: ${task.result}`}>🏁 {task.result}</p>
      )}

      {task.tags?.length > 0 && (
        <div className="card-tags">
          {task.tags.map((t) => (
            <span className="tag" key={t}>#{t}</span>
          ))}
        </div>
      )}

      <div className="card-foot">
        <AvatarStack userIds={task.assignees} />
        {author && (
          <span className="task-author" title={`Поставил(а) задачу: ${author.name}`}>
            ✍ {author.name.split(' ')[0]}
          </span>
        )}
        {task.attachments?.length > 0 && (
          <span className="attach-count" title={`Вложений: ${task.attachments.length}`}>
            📎 {task.attachments.length}
          </span>
        )}
        {task.due && (
          <span className={`due ${dl}`}>
            {dl === 'overdue' ? '⚠' : '📅'} {formatDate(task.due, task.dueTime)}
          </span>
        )}
      </div>
    </div>
  )
}
