import { useEffect, useState } from 'react'
import { DEPARTMENTS } from '../data.js'
import { isRemoteMode } from '../config.js'
import { pushStatus, enablePush, disablePush } from '../push.js'

// Настройки кабинета: имя, отдел, должность
export default function SettingsModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    name: user.name || '',
    dept: user.dept || DEPARTMENTS[0].id,
    role: user.role || '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [push, setPush] = useState('loading') // loading|on|off|denied|unsupported
  const [pushMsg, setPushMsg] = useState('')

  useEffect(() => {
    if (isRemoteMode()) pushStatus().then(setPush)
    else setPush('unsupported')
  }, [])

  const togglePush = async () => {
    setPushMsg('')
    try {
      if (push === 'on') {
        await disablePush()
        setPush('off')
        setPushMsg('Push-уведомления на этом устройстве выключены')
      } else {
        await enablePush(user.id)
        setPush('on')
        setPushMsg('Готово! Уведомления будут приходить на это устройство')
      }
    } catch (err) {
      setPushMsg(err.message)
      pushStatus().then(setPush)
    }
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Имя не может быть пустым')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err.message || 'Не удалось сохранить настройки')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal modal-narrow" onSubmit={submit}>
        <div className="modal-head">
          <h2>⚙️ Настройки кабинета</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>Имя и фамилия</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label>Отдел</label>
            <select value={form.dept || ''} onChange={(e) => set('dept', e.target.value)}>
              {DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Должность</label>
            <input
              placeholder="Например: Куратор"
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input value={user.email} disabled title="Email изменить нельзя — он привязан к аккаунту" />
          </div>

          {isRemoteMode() && (
            <div className="field">
              <label>Push-уведомления на этом устройстве</label>
              {push === 'unsupported' ? (
                <p className="push-note">
                  Браузер не поддерживает push. На iPhone установите задачник на главный экран
                  («Поделиться» → «На экран Домой») и откройте настройки из него.
                </p>
              ) : push === 'denied' ? (
                <p className="push-note">
                  Уведомления запрещены в браузере. Разрешите их в настройках сайта и вернитесь сюда.
                </p>
              ) : (
                <button
                  type="button"
                  className={`btn ${push === 'on' ? '' : 'btn-primary'}`}
                  disabled={push === 'loading'}
                  onClick={togglePush}
                >
                  {push === 'loading'
                    ? 'Проверяю…'
                    : push === 'on'
                    ? '🔕 Выключить уведомления'
                    : '🔔 Включить уведомления'}
                </button>
              )}
              {pushMsg && <p className="push-note">{pushMsg}</p>}
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}
        </div>

        <div className="modal-foot">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Сохраняю…' : 'Сохранить'}
          </button>
          <button type="button" className="btn" onClick={onClose}>Отмена</button>
        </div>
      </form>
    </div>
  )
}
