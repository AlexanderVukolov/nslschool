import { DEPARTMENTS, STATUSES, PRIORITIES, byId } from '../data.js'
import { deadlineState, formatDate } from '../useStore.js'
import { Avatar } from './TaskCard.jsx'

// Табличное представление задач
export default function TaskList({ tasks, onOpenTask }) {
  return (
    <div className="list">
      <div className="list-row list-head">
        <span>Задача</span>
        <span className="hide-sm">Отдел</span>
        <span className="hide-sm">Ответственный</span>
        <span className="hide-sm">Статус</span>
        <span>Срок</span>
        <span></span>
      </div>
      {tasks.map((t) => {
        const dept = byId(DEPARTMENTS, t.dept)
        const st = byId(STATUSES, t.status)
        const prio = byId(PRIORITIES, t.priority)
        const dl = deadlineState(t.due)
        const isBurning = dl === 'overdue' && t.status !== 'done'
        return (
          <div className={`list-row ${isBurning ? 'burning-row' : ''}`} key={t.id} onClick={() => onOpenTask(t)}>
            <div className="list-title">
              <span className="priority-flag" style={{ background: prio?.color, marginRight: 7 }} />
              {t.title}
              {t.description && <small>{t.description}</small>}
            </div>
            <span className="hide-sm">
              <span className="chip" style={{ background: (dept?.color || '#888') + '1a', color: dept?.color }}>
                {dept?.icon} {dept?.name}
              </span>
            </span>
            <span className="hide-sm">
              <Avatar userId={t.assignee} />
            </span>
            <span className="hide-sm">
              <span className="chip" style={{ background: (st?.color || '#888') + '1a', color: st?.color }}>
                {st?.name}
              </span>
            </span>
            <span className={`due ${dl}`}>{t.due ? formatDate(t.due) : '—'}</span>
            <span style={{ textAlign: 'right', color: 'var(--muted-2)' }}>›</span>
          </div>
        )
      })}
    </div>
  )
}
