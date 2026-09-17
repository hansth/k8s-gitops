import { useEffect, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { type Todo, createTodo, deleteTodo, listTodos, updateTodo } from './api/todos'
import './App.css'

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    try {
      setLoading(true)
      setTodos(await listTodos())
      setError(null)
    } catch {
      setError('Could not load todos. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    try {
      await createTodo(title)
      setNewTitle('')
      await refresh()
    } catch {
      setError('Could not add todo.')
    }
  }

  async function handleToggle(todo: Todo) {
    try {
      await updateTodo(todo.id, { title: todo.title, completed: !todo.completed })
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t)),
      )
    } catch {
      setError('Could not update todo.')
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteTodo(id)
      setTodos((prev) => prev.filter((t) => t.id !== id))
    } catch {
      setError('Could not delete todo.')
    }
  }

  function startEditing(todo: Todo) {
    setEditingId(todo.id)
    setEditingTitle(todo.title)
  }

  function cancelEditing() {
    setEditingId(null)
    setEditingTitle('')
  }

  async function commitEditing(todo: Todo) {
    const title = editingTitle.trim()
    if (!title || title === todo.title) {
      cancelEditing()
      return
    }
    try {
      await updateTodo(todo.id, { title, completed: todo.completed })
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, title } : t)))
    } catch {
      setError('Could not update todo.')
    } finally {
      cancelEditing()
    }
  }

  function handleEditKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  const remaining = todos.filter((t) => !t.completed).length

  return (
    <section id="todo-app">
      <h1>Todos</h1>

      <form className="add-form" onSubmit={handleAdd}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="What needs doing?"
          aria-label="New todo title"
        />
        <button type="submit">Add</button>
      </form>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="empty">Loading…</p>
      ) : todos.length === 0 ? (
        <p className="empty">No todos yet.</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className={todo.completed ? 'completed' : ''}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggle(todo)}
                aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
              />
              {editingId === todo.id ? (
                <input
                  type="text"
                  className="edit-input"
                  value={editingTitle}
                  autoFocus
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => commitEditing(todo)}
                  onKeyDown={handleEditKeyDown}
                />
              ) : (
                <span className="title" onClick={() => startEditing(todo)}>
                  {todo.title}
                </span>
              )}
              <button
                type="button"
                className="delete"
                onClick={() => handleDelete(todo.id)}
                aria-label={`Delete "${todo.title}"`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && todos.length > 0 && (
        <p className="count">
          {remaining} {remaining === 1 ? 'item' : 'items'} left
        </p>
      )}
    </section>
  )
}

export default App