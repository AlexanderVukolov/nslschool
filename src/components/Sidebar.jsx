import { DEPARTMENTS, byId } from '../data.js'

// Навигация: обзор, мои задачи, все задачи и фильтр по отделам
export default function Sidebar({ tasks, view, filters, user, onView, onSelectDept, onMyTasks }) {
  const countByDept = (id) => tasks.filter((t) => t.dept === id).length
  const activeDepts = DEPARTMENTS.filter((d) => countByDept(d.id) > 0)
  const myCount = user ? tasks.filter((t) => (t.assignees || []).includes(user.id)).length : 0
  const isMyTasks = view !== 'dashboard' && filters.assignee === user?.id

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">🌿</div>
        <div>
          <div className="brand-title">Задачник NSL</div>
          <div className="brand-sub">Лига нутрициологии</div>
        </div>
      </div>

      <nav className="nav">
        <button
          className={`nav-item ${view === 'dashboard' ? 'active' : ''}`}
          onClick={() => onView('dashboard')}
        >
          📈 Обзор
        </button>
        <button className={`nav-item ${isMyTasks ? 'active' : ''}`} onClick={onMyTasks}>
          ⭐ Мои задачи
          <span className="count">{myCount}</span>
        </button>
        <button
          className={`nav-item ${view !== 'dashboard' && !isMyTasks && filters.dept === 'all' ? 'active' : ''}`}
          onClick={() => {
            onView('board')
            onSelectDept('all')
          }}
        >
          🗂 Все задачи
          <span className="count">{tasks.length}</span>
        </button>

        <div className="nav-section">Отделы</div>
        {activeDepts.map((d) => (
          <button
            key={d.id}
            className={`nav-item ${view !== 'dashboard' && filters.dept === d.id ? 'active' : ''}`}
            onClick={() => {
              onView('board')
              onSelectDept(d.id)
            }}
          >
            <span className="nav-dot" style={{ background: d.color }} />
            {d.name}
            <span className="count">{countByDept(d.id)}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        Данные хранятся локально в браузере.
      </div>
    </aside>
  )
}
