import { DEPARTMENTS, byId } from '../data.js'
import { isRemoteMode, isAdminUser } from '../config.js'

// Навигация: обзор, мои задачи, все задачи и фильтр по отделам
export default function Sidebar({ tasks, view, filters, user, open, onView, onSelectDept, onMyTasks }) {
  const countByDept = (id) => tasks.filter((t) => t.dept === id).length
  const myCount = user ? tasks.filter((t) => (t.assignees || []).includes(user.id)).length : 0
  const isMyTasks = !['dashboard', 'admin'].includes(view) && filters.assignee === user?.id

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <img className="brand-logo-img" src="./logo-mark.png" alt="NSL" />
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
          📊 Обзор
        </button>
        {isAdminUser(user) && (
          <button
            className={`nav-item ${view === 'admin' ? 'active' : ''}`}
            onClick={() => onView('admin')}
          >
            📈 Отчёт команды
          </button>
        )}
        <button className={`nav-item ${isMyTasks ? 'active' : ''}`} onClick={onMyTasks}>
          ⭐ Мои задачи
          <span className="count">{myCount}</span>
        </button>
        <button
          className={`nav-item ${!['dashboard', 'admin'].includes(view) && !isMyTasks && filters.dept === 'all' ? 'active' : ''}`}
          onClick={() => {
            onView('board')
            onSelectDept('all')
          }}
        >
          🗂 Все задачи
          <span className="count">{tasks.length}</span>
        </button>

        <div className="nav-section">Отделы</div>
        {DEPARTMENTS.map((d) => (
          <button
            key={d.id}
            className={`nav-item ${!['dashboard', 'admin'].includes(view) && filters.dept === d.id ? 'active' : ''}`}
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
        {isRemoteMode()
          ? 'Общая база команды: изменения видят все.'
          : 'Данные хранятся локально в браузере.'}
      </div>
    </aside>
  )
}
