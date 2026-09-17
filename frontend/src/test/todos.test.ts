import { beforeEach, describe, expect, it, vi } from 'vitest'
import { client } from '../api/client.ts'
import { createTodo, deleteTodo, listTodos, updateTodo } from '../api/todos.ts'

vi.mock('../api/client.ts', () => ({
  client: {
    GET: vi.fn(),
    POST: vi.fn(),
    PUT: vi.fn(),
    DELETE: vi.fn(),
  },
}))

const mockClient = vi.mocked(client)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listTodos', () => {
  it('returns data on success', async () => {
    const todos = [{ id: 1, title: 'Buy milk', completed: false }]
    mockClient.GET.mockResolvedValue({ data: todos, error: undefined } as never)

    await expect(listTodos()).resolves.toEqual(todos)
    expect(mockClient.GET).toHaveBeenCalledWith('/api/todos')
  })

  it('throws when the request errors', async () => {
    mockClient.GET.mockResolvedValue({ data: undefined, error: {} } as never)

    await expect(listTodos()).rejects.toThrow('Failed to list todos')
  })
})

describe('createTodo', () => {
  it('posts the title with completed: false', async () => {
    mockClient.POST.mockResolvedValue({ data: undefined, error: undefined } as never)

    await createTodo('Buy milk')

    expect(mockClient.POST).toHaveBeenCalledWith('/api/todos', {
      body: { title: 'Buy milk', completed: false },
    })
  })

  it('throws when the request errors', async () => {
    mockClient.POST.mockResolvedValue({ data: undefined, error: {} } as never)

    await expect(createTodo('Buy milk')).rejects.toThrow('Failed to create todo')
  })
})

describe('updateTodo', () => {
  it('puts the patch to the todo path', async () => {
    mockClient.PUT.mockResolvedValue({ data: undefined, error: undefined } as never)

    await updateTodo(1, { title: 'Buy milk', completed: true })

    expect(mockClient.PUT).toHaveBeenCalledWith('/api/todos/{id}', {
      params: { path: { id: 1 } },
      body: { title: 'Buy milk', completed: true },
    })
  })

  it('throws when the request errors', async () => {
    mockClient.PUT.mockResolvedValue({ data: undefined, error: {} } as never)

    await expect(updateTodo(1, { title: 'Buy milk', completed: true })).rejects.toThrow(
      'Failed to update todo',
    )
  })
})

describe('deleteTodo', () => {
  it('deletes the todo path', async () => {
    mockClient.DELETE.mockResolvedValue({ data: undefined, error: undefined } as never)

    await deleteTodo(1)

    expect(mockClient.DELETE).toHaveBeenCalledWith('/api/todos/{id}', {
      params: { path: { id: 1 } },
    })
  })

  it('throws when the request errors', async () => {
    mockClient.DELETE.mockResolvedValue({ data: undefined, error: {} } as never)

    await expect(deleteTodo(1)).rejects.toThrow('Failed to delete todo')
  })
})
