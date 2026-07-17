import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

interface Todo {
  id: string
  text: string
  completed: boolean
}

function App() {
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
      id: crypto.randomUUID(),
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
    setTodos(todos.filter(todo => todo.id === id))
  }

  const handleClearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed))
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })

  const activeCount = todos.filter(todo => !todo.completed).length

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        
        <div className="todo-container">
          <header className="todo-header">
            <h1>Tasks</h1>
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

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank" rel="noreferrer">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank" rel="noreferrer">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank" rel="noreferrer">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank" rel="noreferrer">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank" rel="noreferrer">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank" rel="noreferrer">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
