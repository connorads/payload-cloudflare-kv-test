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

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const handleToggle = () => {
    onToggle(todo.id)
  }

  const handleDelete = () => {
    if (confirm(`Delete "${todo.title}"?`)) {
      onDelete(todo.id)
    }
  }

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        className="todo-checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
      />
      <div className="todo-content">
        <h3 className="todo-title">{todo.title}</h3>
        {todo.description && <p className="todo-description">{todo.description}</p>}
        <div className="todo-meta" suppressHydrationWarning>
          Created {new Date(todo.createdAt).toLocaleString()}
        </div>
      </div>
      <button className="todo-delete" onClick={handleDelete} aria-label={`Delete "${todo.title}"`}>
        Delete
      </button>
    </div>
  )
}
