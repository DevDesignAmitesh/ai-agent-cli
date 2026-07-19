import { useState, useEffect } from 'react'
import './App.css'

interface Todo {
  id: string
  text: string
  completed: boolean
}

// Safe fallback for generating unique IDs
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID()
    } catch {
      // Fallback if randomUUID fails
    }
  }
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'pink'>(() => {
    const saved = localStorage.getItem('theme')
    const initialTheme = saved === 'light' || saved === 'dark' || saved === 'pink'
      ? saved 
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    return initialTheme
  })

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'pink')
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'pink') {
      document.documentElement.classList.add('pink')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('todos')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error(e)
      }
    }
    return [
      { id: '1', text: 'Learn React and TypeScript', completed: true },
      { id: '2', text: 'Build a beautiful Todo app', completed: false },
      { id: '3', text: 'Explore Vite features', completed: false }
    ]
  })

  const [newTodoText, setNewTodoText] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoText.trim()) return

    const newTodo: Todo = {
      id: generateId(),
      text: newTodoText.trim(),
      completed: false
    }

    setTodos([newTodo, ...todos])
    setNewTodoText('')
  }

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const handleClearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed))
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })

  const activeCount = todos.filter(todo => !todo.completed).length;

  return (
    <>
      <section id="center">
        <div className="todo-container">
          <header className="todo-header">
            <div className="todo-header-title-row">
              <h1>Todo</h1>
              <button 
                type="button" 
                className="theme-toggle" 
                onClick={() => {
                  if (theme === 'light') setTheme('dark')
                  else if (theme === 'dark') setTheme('pink')
                  else setTheme('light')
                }}
                title="Switch Theme"
                aria-label="Switch Theme"
              >
                {theme === 'light' ? (
                  <svg className="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <title>Light mode - click to switch</title>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                ) : theme === 'dark' ? (
                  <svg className="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <title>Dark mode - click to switch</title>
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                ) : (
                  <svg className="theme-icon" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ color: 'var(--accent)' }}>
                    <title>Pink mode - click to switch</title>
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                )}
              </button>
            </div>
            <p className="todo-subtitle">Stay organized and get things done</p>
          </header>

          <form onSubmit={handleAddTodo} className="todo-form">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              className="todo-input"
              maxLength={100}
            />
            <button type="submit" className="todo-add-btn">
              Add Task
            </button>
          </form>

          <div className="todo-card">
            {todos.length > 0 && (
              <div className="todo-filters">
                <div className="filter-buttons">
                  <button 
                    type="button" 
                    className={"filter-btn " + (filter === 'all' ? 'active' : '')}
                    onClick={() => setFilter('all')}
                  >
                    All
                  </button>
                  <button 
                    type="button" 
                    className={"filter-btn " + (filter === 'active' ? 'active' : '')}
                    onClick={() => setFilter('active')}
                  >
                    Active
                  </button>
                  <button 
                    type="button" 
                    className={"filter-btn " + (filter === 'completed' ? 'active' : '')}
                    onClick={() => setFilter('completed')}
                  >
                    Completed
                  </button>
                </div>

                {todos.some(t => t.completed) && (
                  <button 
                    type="button" 
                    className="clear-btn"
                    onClick={handleClearCompleted}
                  >
                    Clear completed
                  </button>
                )}
              </div>
            )}

            <ul className="todo-list">
              {filteredTodos.length === 0 ? (
                <li className="todo-empty">
                  {filter === 'all' 
                    ? 'No tasks yet. Add one to get started!' 
                    : filter === 'active' 
                    ? 'No active tasks!' 
                    : 'No completed tasks yet!'}
                </li>
              ) : (
                filteredTodos.map(todo => (
                  <li key={todo.id} className={"todo-item " + (todo.completed ? 'completed' : '')}>
                    <label className="todo-checkbox-label">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleTodo(todo.id)}
                        className="todo-checkbox"
                      />
                      <span className="todo-text">{todo.text}</span>
                    </label>
                    <button
                      type="button"
                      className="todo-delete-btn"
                      onClick={() => handleDeleteTodo(todo.id)}
                      aria-label="Delete task"
                    >
                      &times;
                    </button>
                  </li>
                ))
              )}
            </ul>

            {todos.length > 0 && (
              <div className="todo-footer">
                <span>{activeCount + " " + (activeCount === 1 ? 'task' : 'tasks') + " remaining"}</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default App
