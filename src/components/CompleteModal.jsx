import { useState } from 'react'

// Окно завершения: перед «Готово» исполнитель обязан описать результат
export default function CompleteModal({ task, onCancel, onComplete }) {
  const [result, setResult] = useState(task.result || '')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!result.trim()) {
      setError('Опишите результат — без него задачу нельзя завершить')
      return
    }
    onComplete(result.trim())
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="modal modal-narrow" onSubmit={submit}>
        <div className="modal-head">
          <h2>🏁 Завершение задачи</h2>
          <button type="button" className="icon-btn" onClick={onCancel} aria-label="Закрыть">×</button>
        </div>
        <div className="modal-body">
          <p className="task-author-line">«{task.title}»</p>
          {task.measure && (
            <p className="push-note">🎯 Ожидаемый результат: {task.measure}</p>
          )}
          <div className="field">
            <label>Результат выполнения</label>
            <textarea
              autoFocus
              rows={3}
              placeholder="Что сделано по факту: цифры, ссылки, итог…"
              value={result}
              onChange={(e) => setResult(e.target.value)}
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
        </div>
        <div className="modal-foot">
          <button type="submit" className="btn btn-primary">✅ Завершить задачу</button>
          <button type="button" className="btn" onClick={onCancel}>Отмена</button>
        </div>
      </form>
    </div>
  )
}
