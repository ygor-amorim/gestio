import { useState, useEffect, useCallback } from 'react'
import type { Todo } from '../types'

const STORAGE_KEY = 'edge_todos'

function loadTodos(): Todo[] {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return []
  return JSON.parse(saved)
}

function saveTodos(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos)

  useEffect(() => {
    saveTodos(todos)
  }, [todos])

  const addTodo = useCallback((text: string, clientFile?: string) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      clientFile,
      done: false,
      createdAt: new Date().toISOString(),
    }
    setTodos(prev => [newTodo, ...prev])
    return newTodo
  }, [])

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    ))
  }, [])

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }, [])

  const importTodos = useCallback((newTodos: Todo[]) => {
    setTodos(newTodos)
  }, [])

  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    importTodos,
  }
}
