import { useEffect, useState } from 'react'
import { DEPARTMENTS, byId } from '../data.js'
import { isRemoteMode } from '../config.js'
import { loadLocalAccounts, updateLocalProfile } from '../auth.js'
import { fetchProfiles, updateProfileRemote, fetchPushStats } from '../remote.js'
import { PersonCircle } from './TaskCard.jsx'

// Панель администратора: все сотрудники, перемещение по отделам,
// смена должности и имени
export default function AdminPanel({ onClose, onChanged }) {
  const remote = isRemoteMode()
  const [people, setPeople] = useState(null) // null = загрузка
  const [pushStats, setPushStats] = useState(null) // {userId: количество устройств}
  const [error, setError] = useState('')

  const load = () => {
    if (remote) {
      fetchProfiles()
        .then(setPeople)
        .catch((e) => setError('Не удалось загрузить сотрудников: ' + e.message))
      fetchPushStats()
        .then(setPushStats)
        .catch(() => setPushStats(null)) // нет политики push-admin.sql — просто не показываем
    } else {
      setPeople(loadLocalAccounts())
    }
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (person, patch) => {
    if (remote) await updateProfileRemote(person.id, patch)
    else updateLocalProfile(person.id, patch)
    load()
    onChanged?.()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal admin-modal">
        <div className="modal-head">
          <h2>🛡️ Управление командой</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        <div className="modal-body">
          {error && <div className="auth-error">{error}</div>}
          {!people ? (
            <p className="push-note">Загрузка…</p>
          ) : people.length === 0 ? (
            <p className="push-note">
              Пока нет зарегистрированных сотрудников. Они появятся здесь после регистрации.
            </p>
          ) : (
            <div className="admin-list">
              {people.map((p) => (
                <EmployeeRow key={p.id} person={p} pushStats={pushStats} onSave={save} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmployeeRow({ person, pushStats, onSave }) {
  const [form, setForm] = useState({
    name: person.name || '',
    dept: person.dept || '',
    role: person.role || '',
  })
  const [state, setState] = useState('idle') // idle|dirty|saving|saved|error
  const [errMsg, setErrMsg] = useState('')

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setState('dirty')
  }

  const save = async () => {
    setState('saving')
    setErrMsg('')
    try {
      await onSave(person, form)
      setState('saved')
      setTimeout(() => setState('idle'), 1500)
    } catch (e) {
      setState('error')
      setErrMsg(e.message || 'Ошибка сохранения')
    }
  }

  const dept = byId(DEPARTMENTS, form.dept)

  return (
    <div className="admin-row">
      <PersonCircle person={{ ...person, name: form.name }} className="circle admin-ava" />
      <div className="admin-fields">
        <div className="admin-line">
          <input
            className="admin-name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Имя и фамилия"
          />
          <span className="admin-email" title={person.email}>{person.email}</span>
          {person.is_admin && <span className="chip admin-chip">админ</span>}
          {pushStats &&
            (pushStats[person.id] ? (
              <span className="chip push-on-chip" title={`Push включён на ${pushStats[person.id]} устр.`}>
                🔔 {pushStats[person.id]}
              </span>
            ) : (
              <span className="chip push-off-chip" title="Сотрудник не включил push-уведомления на своём устройстве">
                🔕 без пушей
              </span>
            ))}
        </div>
        <div className="admin-line">
          <select value={form.dept || ''} onChange={(e) => set('dept', e.target.value)}>
            <option value="">Без отдела</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
            ))}
          </select>
          <input
            value={form.role}
            onChange={(e) => set('role', e.target.value)}
            placeholder="Должность"
          />
          <button
            className={`btn btn-sm ${state === 'dirty' ? 'btn-primary' : ''}`}
            disabled={state !== 'dirty'}
            onClick={save}
          >
            {state === 'saving' ? '…' : state === 'saved' ? '✓ Сохранено' : 'Сохранить'}
          </button>
        </div>
        {errMsg && <div className="attach-error">{errMsg}</div>}
      </div>
    </div>
  )
}
