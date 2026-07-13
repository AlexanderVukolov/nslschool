import { useEffect, useState } from 'react'
import { DEPARTMENTS, STATUSES, PRIORITIES } from '../data.js'
import { getAllPeople } from '../auth.js'

const blank = {
  title: '',
  description: '',
  dept: DEPARTMENTS[0].id,
  assignee: '',
  status: 'todo',
  priority: 'medium',
  due: '',
  tags: [],
}

// Форма создания и редактирования задачи
export default function TaskModal({ task, onClose, onSave, onDelete }) {
  const isEdit = Boolean(task?.id)
  const [form, setForm] = useState(blank)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (task) setForm({ ...blank, ...task })
    else setForm(blank)
  }, [task])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

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
    if (!form.title.trim()) return
    onSave({ ...form, assignee: form.assignee || null })
    onClose()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <h2>{isEdit ? 'Редактировать задачу' : 'Новая задача'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>Название</label>
            <input
              autoFocus
              placeholder="Что нужно сделать?"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          <div className="field">
            <label>Описание</label>
            <textarea
              placeholder="Детали, критерии готовности, ссылки…"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
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
              <label>Ответственный</label>
              <select value={form.assignee || ''} onChange={(e) => set('assignee', e.target.value)}>
                <option value="">Не назначен</option>
                {sortedEmployees.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
                ))}
              </select>
            </div>
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
              <label>Приоритет</label>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Срок выполнения</label>
            <input type="date" value={form.due || ''} onChange={(e) => set('due', e.target.value)} />
          </div>

          <div className="field">
            <label>Теги</label>
            <input
              placeholder="Введите тег и нажмите Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
            />
            {form.tags.length > 0 && (
              <div className="card-tags" style={{ marginTop: 8 }}>
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
          </div>
        </div>

        <div className="modal-foot">
          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Сохранить' : 'Создать задачу'}
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
