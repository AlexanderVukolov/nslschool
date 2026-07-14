import { useState } from 'react'
import { DEPARTMENTS } from '../data.js'
import { loginUser, registerUser } from '../auth.js'
import { isRemoteMode } from '../config.js'
import { remoteSignIn, remoteSignUp, resendConfirmation } from '../remote.js'

// Экран входа и регистрации личного кабинета
export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    dept: DEPARTMENTS[0].id,
    role: '',
  })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [loginFails, setLoginFails] = useState(0)

  const resend = async () => {
    setError('')
    setInfo('')
    if (!form.email.trim()) {
      setError('Введите email, на который регистрировались, и нажмите ещё раз')
      return
    }
    try {
      await resendConfirmation(form.email)
      setInfo(`Письмо с подтверждением отправлено повторно на ${form.email.trim()}. Проверьте почту и папку «Спам».`)
      setLoginFails(0)
    } catch (err) {
      setError(err.message)
    }
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const switchMode = (m) => {
    setMode(m)
    setError('')
    setInfo('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (isRemoteMode()) {
        if (mode === 'login') {
          try {
            onAuth(await remoteSignIn(form.email, form.password))
            setLoginFails(0)
          } catch (err) {
            setLoginFails((n) => n + 1)
            throw err
          }
        } else {
          if (!form.name.trim()) throw new Error('Укажите имя и фамилию')
          const res = await remoteSignUp(form)
          if (res.needsConfirm) {
            setMode('login')
            setInfo(
              `Мы отправили письмо на ${form.email.trim()}. ` +
                'Перейдите по ссылке из письма, чтобы подтвердить адрес, и войдите.',
            )
          } else {
            onAuth(res.user)
          }
        }
      } else {
        const user =
          mode === 'login'
            ? await loginUser(form.email, form.password)
            : await registerUser(form)
        onAuth(user)
      }
    } catch (err) {
      setError(err.message || 'Что-то пошло не так, попробуйте ещё раз')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand auth-brand-logo">
          <img className="auth-logo" src="./logo-full.png" alt="NSL — Лига нутрициологии" />
          <div className="brand-sub">Задачник · Лига нутрициологии</div>
        </div>

        <div className="seg auth-tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>
            Вход
          </button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>
            Регистрация
          </button>
        </div>

        {mode === 'register' && (
          <>
            <div className="field">
              <label>Имя и фамилия</label>
              <input
                placeholder="Например: Ирина Смирнова"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Отдел</label>
                <select value={form.dept} onChange={(e) => set('dept', e.target.value)}>
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
            </div>
          </>
        )}

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            placeholder="name@nsl.ru"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            autoComplete="email"
            autoFocus
          />
        </div>

        <div className="field">
          <label>Пароль</label>
          <input
            type="password"
            placeholder={mode === 'register' ? 'Минимум 6 символов' : 'Ваш пароль'}
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />
        </div>

        {error && <div className="auth-error">{error}</div>}
        {info && <div className="auth-info">{info}</div>}

        {isRemoteMode() && mode === 'login' && loginFails > 0 && (
          <div className="auth-info">
            Вход не проходит? Чаще всего email ещё не подтверждён — проверьте почту и папку
            «Спам».{' '}
            <button type="button" className="link" onClick={resend}>
              Отправить письмо ещё раз
            </button>
          </div>
        )}

        <button className="btn btn-primary auth-submit" disabled={busy}>
          {busy ? 'Секунду…' : mode === 'login' ? 'Войти в кабинет' : 'Создать кабинет'}
        </button>

        <p className="auth-hint">
          {mode === 'login' ? (
            <>Нет аккаунта?{' '}
              <button type="button" className="link" onClick={() => switchMode('register')}>
                Зарегистрируйтесь по email
              </button>
            </>
          ) : (
            <>Уже есть кабинет?{' '}
              <button type="button" className="link" onClick={() => switchMode('login')}>
                Войдите
              </button>
            </>
          )}
        </p>

        <p className="auth-note">
          {isRemoteMode()
            ? 'Общая база команды: вход по email с подтверждением.'
            : 'Демо-режим: аккаунты и задачи хранятся в этом браузере.'}
        </p>
      </form>
    </div>
  )
}
