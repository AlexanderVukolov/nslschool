import { useEffect, useState } from 'react'
import { DEPARTMENTS, PRIORITIES, byId } from './data.js'
import { useStore, useFilteredTasks, deadlineState } from './useStore.js'
import { getCurrentUser, getAllPeople, clearSession, setPeopleCache, updateLocalProfile } from './auth.js'
import { isRemoteMode, isAdminUser } from './config.js'
import { useRemoteStore } from './useRemoteStore.js'
import {
  remoteGetUser,
  remoteSignOut,
  updateProfileRemote,
  fetchProfiles,
  fetchNotifications,
  insertNotification,
  markAllReadRemote,
  clearNotifsRemote,
  subscribeNotifications,
} from './remote.js'
import Sidebar from './components/Sidebar.jsx'
import Board from './components/Board.jsx'
import TaskList from './components/TaskList.jsx'
import Dashboard from './components/Dashboard.jsx'
import TaskModal from './components/TaskModal.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import OverdueAlert from './components/OverdueAlert.jsx'
import NotificationBell from './components/NotificationBell.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import { pushSupported, enablePush } from './push.js'
import AdminPanel from './components/AdminPanel.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import CompleteModal from './components/CompleteModal.jsx'
import { loadNotifications, pushNotification, markAllRead, clearForUser } from './notifications.js'
import { PersonCircle } from './components/TaskCard.jsx'

const DEFAULT_FILTERS = {
  query: '',
  dept: 'all',
  assignee: 'all',
  priority: 'all',
  onlyOverdue: false,
  sort: 'default',
}

const REMOTE = isRemoteMode()

// Настройки интерфейса пользователя (вид, сортировка) — свои у каждого
const uiKey = (userId) => `nsl-ui-v1:${userId}`

function loadUiPrefs(userId) {
  try {
    return JSON.parse(localStorage.getItem(uiKey(userId)) || '{}')
  } catch {
    return {}
  }
}

export default function App() {
  const localStore = useStore()
  const [user, setUser] = useState(REMOTE ? null : getCurrentUser)
  const [authLoading, setAuthLoading] = useState(REMOTE)
  const remoteStore = useRemoteStore(REMOTE, user)
  const store = REMOTE ? remoteStore : localStore
  const [view, setView] = useState('board') // 'board' | 'list' | 'dashboard'
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [modal, setModal] = useState(null) // null | 'new' | task object
  const [completing, setCompleting] = useState(null) // задача, ожидающая результата для «Готово»
  const [menuOpen, setMenuOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false) // мобильное меню-шторка
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [pushPrompt, setPushPrompt] = useState(false)

  // Push по умолчанию: если разрешение уже дано — тихо восстанавливаем
  // подписку; если ещё не спрашивали — предлагаем включить баннером
  useEffect(() => {
    if (!REMOTE || !user || !pushSupported()) return
    if (Notification.permission === 'granted') {
      enablePush(user.id).catch((e) => console.warn('Автоподписка push:', e))
    } else if (
      Notification.permission === 'default' &&
      !sessionStorage.getItem('nsl-push-prompt-dismissed')
    ) {
      setPushPrompt(true)
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const enablePushNow = () => {
    enablePush(user.id)
      .then(() => setPushPrompt(false))
      .catch((e) => {
        console.warn('Не удалось включить push:', e)
        setPushPrompt(false)
      })
  }

  const dismissPushPrompt = () => {
    sessionStorage.setItem('nsl-push-prompt-dismissed', '1')
    setPushPrompt(false)
  }
  const [notifications, setNotifications] = useState(REMOTE ? [] : loadNotifications)

  // Восстановление сохранённых настроек интерфейса при входе
  useEffect(() => {
    if (!user) return
    const p = loadUiPrefs(user.id)
    if (['board', 'list', 'dashboard', 'admin'].includes(p.view)) setView(p.view)
    if (['default', 'priority', 'due'].includes(p.sort)) {
      setFilters((f) => ({ ...f, sort: p.sort }))
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Сохранение настроек при изменении
  useEffect(() => {
    if (!user) return
    try {
      localStorage.setItem(uiKey(user.id), JSON.stringify({ view, sort: filters.sort }))
    } catch (e) {
      console.warn('Не удалось сохранить настройки интерфейса:', e)
    }
  }, [view, filters.sort, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Значок-цифра на иконке приложения = число непрочитанных уведомлений
  useEffect(() => {
    if (!user || !('setAppBadge' in navigator)) return
    const unread = notifications.filter((n) => n.userId === user.id && !n.read).length
    if (unread > 0) navigator.setAppBadge(unread).catch(() => {})
    else navigator.clearAppBadge?.().catch(() => {})
  }, [notifications, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const [, setPeopleVersion] = useState(0) // тик после загрузки profiles, чтобы обновить аватары

  // Удалённый режим: восстановление сессии при открытии
  useEffect(() => {
    if (!REMOTE) return
    remoteGetUser()
      .then((u) => setUser(u))
      .finally(() => setAuthLoading(false))
  }, [])

  // Удалённый режим: команда (profiles), мои уведомления + живая доставка
  useEffect(() => {
    if (!REMOTE || !user) return
    fetchProfiles()
      .then((list) => {
        setPeopleCache(list)
        setPeopleVersion((v) => v + 1)
      })
      .catch((e) => console.warn('Не удалось загрузить сотрудников:', e))
    fetchNotifications()
      .then(setNotifications)
      .catch((e) => console.warn('Не удалось загрузить уведомления:', e))
    const channel = subscribeNotifications(user.id, (n) =>
      setNotifications((list) => [n, ...list]),
    )
    return () => channel?.unsubscribe()
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useFilteredTasks(store.tasks, filters)
  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>🌿 Загрузка…</div>
      </div>
    )
  }
  if (!user) return <AuthScreen onAuth={setUser} />

  const people = getAllPeople()
  const userDept = user.dept ? byId(DEPARTMENTS, user.dept) : null
  const admin = isAdminUser(user)

  // Обновить кэш людей после правок в панели управления
  const refreshPeople = () => {
    if (REMOTE) {
      fetchProfiles()
        .then((list) => {
          setPeopleCache(list)
          setPeopleVersion((v) => v + 1)
        })
        .catch(() => {})
    } else {
      setPeopleVersion((v) => v + 1)
    }
  }

  const logout = () => {
    if (REMOTE) remoteSignOut()
    else clearSession()
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

  // Роль текущего пользователя в задаче:
  // owner — автор/админ/старые задачи; worker — исполнитель; viewer — остальные
  const taskRole = (task) => {
    if (!task || task === 'new' || !task.id) return 'owner'
    if (admin || !task.createdBy || task.createdBy === user.id) return 'owner'
    if ((task.assignees || []).includes(user.id)) return 'worker'
    return 'viewer'
  }

  // Администраторы, которым дублируются все события (кроме их собственных)
  const otherAdminIds = () =>
    getAllPeople()
      .filter((p) => p.id !== user.id && isAdminUser(p))
      .map((p) => p.id)

  const sendNotif = (payload) => {
    if (REMOTE) {
      insertNotification(payload).catch((e) => console.warn('Уведомление не отправлено:', e))
    } else {
      setNotifications((list) => pushNotification(list, payload))
    }
  }

  // Уведомить о выполнении: ответственных, автора задачи и админов,
  // кроме того, кто сам перевёл её в «Готово»
  const notifyDone = (task) => {
    const recipients = new Set(
      [...(task?.assignees || []), task?.createdBy, ...otherAdminIds()].filter(Boolean),
    )
    recipients.delete(user.id)
    for (const userId of recipients) {
      sendNotif({ userId, taskId: task.id, taskTitle: task.title, byName: user.name })
    }
  }

  const handleMarkAllRead = () => {
    setNotifications((list) =>
      REMOTE ? list.map((n) => (n.userId === user.id ? { ...n, read: true } : n)) : markAllRead(list, user.id),
    )
    if (REMOTE) markAllReadRemote(user.id)
  }

  // Сохранение настроек кабинета (имя, отдел, должность)
  const handleSaveSettings = async (patch) => {
    if (REMOTE) {
      const updated = await updateProfileRemote(user.id, patch)
      setUser(updated)
      const list = await fetchProfiles().catch(() => null)
      if (list) {
        setPeopleCache(list)
        setPeopleVersion((v) => v + 1)
      }
    } else {
      setUser(updateLocalProfile(user.id, patch))
    }
  }

  const handleClearNotifs = () => {
    setNotifications((list) => (REMOTE ? list.filter((n) => n.userId !== user.id) : clearForUser(list, user.id)))
    if (REMOTE) clearNotifsRemote(user.id)
  }

  // Уведомить о постановке: назначенным — «вам поставлена задача»,
  // админам — «новая задача» (кроме самого автора)
  const notifyAssigned = (task, userIds) => {
    const assignees = new Set((userIds || []).filter((id) => id && id !== user.id))
    for (const userId of assignees) {
      sendNotif({
        userId,
        taskId: task.id || null,
        taskTitle: task.title,
        byName: user.name,
        type: 'task_assigned',
      })
    }
    for (const adminId of otherAdminIds()) {
      if (assignees.has(adminId)) continue
      sendNotif({
        userId: adminId,
        taskId: task.id || null,
        taskTitle: task.title,
        byName: user.name,
        type: 'task_new',
      })
    }
  }

  const handleSave = (data) => {
    if (modal && modal !== 'new' && modal.id) {
      const role = taskRole(modal)
      if (role === 'viewer') return
      // Исполнитель меняет только статус, результат и вложения —
      // поля постановщика берём из исходной задачи
      if (role === 'worker') {
        data = {
          ...modal,
          status: data.status,
          result: data.result,
          attachments: data.attachments,
        }
      }
      store.updateTask(modal.id, data)
      if (data.status === 'done' && modal.status !== 'done') {
        notifyDone({ ...modal, ...data })
      }
      // Уведомляем только новых ответственных, добавленных при редактировании
      const before = modal.assignees || []
      const added = (data.assignees || []).filter((id) => !before.includes(id))
      if (added.length > 0) notifyAssigned({ ...modal, ...data }, added)
    } else {
      const created = store.addTask({ ...data, createdBy: user.id })
      Promise.resolve(created).then((t) => {
        if (t) notifyAssigned(t, t.assignees)
      })
    }
  }

  const handleMove = (id, status) => {
    const task = store.tasks.find((t) => t.id === id)
    if (!task) return
    if (taskRole(task) === 'viewer') return // двигать может автор или исполнитель
    // В «Готово» — только с описанным результатом
    if (status === 'done' && task.status !== 'done' && !(task.result || '').trim()) {
      setCompleting(task)
      return
    }
    store.moveTask(id, status)
    if (status === 'done' && task.status !== 'done') notifyDone(task)
  }

  // Подтверждение завершения с результатом (из окна «Завершение задачи»)
  const handleComplete = (result) => {
    const task = completing
    setCompleting(null)
    if (!task) return
    store.updateTask(task.id, { ...task, status: 'done', result })
    notifyDone({ ...task, status: 'done', result })
  }

  const tasksById = Object.fromEntries(store.tasks.map((t) => [t.id, t]))

  const activeDept = filters.dept !== 'all' ? byId(DEPARTMENTS, filters.dept) : null
  const isAdminDash = view === 'admin' && admin
  const isDashboard = view === 'dashboard' || isAdminDash
  const isMyTasks = !isDashboard && filters.assignee === user.id

  // Просроченные незакрытые задачи — для напоминания
  const overdueTasks = store.tasks.filter(
    (t) => t.status !== 'done' && deadlineState(t.due, t.dueTime) === 'overdue',
  )

  const showOverdue = () => {
    setView('board')
    setFilters({ ...DEFAULT_FILTERS, onlyOverdue: true })
  }

  return (
    <div className="app">
      {navOpen && <div className="nav-backdrop" onClick={() => setNavOpen(false)} />}
      <Sidebar
        tasks={store.tasks}
        view={view}
        filters={filters}
        user={user}
        open={navOpen}
        onView={(v) => {
          setView(v)
          setNavOpen(false)
        }}
        onSelectDept={(d) => {
          setFilters((f) => ({ ...f, dept: d, assignee: 'all' }))
        }}
        onSelectPerson={(id) => {
          setFilter('assignee', id)
          setNavOpen(false)
        }}
        onMyTasks={() => {
          showMyTasks()
          setNavOpen(false)
        }}
      />

      <div className="main">
        <header className="topbar">
          <button className="burger" onClick={() => setNavOpen(true)} aria-label="Меню">☰</button>
          <div>
            <h1 className="page-title">
              {isAdminDash
                ? '📈 Отчёт команды'
                : isDashboard
                ? 'Обзор'
                : isMyTasks
                ? '⭐ Мои задачи'
                : activeDept
                ? `${activeDept.icon} ${activeDept.name}`
                : 'Все задачи'}
            </h1>
            <p className="page-sub">
              {isAdminDash
                ? 'Выполнение и просрочки по сотрудникам'
                : isDashboard
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

            <NotificationBell
              notifications={notifications}
              userId={user.id}
              tasksById={tasksById}
              onOpenTask={openTask}
              onMarkAllRead={handleMarkAllRead}
              onClear={handleClearNotifs}
            />

            <div className="user-menu">
              <button
                className="user-chip"
                onClick={() => setMenuOpen((v) => !v)}
                title={user.email}
              >
                <PersonCircle person={user} />
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
                    <button className="dropdown-item" onClick={() => { setSettingsOpen(true); setMenuOpen(false) }}>
                      ⚙️ Настройки
                    </button>
                    {admin && (
                      <button className="dropdown-item" onClick={() => { setAdminOpen(true); setMenuOpen(false) }}>
                        🛡️ Управление командой
                      </button>
                    )}
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

        {pushPrompt && (
          <div className="push-banner">
            <span>🔔 Включите уведомления — узнавайте сразу, когда вам ставят задачу или её выполняют</span>
            <span className="push-banner-actions">
              <button className="btn btn-sm btn-primary" onClick={enablePushNow}>Включить</button>
              <button className="btn btn-sm" onClick={dismissPushPrompt}>Позже</button>
            </span>
          </div>
        )}

        {REMOTE && store.error && (
          <div className="db-error">
            ⚠ Не удалось загрузить данные из базы. Если это первый запуск — выполните файл{' '}
            <b>supabase/schema.sql</b> в Supabase → SQL Editor и обновите страницу.
          </div>
        )}

        <div className="content">
          {isAdminDash ? (
            <AdminDashboard tasks={store.tasks} onOpenTask={openTask} />
          ) : isDashboard ? (
            <Dashboard tasks={store.tasks} />
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="big">🌱</div>
              <p>Задач не найдено. Измените фильтры или создайте новую задачу.</p>
              <button className="btn btn-primary" onClick={openNew}>+ Новая задача</button>
            </div>
          ) : view === 'board' ? (
            <Board tasks={filtered} onOpenTask={openTask} onMove={handleMove} />
          ) : (
            <TaskList tasks={filtered} onOpenTask={openTask} />
          )}
        </div>
      </div>

      <OverdueAlert overdueTasks={overdueTasks} onShow={showOverdue} onOpenTask={openTask} />

      {settingsOpen && (
        <SettingsModal user={user} onClose={() => setSettingsOpen(false)} onSave={handleSaveSettings} />
      )}

      {adminOpen && admin && <AdminPanel onClose={() => setAdminOpen(false)} onChanged={refreshPeople} />}

      {completing && (
        <CompleteModal
          task={completing}
          onCancel={() => setCompleting(null)}
          onComplete={handleComplete}
        />
      )}

      {modal && (
        <TaskModal
          task={modal === 'new' ? null : modal}
          role={taskRole(modal)}
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
