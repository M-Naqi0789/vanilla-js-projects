let todos = JSON.parse(localStorage.getItem('todos') || '[]');
const input = document.getElementById('todo-input');
const btn = document.getElementById('add-btn');
const list = document.getElementById('todo-list');
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
window.toggleTodo = (id) => {
    todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveAndRender();
};
window.deleteTodo = (id) => {
    todos = todos.filter(t => t.id !== id);
    saveAndRender();
};
window.editTodo = (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo)
        return;
    const newText = prompt('Edit task:', todo.text);
    if (newText !== null && newText.trim() !== "") {
        todo.text = newText.trim();
        saveAndRender();
    }
};
btn.onclick = () => {
    if (!input.value.trim())
        return;
    todos.push({ id: Date.now(), text: input.value, completed: false });
    input.value = '';
    saveAndRender();
};
render();
export {};
//# sourceMappingURL=index.js.map