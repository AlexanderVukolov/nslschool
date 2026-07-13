import { useEffect, useMemo, useState } from 'react'
import { DEPARTMENTS, STATUSES, PRIORITIES } from '../data.js'
import { getAllPeople } from '../auth.js'

const blank = {
  title: '',
  description: '',
  measure: '',
  relevance: '',
  dept: DEPARTMENTS[0].id,
  assignee: '',
  status: 'todo',
  priority: 'medium',
  due: '',
  tags: [],
}

// Проверка задачи по критериям SMART
export function smartCheck(form) {
  return {
    S: form.title.trim().length >= 5,
    M: form.measure.trim().length >= 3,
    A: Boolean(form.assignee),
    R: form.relevance.trim().length >= 3,
    T: Boolean(form.due),
  }
}

const SMART_META = [
  { key: 'S', label: 'Specific', ru: 'Конкретность', hint: 'Понятное название задачи (от 5 символов)' },
  { key: 'M', label: 'Measurable', ru: 'Измеримость', hint: 'Заполнен измеримый результат' },
  { key: 'A', label: 'Achievable', ru: 'Достижимость', hint: 'Назначен ответственный' },
  { key: 'R', label: 'Relevant', ru: 'Значимость', hint: 'Указано, какой цели служит задача' },
  { key: 'T', label: 'Time-bound', ru: 'Срок', hint: 'Установлен срок выполнения' },
]

// Форма создания и редактирования задачи по технологии SMART
export default function TaskModal({ task, onClose, onSave, onDelete }) {
  const isEdit = Boolean(task?.id)
  const [form, setForm] = useState(blank)
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (task) setForm({ ...blank, ...task, assignee: task.assignee || '' })
    else setForm(blank)
    setError('')
  }, [task])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const smart = useMemo(() => smartCheck(form), [form])
  const smartDone = Object.values(smart).filter(Boolean).length

  // Люди (аккаунты + сотрудники): сначала из выбранного отдела, затем остальные
  const sortedEmployees = getAllPeople().sort((a, b) => {
    if (a.dept === form.dept && b.dept !== form.dept) return -1
    if (b.dept === form.dept && a.dept !== form.dept) return 1
    return 0
  })

  const addTag = () => {
    const v = tagInput.trim().replace(/^#/, '')
    if (v && !form.tags.includes(v)) set('tags', [...form.tags, v])
    setTagInput('')
  }

  const submit = (e) => {
    e.preventDefault()
    const missing = SMART_META.filter((m) => !smart[m.key])
    if (missing.length > 0) {
      setError(
        'Задача не соответствует SMART. Заполните: ' +
          missing.map((m) => `${m.key} — ${m.ru.toLowerCase()}`).join(', '),
      )
      return
    }
    onSave({ ...form, assignee: form.assignee || null })
    onClose()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <h2>{isEdit ? 'Редактировать задачу' : 'Новая задача по SMART'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        <div className="modal-body">
          {/* SMART-индикатор */}
          <div className="smart-meter">
            {SMART_META.map((m) => (
              <div
                key={m.key}
                className={`smart-chip ${smart[m.key] ? 'ok' : ''}`}
                title={`${m.label} · ${m.ru}: ${m.hint}`}
              >
                <span className="smart-letter">{smart[m.key] ? '✓' : m.key}</span>
                {m.ru}
              </div>
            ))}
            <span className="smart-score">{smartDone}/5</span>
          </div>

          <div className="field">
            <label>
              Название <span className="smart-mark">S — конкретность</span>
            </label>
            <input
              autoFocus
              placeholder="Что именно нужно сделать? Например: «Согласовать 5 интеграций с блогерами»"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          <div className="field">
            <label>
              Измеримый результат <span className="smart-mark">M — измеримость</span>
            </label>
            <input
              placeholder="Как поймём, что задача выполнена? Цифры, критерии: «5 договоров подписано»"
              value={form.measure}
              onChange={(e) => set('measure', e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>
                Ответственный <span className="smart-mark">A — достижимость</span>
              </label>
              <select value={form.assignee || ''} onChange={(e) => set('assignee', e.target.value)}>
                <option value="">Не назначен</option>
                {sortedEmployees.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Отдел</label>
              <select value={form.dept} onChange={(e) => set('dept', e.target.value)}>
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>
              Цель задачи <span className="smart-mark">R — значимость</span>
            </label>
            <input
              placeholder="Зачем это компании? Например: «Рост продаж осеннего потока»"
              value={form.relevance}
              onChange={(e) => set('relevance', e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>
                Срок выполнения <span className="smart-mark">T — время</span>
              </label>
              <input type="date" value={form.due || ''} onChange={(e) => set('due', e.target.value)} />
            </div>
            <div className="field">
              <label>Приоритет</label>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Описание (по желанию)</label>
            <textarea
              placeholder="Детали, шаги, ссылки…"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Статус</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Теги</label>
              <input
                placeholder="Тег + Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
            </div>
          </div>
          {form.tags.length > 0 && (
            <div className="card-tags">
              {form.tags.map((t) => (
                <span
                  className="tag"
                  key={t}
                  style={{ cursor: 'pointer' }}
                  onClick={() => set('tags', form.tags.filter((x) => x !== t))}
                  title="Удалить тег"
                >
                  #{t} ×
                </span>
              ))}
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}
        </div>

        <div className="modal-foot">
          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Сохранить' : 'Поставить задачу'}
          </button>
          <button type="button" className="btn" onClick={onClose}>Отмена</button>
          {isEdit && (
            <button
              type="button"
              className="btn btn-danger"
              style={{ marginLeft: 'auto' }}
              onClick={() => {
                onDelete(task.id)
                onClose()
              }}
            >
              🗑 Удалить
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
