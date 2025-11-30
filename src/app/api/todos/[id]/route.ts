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

// GET /api/todos/[id] - Get a single TODO
export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })

  const { user } = await payload.auth({ headers })
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = String(user.id)

  try {
    const todo = await payload.kv.get<Todo>(`todos:${userId}:${id}`)

    if (!todo) {
      return Response.json({ error: 'TODO not found' }, { status: 404 })
    }

    // Verify ownership
    if (todo.userId !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    return Response.json({ doc: todo })
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to fetch TODO',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// PATCH /api/todos/[id] - Update a TODO
export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })

  const { user } = await payload.auth({ headers })
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = String(user.id)

  try {
    const existing = await payload.kv.get<Todo>(`todos:${userId}:${id}`)

    if (!existing) {
      return Response.json({ error: 'TODO not found' }, { status: 404 })
    }

    // Verify ownership
    if (existing.userId !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json()) as Partial<Todo>

    // Merge updates with existing TODO
    const updated: Todo = {
      ...existing,
      ...body,
      id: existing.id, // Don't allow changing ID
      userId: existing.userId, // Don't allow changing userId
      createdAt: existing.createdAt, // Don't allow changing createdAt
      updatedAt: new Date().toISOString(), // Update timestamp
    }

    // Store updated TODO
    await payload.kv.set(`todos:${userId}:${id}`, updated)

    return Response.json({ doc: updated })
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to update TODO',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// DELETE /api/todos/[id] - Delete a TODO
export const DELETE = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })

  const { user } = await payload.auth({ headers })
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = String(user.id)

  try {
    const existing = await payload.kv.get<Todo>(`todos:${userId}:${id}`)

    if (!existing) {
      return Response.json({ error: 'TODO not found' }, { status: 404 })
    }

    // Verify ownership
    if (existing.userId !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the TODO
    await payload.kv.delete(`todos:${userId}:${id}`)

    // Update the index
    const indexKey = `todos:user:${userId}:index`
    const todoIds = (await payload.kv.get<string[]>(indexKey)) || []
    const updatedIds = todoIds.filter((todoId) => todoId !== id)
    await payload.kv.set(indexKey, updatedIds)

    return Response.json({ success: true })
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to delete TODO',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
