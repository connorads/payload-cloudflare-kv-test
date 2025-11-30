import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'

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

// GET /api/todos - List all TODOs for the authenticated user
export const GET = async () => {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })

  const { user } = await payload.auth({ headers })
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = String(user.id)

  try {
    // Get the index of TODO IDs for this user
    const indexKey = `todos:user:${userId}:index`
    const todoIds = (await payload.kv.get<string[]>(indexKey)) || []

    if (todoIds.length === 0) {
      return Response.json({ todos: [] })
    }

    // Fetch all TODOs in parallel
    const todos = await Promise.all(
      todoIds.map(async (id) => {
        const todo = await payload.kv.get<Todo>(`todos:${userId}:${id}`)
        return todo
      }),
    )

    // Filter out any null values (deleted TODOs) and sort by updatedAt
    const validTodos = todos.filter((todo): todo is Todo => todo !== null)
    validTodos.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return Response.json({ todos: validTodos })
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to fetch TODOs',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// POST /api/todos - Create a new TODO
export const POST = async (request: Request) => {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })

  const { user } = await payload.auth({ headers })
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = String(user.id)

  try {
    const body = (await request.json()) as {
      title?: string
      description?: string
      priority?: 'low' | 'medium' | 'high'
    }
    const { title, description, priority } = body

    if (!title || typeof title !== 'string') {
      return Response.json({ error: 'Title is required' }, { status: 400 })
    }

    // Generate a new TODO
    const todo: Todo = {
      id: crypto.randomUUID(),
      title,
      description: description || '',
      completed: false,
      priority: priority || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId,
    }

    // Store the TODO in KV
    await payload.kv.set(`todos:${userId}:${todo.id}`, todo)

    // Update the index
    const indexKey = `todos:user:${userId}:index`
    const todoIds = (await payload.kv.get<string[]>(indexKey)) || []
    todoIds.push(todo.id)
    await payload.kv.set(indexKey, todoIds)

    return Response.json({ doc: todo }, { status: 201 })
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to create TODO',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
