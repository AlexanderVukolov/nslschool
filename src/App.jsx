import { useState } from 'react'
import { DEPARTMENTS, PRIORITIES, byId } from './data.js'
import { useStore, useFilteredTasks } from './useStore.js'
import { getCurrentUser, getAllPeople, clearSession } from './auth.js'
import Sidebar from './components/Sidebar.jsx'
import Board from './components/Board.jsx'
import TaskList from './components/TaskList.jsx'
import Dashboard from './components/Dashboard.jsx'
import TaskModal from './components/TaskModal.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import { avatarColor, initials } from './components/TaskCard.jsx'

const DEFAULT_FILTERS = {
  query: '',
  dept: 'all',
  assignee: 'all',
  priority: 'all',
  onlyOverdue: false,
  sort: 'default',
}

export default function App() {
  const store = useStore()
  const [user, setUser] = useState(getCurrentUser)
  const [view, setView] = useState('board') // 'board' | 'list' | 'dashboard'
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [modal, setModal] = useState(null) // null | 'new' | task object
  const [menuOpen, setMenuOpen] = useState(false)

  const filtered = useFilteredTasks(store.tasks, filters)
  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  if (!user) return <AuthScreen onAuth={setUser} />

  const people = getAllPeople()
  const userDept = user.dept ? byId(DEPARTMENTS, user.dept) : null

  const logout = () => {
    clearSession()
    setUser(null)
    setMenuOpen(false)
  }

  const showMyTasks = () => {
    setView('board')
    setFilters({ ...DEFAULT_FILTERS, assignee: user.id })
  }

  const openNew = () => setModal('new')
  const openTask = (task) => setModal(task)
  const closeModal = () => setModal(null)

  const handleSave = (data) => {
    if (modal && modal !== 'new' && modal.id) store.updateTask(modal.id, data)
    else store.addTask(data)
  }

  const activeDept = filters.dept !== 'all' ? byId(DEPARTMENTS, filters.dept) : null
  const isDashboard = view === 'dashboard'
  const isMyTasks = !isDashboard && filters.assignee === user.id

  return (
    <div className="app">
      <Sidebar
        tasks={store.tasks}
        view={view}
        filters={filters}
        user={user}
        onView={setView}
        onSelectDept={(d) => setFilter('dept', d)}
        onMyTasks={showMyTasks}
      />

      <div className="main">
        <header className="topbar">
          <div>
            <h1 className="page-title">
              {isDashboard
                ? 'Обзор'
                : isMyTasks
                ? '⭐ Мои задачи'
                : activeDept
                ? `${activeDept.icon} ${activeDept.name}`
                : 'Все задачи'}
            </h1>
            <p className="page-sub">
              {isDashboard
                ? 'Сводка по задачам компании'
                : `${filtered.length} ${plural(filtered.length, 'задача', 'задачи', 'задач')}`}
            </p>
          </div>

          {!isDashboard && (
            <div className="search">
              <input
                placeholder="Поиск по названию, описанию, тегам…"
                value={filters.query}
                onChange={(e) => setFilter('query', e.target.value)}
              />
            </div>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={openNew}>+ Новая задача</button>

            <div className="user-menu">
              <button
                className="user-chip"
                onClick={() => setMenuOpen((v) => !v)}
                title={user.email}
              >
                <span className="circle" style={{ background: avatarColor(user.id) }}>
                  {initials(user.name)}
                </span>
                <span className="user-chip-name">{user.name.split(' ')[0]}</span>
                <span className="caret">▾</span>
              </button>
              {menuOpen && (
                <>
                  <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
                  <div className="dropdown">
                    <div className="dropdown-profile">
                      <div className="dropdown-name">{user.name}</div>
                      <div className="dropdown-sub">{user.email}</div>
                      <div className="dropdown-sub">
                        {userDept ? `${userDept.icon} ${userDept.name}` : 'Без отдела'} · {user.role}
                      </div>
                    </div>
                    <button className="dropdown-item" onClick={() => { showMyTasks(); setMenuOpen(false) }}>
                      ⭐ Мои задачи
                    </button>
                    <button className="dropdown-item danger" onClick={logout}>
                      ↩ Выйти из кабинета
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {!isDashboard && (
          <div className="toolbar">
            <select value={filters.assignee} onChange={(e) => setFilter('assignee', e.target.value)}>
              <option value="all">Все ответственные</option>
              {people.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}{u.id === user.id ? ' (я)' : ''}
                </option>
              ))}
            </select>
            <select value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)}>
              <option value="all">Любой приоритет</option>
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)}>
              <option value="default">Без сортировки</option>
              <option value="priority">По приоритету</option>
              <option value="due">По сроку</option>
            </select>
            <label className="check">
              <input
                type="checkbox"
                checked={filters.onlyOverdue}
                onChange={(e) => setFilter('onlyOverdue', e.target.checked)}
              />
              Только просроченные
            </label>

            <div className="spacer" />

            <div className="seg">
              <button className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}>
                Доска
              </button>
              <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
                Список
              </button>
            </div>
          </div>
        )}

        <div className="content">
          {isDashboard ? (
            <Dashboard tasks={store.tasks} />
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="big">🌱</div>
              <p>Задач не найдено. Измените фильтры или создайте новую задачу.</p>
              <button className="btn btn-primary" onClick={openNew}>+ Новая задача</button>
            </div>
          ) : view === 'board' ? (
            <Board tasks={filtered} onOpenTask={openTask} onMove={store.moveTask} />
          ) : (
            <TaskList tasks={filtered} onOpenTask={openTask} />
          )}
        </div>
      </div>

      {modal && (
        <TaskModal
          task={modal === 'new' ? null : modal}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={store.removeTask}
        />
      )}
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
