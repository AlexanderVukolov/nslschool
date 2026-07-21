import { useState } from 'react'
import { STATUSES } from '../data.js'
import { deadlineState } from '../useStore.js'
import TaskCard from './TaskCard.jsx'

// Kanban-доска с drag & drop между колонками-статусами.
// Первая колонка «Просрочено» — виртуальная: в неё автоматически
// собираются горящие задачи (в неё нельзя перетащить, из неё — можно).
export default function Board({ tasks, onOpenTask, onMove }) {
  const [dragId, setDragId] = useState(null)
  const [overCol, setOverCol] = useState(null)

  const isOverdue = (t) => t.status !== 'done' && deadlineState(t.due, t.dueTime) === 'overdue'
  const overdueTasks = tasks.filter(isOverdue)

  const handleDrop = (statusId) => {
    if (dragId) onMove(dragId, statusId)
    setDragId(null)
    setOverCol(null)
  }

  const renderCard = (task) => (
    <TaskCard
      key={task.id}
      task={task}
      dragging={dragId === task.id}
      onClick={() => onOpenTask(task)}
      onDragStart={() => setDragId(task.id)}
      onDragEnd={() => {
        setDragId(null)
        setOverCol(null)
      }}
    />
  )

  return (
    <div className="board">
      {/* Просроченные — всегда на виду, первой колонкой */}
      {overdueTasks.length > 0 && (
        <div className="column column-overdue">
          <div className="column-head">
            <span className="bar" style={{ background: 'var(--danger)' }} />
            <span className="name">🔥 Просрочено</span>
            <span className="num num-danger">{overdueTasks.length}</span>
          </div>
          <div className="column-body">{overdueTasks.map(renderCard)}</div>
        </div>
      )}

      {STATUSES.map((st) => {
        const items = tasks.filter((t) => t.status === st.id && !isOverdue(t))
        return (
          <div
            key={st.id}
            className={`column ${overCol === st.id ? 'drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setOverCol(st.id)
            }}
            onDragLeave={(e) => {
              if (e.currentTarget === e.target) setOverCol(null)
            }}
            onDrop={() => handleDrop(st.id)}
          >
            <div className="column-head">
              <span className="bar" style={{ background: st.color }} />
              <span className="name">{st.name}</span>
              <span className="num">{items.length}</span>
            </div>
            <div className="column-body">
              {items.length === 0 && <div className="column-empty">Перетащите задачу сюда</div>}
              {items.map(renderCard)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
