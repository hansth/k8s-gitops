import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { createTodo, deleteTodo, listTodos, updateTodo } from '../api/todos.ts'
import type { Todo } from '../api/todos.ts'

vi.mock('../api/todos.ts', () => ({
  listTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
}))

const mockListTodos = vi.mocked(listTodos)
const mockCreateTodo = vi.mocked(createTodo)
const mockUpdateTodo = vi.mocked(updateTodo)
const mockDeleteTodo = vi.mocked(deleteTodo)

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return { id: 1, title: 'Buy milk', completed: false, ...overrides }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('loading and empty states', () => {
  it('shows an empty message once loading resolves with no todos', async () => {
    mockListTodos.mockResolvedValue([])

    render(<App />)

    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(await screen.findByText('No todos yet.')).toBeInTheDocument()
  })

  it('shows an error banner when loading fails', async () => {
    mockListTodos.mockRejectedValue(new Error('network down'))

    render(<App />)

    expect(await screen.findByText('Could not load todos. Is the backend running?')).toBeInTheDocument()
  })
})

describe('rendering a list', () => {
  it('renders todos and the remaining count', async () => {
    mockListTodos.mockResolvedValue([
      makeTodo({ id: 1, title: 'Buy milk', completed: false }),
      makeTodo({ id: 2, title: 'Walk dog', completed: true }),
    ])

    render(<App />)

    expect(await screen.findByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText('Walk dog')).toBeInTheDocument()
    expect(screen.getByText('1 item left')).toBeInTheDocument()
  })
})

describe('adding a todo', () => {
  it('submits the trimmed title and refreshes the list', async () => {
    const user = userEvent.setup()
    mockListTodos.mockResolvedValue([])
    mockCreateTodo.mockResolvedValue(undefined)

    render(<App />)
    await screen.findByText('No todos yet.')

    mockListTodos.mockResolvedValue([makeTodo({ title: 'Buy milk' })])
    await user.type(screen.getByLabelText('New todo title'), '  Buy milk  ')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(mockCreateTodo).toHaveBeenCalledWith('Buy milk')
    expect(await screen.findByText('Buy milk')).toBeInTheDocument()
  })

  it('shows an error message when creating fails', async () => {
    const user = userEvent.setup()
    mockListTodos.mockResolvedValue([])
    mockCreateTodo.mockRejectedValue(new Error('boom'))

    render(<App />)
    await screen.findByText('No todos yet.')

    await user.type(screen.getByLabelText('New todo title'), 'Buy milk')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByText('Could not add todo.')).toBeInTheDocument()
  })
})

describe('toggling completion', () => {
  it('flips completed and calls updateTodo', async () => {
    const user = userEvent.setup()
    const todo = makeTodo({ id: 1, title: 'Buy milk', completed: false })
    mockListTodos.mockResolvedValue([todo])
    mockUpdateTodo.mockResolvedValue(undefined)

    render(<App />)
    const checkbox = await screen.findByLabelText('Mark "Buy milk" as complete')

    await user.click(checkbox)

    expect(mockUpdateTodo).toHaveBeenCalledWith(1, { title: 'Buy milk', completed: true })
    expect(checkbox).toBeChecked()
  })

  it('shows an error message when updating fails', async () => {
    const user = userEvent.setup()
    mockListTodos.mockResolvedValue([makeTodo({ completed: false })])
    mockUpdateTodo.mockRejectedValue(new Error('boom'))

    render(<App />)
    const checkbox = await screen.findByLabelText('Mark "Buy milk" as complete')

    await user.click(checkbox)

    expect(await screen.findByText('Could not update todo.')).toBeInTheDocument()
  })
})

describe('deleting a todo', () => {
  it('removes the todo from the list', async () => {
    const user = userEvent.setup()
    mockListTodos.mockResolvedValue([makeTodo({ title: 'Buy milk' })])
    mockDeleteTodo.mockResolvedValue(undefined)

    render(<App />)
    await screen.findByText('Buy milk')

    await user.click(screen.getByLabelText('Delete "Buy milk"'))

    expect(mockDeleteTodo).toHaveBeenCalledWith(1)
    await waitFor(() => expect(screen.queryByText('Buy milk')).not.toBeInTheDocument())
  })

  it('shows an error message when deleting fails', async () => {
    const user = userEvent.setup()
    mockListTodos.mockResolvedValue([makeTodo({ title: 'Buy milk' })])
    mockDeleteTodo.mockRejectedValue(new Error('boom'))

    render(<App />)
    await screen.findByText('Buy milk')

    await user.click(screen.getByLabelText('Delete "Buy milk"'))

    expect(await screen.findByText('Could not delete todo.')).toBeInTheDocument()
  })
})

describe('inline editing', () => {
  it('commits a changed title on blur', async () => {
    const user = userEvent.setup()
    mockListTodos.mockResolvedValue([makeTodo({ title: 'Buy milk' })])
    mockUpdateTodo.mockResolvedValue(undefined)

    render(<App />)
    await user.click(await screen.findByText('Buy milk'))

    const input = screen.getByDisplayValue('Buy milk')
    await user.clear(input)
    await user.type(input, 'Buy oat milk')
    await user.tab()

    expect(mockUpdateTodo).toHaveBeenCalledWith(1, { title: 'Buy oat milk', completed: false })
    expect(await screen.findByText('Buy oat milk')).toBeInTheDocument()
  })

  it('cancels editing on Escape without saving', async () => {
    const user = userEvent.setup()
    mockListTodos.mockResolvedValue([makeTodo({ title: 'Buy milk' })])

    render(<App />)
    await user.click(await screen.findByText('Buy milk'))

    const input = screen.getByDisplayValue('Buy milk')
    await user.type(input, ' extra')
    await user.keyboard('{Escape}')

    expect(mockUpdateTodo).not.toHaveBeenCalled()
    expect(await screen.findByText('Buy milk')).toBeInTheDocument()
  })

  it('does not call updateTodo when the title is unchanged', async () => {
    const user = userEvent.setup()
    mockListTodos.mockResolvedValue([makeTodo({ title: 'Buy milk' })])

    render(<App />)
    await user.click(await screen.findByText('Buy milk'))

    const input = screen.getByDisplayValue('Buy milk')
    await user.tab()

    await waitFor(() => expect(screen.queryByDisplayValue('Buy milk')).not.toBeInTheDocument())
    expect(mockUpdateTodo).not.toHaveBeenCalled()
    expect(input).not.toBeInTheDocument()
  })
})
