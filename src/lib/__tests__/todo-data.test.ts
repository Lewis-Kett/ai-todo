/**
 * Unit tests for shared todo data layer
 */

import { getTodosFromFile, setTodosInFile, revalidateTodos } from '../todo-data'
import { Todo } from '@/types/todo'

// Mock Next.js cache functions
jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
}))

// Mock fs.promises for in-memory testing
let mockTodos: Todo[] = []

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn().mockImplementation(() => {
      return Promise.resolve(JSON.stringify(mockTodos))
    }),
    writeFile: jest.fn().mockImplementation((_, data) => {
      mockTodos = JSON.parse(data)
      return Promise.resolve()
    }),
    mkdir: jest.fn().mockResolvedValue(undefined)
  }
}))

import { revalidateTag } from 'next/cache'
import { promises as fs } from 'fs'

describe('Todo Data Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTodos = [
      {
        id: 'test-1',
        name: 'Test Todo 1',
        category: 'Testing',
        priority: 'High Priority',
        completed: false
      },
      {
        id: 'test-2',
        name: 'Test Todo 2',
        category: 'Testing',
        priority: 'Medium Priority',
        completed: true
      }
    ]
  })

  describe('getTodosFromFile', () => {
    it('should read and parse todos from file', async () => {
      const todos = await getTodosFromFile()
      
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('todos.json'),
        'utf8'
      )
      expect(todos).toEqual(mockTodos)
    })

    it('should return empty array when file read fails', async () => {
      ;(fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('File not found'))
      
      const todos = await getTodosFromFile()
      
      expect(todos).toEqual([])
    })

    it('should return empty array when JSON parse fails', async () => {
      ;(fs.readFile as jest.Mock).mockResolvedValueOnce('invalid json')
      
      const todos = await getTodosFromFile()
      
      expect(todos).toEqual([])
    })
  })

  describe('setTodosInFile', () => {
    it('should write todos to file with proper formatting', async () => {
      const testTodos: Todo[] = [
        {
          id: 'new-test',
          name: 'New Test Todo',
          category: 'New',
          priority: 'Low Priority',
          completed: false
        }
      ]

      await setTodosInFile(testTodos)

      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('data'),
        { recursive: true }
      )
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('todos.json'),
        JSON.stringify(testTodos, null, 2),
        'utf8'
      )
    })

    it('should update mock todos correctly', async () => {
      const testTodos: Todo[] = [
        {
          id: 'updated-test',
          name: 'Updated Todo',
          category: 'Updated',
          priority: 'High Priority',
          completed: true
        }
      ]

      await setTodosInFile(testTodos)

      expect(mockTodos).toEqual(testTodos)
    })
  })

  describe('revalidateTodos', () => {
    it('should call revalidateTag with todos tag', () => {
      revalidateTodos()
      
      expect(revalidateTag).toHaveBeenCalledWith('todos')
    })
  })
})