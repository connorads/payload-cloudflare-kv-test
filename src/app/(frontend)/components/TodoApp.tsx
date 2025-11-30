'use client'

import { useState } from 'react'
import { TodoForm } from './TodoForm'
import { TodoItem } from './TodoItem'
import './todos.css'

interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
  userId: string
}

interface TodoAppProps {
  initialTodos: Todo[]
}

export function TodoApp({ initialTodos }: TodoAppProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async (title: string, description: string) => {
    setLoading(true)
    setError(null)

    // Optimistic update: create temporary TODO
    const tempTodo: Todo = {
      id: `temp-${Date.now()}`,
      title,
      description,
      completed: false,
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: '',
    }

    const previousTodos = [...todos]
    setTodos((prev) => [...prev, tempTodo])

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority: 'medium' }),
      })

      if (!response.ok) {
        throw new Error('Failed to add TODO')
      }

      const { doc } = (await response.json()) as { doc: Todo }

      // Replace temp TODO with real one from server
      setTodos((prev) => prev.map((t) => (t.id === tempTodo.id ? doc : t)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add TODO')
      setTodos(previousTodos) // Revert on error
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: string) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return

    // Optimistic update
    const previousTodos = [...todos]
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      })

      if (!response.ok) {
        throw new Error('Failed to update TODO')
      }

      const { doc } = (await response.json()) as { doc: Todo }
      setTodos((prev) => prev.map((t) => (t.id === id ? doc : t)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update TODO')
      setTodos(previousTodos) // Revert on error
    }
  }

  const handleDelete = async (id: string) => {
    // Optimistic update
    const previousTodos = [...todos]
    setTodos((prev) => prev.filter((t) => t.id !== id))

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete TODO')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete TODO')
      setTodos(previousTodos) // Revert on error
    }
  }

  return (
    <div className="todo-app">
      <div className="todo-header">
        <h1>My TODOs</h1>
        <p>Stored in Cloudflare KV</p>
      </div>

      {error && <div className="todo-error">{error}</div>}

      <TodoForm onAdd={handleAdd} loading={loading} />

      {todos.length === 0 ? (
        <div className="todo-empty">No TODOs yet. Add one above to get started!</div>
      ) : (
        <div className="todo-list">
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
