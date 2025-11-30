import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import './styles.css'
import { TodoApp } from './components/TodoApp'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return (
      <div className="home">
        <div className="content" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h1>Please Log In</h1>
          <p style={{ color: 'rgb(156, 163, 175)', marginBottom: '20px' }}>
            You need to be logged in to use the TODO app.
          </p>
          <a
            className="admin"
            href={payloadConfig.routes.admin}
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: 'rgb(99, 102, 241)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
            }}
          >
            Go to Admin Panel
          </a>
        </div>
      </div>
    )
  }

  // Fetch initial TODOs server-side using Payload KV directly
  let initialTodos: any[] = []

  try {
    const userId = String(user.id)
    const indexKey = `todos:user:${userId}:index`
    const todoIds = (await payload.kv.get<string[]>(indexKey)) || []

    if (todoIds.length > 0) {
      // Fetch all TODOs in parallel
      const todos = await Promise.all(
        todoIds.map(async (id) => {
          const todo = await payload.kv.get(`todos:${userId}:${id}`)
          return todo
        }),
      )

      // Filter out nulls and sort by updatedAt
      initialTodos = todos
        .filter((todo): todo is any => todo !== null)
        .sort((a: any, b: any) => {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        })
    }
  } catch (error) {
    console.error('Failed to fetch initial TODOs:', error)
  }

  return <TodoApp initialTodos={initialTodos} />
}
