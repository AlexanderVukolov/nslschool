import { DEPARTMENTS, byId } from '../data.js'
import { deadlineState, formatDate } from '../useStore.js'
import { getAllPeople } from '../auth.js'
import { timeAgo } from '../notifications.js'
import { AvatarStack, avatarColor, initials } from './TaskCard.jsx'

// Дашборд администратора: выполнение по сотрудникам + просроченные задачи
export default function AdminDashboard({ tasks, onOpenTask }) {
  const people = getAllPeople()

  // Статистика по каждому сотруднику
  const stats = people
    .map((p) => {
      const mine = tasks.filter((t) => (t.assignees || []).includes(p.id))
      const done = mine.filter((t) => t.status === 'done')
      const overdue = mine.filter(
        (t) => t.status !== 'done' && deadlineState(t.due, t.dueTime) === 'overdue',
      )
      return { person: p, total: mine.length, done: done.length, overdue: overdue.length }
    })
    .filter((s) => s.total > 0)
    .sort((a, b) => b.done - a.done || a.overdue - b.overdue)

  const maxDone = Math.max(1, ...stats.map((s) => s.done))

  const doneTasks = tasks
    .filter((t) => t.status === 'done')
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))

  const overdueTasks = tasks
    .filter((t) => t.status !== 'done' && deadlineState(t.due, t.dueTime) === 'overdue')
    .sort((a, b) => new Date(`${a.due}T${a.dueTime || '23:59'}`) - new Date(`${b.due}T${b.dueTime || '23:59'}`))

  return (
    <div className="admin-dash">
      {/* Сводные плитки */}
      <div className="stat-row">
        <div className="stat-tile">
          <div className="stat-num">{tasks.length}</div>
          <div className="stat-label">Всего задач</div>
        </div>
        <div className="stat-tile ok">
          <div className="stat-num">{doneTasks.length}</div>
          <div className="stat-label">Выполнено</div>
        </div>
        <div className="stat-tile danger">
          <div className="stat-num">{overdueTasks.length}</div>
          <div className="stat-label">Просрочено</div>
        </div>
        <div className="stat-tile">
          <div className="stat-num">{tasks.length - doneTasks.length}</div>
          <div className="stat-label">В работе</div>
        </div>
      </div>

      <div className="panels">
        {/* Выполнение по сотрудникам */}
        <div className="panel">
          <h3>Выполнено по сотрудникам</h3>
          {stats.length === 0 ? (
            <p className="push-note">Пока нет задач с ответственными.</p>
          ) : (
            stats.map(({ person, total, done, overdue }) => (
              <div className="emp-row" key={person.id}>
                <span className="circle emp-ava" style={{ background: avatarColor(person.id) }}>
                  {initials(person.name)}
                </span>
                <div className="emp-info">
                  <div className="emp-name-line">
                    <b>{person.name}</b>
                    <span className="emp-counts">
                      ✅ {done} из {total}
                      {overdue > 0 && <span className="emp-overdue"> · 🔥 {overdue}</span>}
                    </span>
                  </div>
                  <div className="emp-bar">
                    <span className="emp-bar-fill" style={{ width: `${(done / maxDone) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Просроченные задачи */}
        <div className="panel">
          <h3>🔥 Просроченные задачи</h3>
          {overdueTasks.length === 0 ? (
            <p className="push-note">Просроченных задач нет — отличная работа! 🎉</p>
          ) : (
            <div className="dash-task-list">
              {overdueTasks.map((t) => {
                const dept = byId(DEPARTMENTS, t.dept)
                return (
                  <div className="dash-task burning-row" key={t.id} onClick={() => onOpenTask(t)}>
                    <div className="dash-task-main">
                      <span className="dash-task-title">{t.title}</span>
                      <span className="dash-task-meta">
                        {dept?.icon} {dept?.name} · до {formatDate(t.due, t.dueTime)}
                      </span>
                    </div>
                    <AvatarStack userIds={t.assignees} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Недавно выполненные */}
      <div className="panel" style={{ marginTop: 16 }}>
        <h3>✅ Недавно выполненные</h3>
        {doneTasks.length === 0 ? (
          <p className="push-note">Выполненных задач пока нет.</p>
        ) : (
          <div className="dash-task-list">
            {doneTasks.slice(0, 10).map((t) => {
              const dept = byId(DEPARTMENTS, t.dept)
              return (
                <div className="dash-task" key={t.id} onClick={() => onOpenTask(t)}>
                  <div className="dash-task-main">
                    <span className="dash-task-title">{t.title}</span>
                    <span className="dash-task-meta">
                      {dept?.icon} {dept?.name}
                      {t.updatedAt ? ` · ${timeAgo(t.updatedAt)}` : ''}
                    </span>
                  </div>
                  <AvatarStack userIds={t.assignees} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
