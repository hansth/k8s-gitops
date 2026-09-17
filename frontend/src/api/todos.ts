import { client } from './client'
import type { components } from '@hansterhorst/openapi'

export type Todo = Required<components['schemas']['Todo']>

export async function listTodos(): Promise<Todo[]> {
  const { data, error } = await client.GET('/api/todos')
  if (error) throw new Error('Failed to list todos')
  return data as Todo[]
}

export async function createTodo(title: string): Promise<void> {
  const { error } = await client.POST('/api/todos', {
    body: { title, completed: false },
  })
  if (error) throw new Error('Failed to create todo')
}

export async function updateTodo(
  id: number,
  patch: { title: string; completed: boolean },
): Promise<void> {
  const { error } = await client.PUT('/api/todos/{id}', {
    params: { path: { id } },
    body: patch,
  })
  if (error) throw new Error('Failed to update todo')
}

export async function deleteTodo(id: number): Promise<void> {
  const { error } = await client.DELETE('/api/todos/{id}', {
    params: { path: { id } },
  })
  if (error) throw new Error('Failed to delete todo')
}