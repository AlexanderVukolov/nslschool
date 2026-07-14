import { DEPARTMENTS, byId } from '../data.js'
import { isRemoteMode, isAdminUser } from '../config.js'
import { getAllPeople } from '../auth.js'
import { PersonCircle } from './TaskCard.jsx'

// Навигация: обзор, мои задачи, все задачи и фильтр по отделам
export default function Sidebar({ tasks, view, filters, user, open, onView, onSelectDept, onSelectPerson, onMyTasks }) {
  const countByDept = (id) => tasks.filter((t) => t.dept === id).length
  const people = getAllPeople()
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
        {DEPARTMENTS.map((d) => {
          const isActiveDept = !['dashboard', 'admin'].includes(view) && filters.dept === d.id
          const deptPeople = people.filter((p) => p.dept === d.id)
          return (
            <div key={d.id}>
              <button
                className={`nav-item ${isActiveDept ? 'active' : ''}`}
                onClick={() => {
                  onView('board')
                  onSelectDept(d.id)
                }}
              >
                <span className="nav-dot" style={{ background: d.color }} />
                {d.name}
                <span className="count">{countByDept(d.id)}</span>
              </button>
              {/* Сотрудники выбранного отдела */}
              {isActiveDept && (
                <div className="dept-people">
                  {deptPeople.length === 0 ? (
                    <div className="dept-empty">В отделе пока нет сотрудников</div>
                  ) : (
                    deptPeople.map((p) => (
                      <button
                        key={p.id}
                        className={`dept-person ${filters.assignee === p.id ? 'active' : ''}`}
                        onClick={() => onSelectPerson(filters.assignee === p.id ? 'all' : p.id)}
                        title={`${p.name} · ${p.role || ''} — показать задачи`}
                      >
                        <PersonCircle person={p} className="circle dept-ava" />
                        <span className="dept-person-name">
                          {p.name}
                          <small>{p.role}</small>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        {isRemoteMode()
          ? 'Общая база команды: изменения видят все.'
          : 'Данные хранятся локально в браузере.'}
      </div>
    </aside>
  )
}
