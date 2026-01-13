interface Todo {
    id: number;
    text: string;
    completed: boolean;
}

let todos: Todo[] = JSON.parse(localStorage.getItem('todos') || '[]');
const input = document.getElementById('todo-input') as HTMLInputElement;
const btn = document.getElementById('add-btn') as HTMLButtonElement;
const list = document.getElementById('todo-list') as HTMLUListElement;

const saveAndRender = () => {
    localStorage.setItem('todos', JSON.stringify(todos));
    render();
};

const render = () => {
    list.innerHTML = '';
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = todo.completed ? 'completed' : '';
        li.innerHTML = `
            <span onclick="toggleTodo(${todo.id})">${todo.text}</span>
            <div>
                <button class="edit" onclick="editTodo(${todo.id})">Edit</button>
                <button class="del" onclick="deleteTodo(${todo.id})">✕</button>
            </div>
        `;
        list.appendChild(li);
    });
};

(window as any).toggleTodo = (id: number) => {
    todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveAndRender();
};

(window as any).deleteTodo = (id: number) => {
    todos = todos.filter(t => t.id !== id);
    saveAndRender();
};

(window as any).editTodo = (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    const newText = prompt('Edit task:', todo.text);
    if (newText !== null && newText.trim() !== "") {
        todo.text = newText.trim();
        saveAndRender();
    }
};

btn.onclick = () => {
    if (!input.value.trim()) return;
    todos.push({ id: Date.now(), text: input.value, completed: false });
    input.value = '';
    saveAndRender();
};

render();