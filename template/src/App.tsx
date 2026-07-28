import { useMemo, useState, type FormEvent } from "react";
import "./index.css";

type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

const STORAGE_KEY = "todo-app.items";

function loadTodos(): Todo[] {
  try {
    const savedTodos = localStorage.getItem(STORAGE_KEY);
    if (!savedTodos) return [];

    const parsed: unknown = JSON.parse(savedTodos);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (todo): todo is Todo =>
        typeof todo === "object" &&
        todo !== null &&
        typeof todo.id === "string" &&
        typeof todo.title === "string" &&
        typeof todo.completed === "boolean",
    );
  } catch {
    return [];
  }
}

export function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [newTodo, setNewTodo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const remainingCount = useMemo(() => todos.filter(todo => !todo.completed).length, [todos]);

  const updateTodos = (nextTodos: Todo[]) => {
    setTodos(nextTodos);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTodos));
  };

  const addTodo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newTodo.trim();
    if (!title) return;

    updateTodos([
      ...todos,
      {
        id: crypto.randomUUID(),
        title,
        completed: false,
      },
    ]);
    setNewTodo("");
  };

  const toggleTodo = (id: string) => {
    updateTodos(todos.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  };

  const saveEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = editingTitle.trim();
    if (!editingId || !title) return;

    updateTodos(todos.map(todo => (todo.id === editingId ? { ...todo, title } : todo)));
    setEditingId(null);
    setEditingTitle("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const deleteTodo = (id: string) => {
    updateTodos(todos.filter(todo => todo.id !== id));
    if (editingId === id) cancelEdit();
  };

  return (
    <main className="todo-shell">
      <section className="todo-card" aria-labelledby="todo-heading">
        <header className="todo-header">
          <div>
            <p className="eyebrow">Stay organized</p>
            <h1 id="todo-heading">My tasks</h1>
            <p className="subtitle">Small steps, meaningful progress.</p>
          </div>
          <div className="task-count" aria-label={remainingCount + " tasks remaining"}>
            <strong>{remainingCount}</strong>
            <span>{remainingCount === 1 ? "task left" : "tasks left"}</span>
          </div>
        </header>

        <form className="add-form" onSubmit={addTodo}>
          <label className="sr-only" htmlFor="new-todo">
            Add a new task
          </label>
          <input
            id="new-todo"
            value={newTodo}
            onChange={event => setNewTodo(event.target.value)}
            placeholder="What needs to be done?"
            autoComplete="off"
          />
          <button type="submit" disabled={!newTodo.trim()}>
            <span aria-hidden="true">＋</span> Add task
          </button>
        </form>

        {todos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">✓</div>
            <h2>Your list is clear</h2>
            <p>Add your first task above and make today count.</p>
          </div>
        ) : (
          <ul className="todo-list" aria-label="Todo list">
            {todos.map(todo => (
              <li className={todo.completed ? "todo-item completed" : "todo-item"} key={todo.id}>
                {editingId === todo.id ? (
                  <form className="edit-form" onSubmit={saveEdit}>
                    <label className="sr-only" htmlFor={"edit-" + todo.id}>
                      Edit task
                    </label>
                    <input
                      id={"edit-" + todo.id}
                      value={editingTitle}
                      onChange={event => setEditingTitle(event.target.value)}
                      autoFocus
                    />
                    <button className="save-button" type="submit" disabled={!editingTitle.trim()}>
                      Save
                    </button>
                    <button className="cancel-button" type="button" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <button
                      className="check-button"
                      type="button"
                      onClick={() => toggleTodo(todo.id)}
                      aria-label={todo.completed ? "Mark " + todo.title + " as incomplete" : "Mark " + todo.title + " as complete"}
                      aria-pressed={todo.completed}
                    >
                      <span aria-hidden="true">✓</span>
                    </button>
                    <span className="todo-title">{todo.title}</span>
                    <div className="todo-actions">
                      <button className="icon-button edit-button" type="button" onClick={() => startEditing(todo)}>
                        Edit
                      </button>
                      <button className="icon-button delete-button" type="button" onClick={() => deleteTodo(todo.id)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {todos.length > 0 && (
          <footer className="todo-footer">
            <span>{todos.length} {todos.length === 1 ? "task" : "tasks"} total</span>
            <span>{todos.length - remainingCount} completed</span>
          </footer>
        )}
      </section>
    </main>
  );
}

export default App;
