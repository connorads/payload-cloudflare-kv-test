import { useState } from 'react'

interface TodoFormProps {
  onAdd: (title: string, description: string) => Promise<void>
  loading: boolean
}

export function TodoForm({ onAdd, loading }: TodoFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      return
    }

    await onAdd(title.trim(), description.trim())

    // Clear form after successful add
    setTitle('')
    setDescription('')
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <div className="todo-input-group">
        <input
          type="text"
          className="todo-input"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          required
          maxLength={200}
        />
        <textarea
          className="todo-textarea"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
      </div>
      <button type="submit" className="todo-button" disabled={loading || !title.trim()}>
        {loading ? 'Adding...' : 'Add TODO'}
      </button>
    </form>
  )
}
