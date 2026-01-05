 const TASK_STORAGE_KEY = 'task_manager_tasks';
        let tasks = [];
        let reminderTimeout;
        const DOM = {
            taskList: document.getElementById('task-list'),
            taskForm: document.getElementById('task-form'),
            taskName: document.getElementById('task-name'),
            taskPriority: document.getElementById('task-priority'),
            taskCategory: document.getElementById('task-category'),
            taskDeadline: document.getElementById('task-deadline'),
            search: document.getElementById('search-input'),
            filterCategory: document.getElementById('filter-category'),
            sortBy: document.getElementById('sort-by'),
            modeToggle: document.getElementById('mode-toggle'),
            modeIcon: document.getElementById('mode-icon'),
            completedCount: document.getElementById('completed-count'),
            pendingCount: document.getElementById('pending-count'),
            overdueCount: document.getElementById('overdue-count'),
            taskCount: document.getElementById('task-count'),
            notificationBox: document.getElementById('notification-box'),
            notificationText: document.getElementById('notification-text'),
        };

        function showNotification(message) {
            DOM.notificationText.textContent = message;
            DOM.notificationBox.style.display = 'block';
            DOM.notificationBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => {
                DOM.notificationBox.style.display = 'none';
            }, 4000);
        }

        function getPriorityValue(priority) {
            switch (priority) {
                case 'High': return 3;
                case 'Medium': return 2;
                case 'Low': return 1;
                default: return 0;
            }
        }
        
        function isOverdue(deadline) {
            if (!deadline) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const taskDate = new Date(deadline);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate < today;
        }

        function saveTasks() {
            try {
                localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
                updateAnalytics();
                applyFiltersAndSort();
            } catch (error) {
                console.error('Error saving tasks to local storage:', error);
            }
        }

        function loadTasks() {
            try {
                const storedTasks = localStorage.getItem(TASK_STORAGE_KEY);
                if (storedTasks) {
                    tasks = JSON.parse(storedTasks);
                }
            } catch (error) {
                console.error('Error loading tasks from local storage:', error);
                tasks = [];
            }
        }

        function setupReminders() {
            clearTimeout(reminderTimeout);

            const pendingTasks = tasks.filter(t => !t.completed && t.deadline);

            if (pendingTasks.length === 0) return;

            pendingTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

            const closestTask = pendingTasks[0];
            const deadlineDate = new Date(closestTask.deadline);
            const reminderTime = deadlineDate.getTime() - (24 * 60 * 60 * 1000); 
            const now = new Date().getTime();
            const delay = reminderTime - now;

            if (delay > 0) {
                reminderTimeout = setTimeout(() => {
                    showNotification(`REMINDER: Your task "${closestTask.name}" is due tomorrow!`);
                }, delay);
            }
        }

        function addTask(event) {
            event.preventDefault();
            
            const name = DOM.taskName.value.trim();
            const priority = DOM.taskPriority.value;
            const category = DOM.taskCategory.value;
            const deadline = DOM.taskDeadline.value;

            if (!name || !priority || !category) {
                showNotification("Please fill in the task name, priority, and category.");
                return;
            }

            const newTask = {
                id: Date.now(),
                name,
                priority,
                category,
                deadline: deadline || null,
                completed: false,
                createdAt: new Date().toISOString()
            };

            tasks.push(newTask);
            saveTasks();
            applyFiltersAndSort();
            setupReminders();
            DOM.taskForm.reset();
        }

        function toggleComplete(id) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.completed = !task.completed;
                saveTasks();
                applyFiltersAndSort();
                setupReminders();
            }
        }

        function deleteTask(id) {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            applyFiltersAndSort();
            setupReminders();
        }

        function editTask(id) {
            const task = tasks.find(t => t.id === id);
            if (!task) return;

            const newName = prompt(`Editing task: ${task.name}\nEnter new task name:`, task.name);
            if (newName && newName.trim() !== task.name) {
                task.name = newName.trim();
                saveTasks();
                applyFiltersAndSort();
            }
        }

        function updateAnalytics() {
            const completed = tasks.filter(t => t.completed).length;
            const pending = tasks.filter(t => !t.completed).length;
            const overdue = tasks.filter(t => !t.completed && isOverdue(t.deadline)).length;

            DOM.completedCount.textContent = completed;
            DOM.pendingCount.textContent = pending;
            DOM.overdueCount.textContent = overdue;
            DOM.taskCount.textContent = tasks.length;
        }

        function applyFiltersAndSort() {
            let filteredTasks = tasks;
            const searchTerm = DOM.search.value.toLowerCase();
            const categoryFilter = DOM.filterCategory.value;
            const sortBy = DOM.sortBy.value;

            if (searchTerm) {
                filteredTasks = filteredTasks.filter(t => 
                    t.name.toLowerCase().includes(searchTerm)
                );
            }

            if (categoryFilter !== 'All') {
                filteredTasks = filteredTasks.filter(t => t.category === categoryFilter);
            }

            if (sortBy === 'priority') {
                filteredTasks.sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority));
            } else if (sortBy === 'deadline') {
                filteredTasks.sort((a, b) => {
                    if (a.deadline === b.deadline) return 0;
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(a.deadline) - new Date(b.deadline);
                });
            }
            
            filteredTasks.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);

            renderTasks(filteredTasks);
        }

        function renderTasks(taskListToRender) {
            DOM.taskList.innerHTML = '';

            if (taskListToRender.length === 0) {
                DOM.taskList.innerHTML = '<li style="text-align: center; opacity: 0.6; padding: 20px;">No tasks found! Try adjusting your filters or search term.</li>';
                return;
            }

            taskListToRender.forEach(task => {
                const li = document.createElement('li');
                li.className = `task-item priority-${task.priority.toLowerCase()} ${task.completed ? 'completed' : ''}`;
                
                const overdue = isOverdue(task.deadline) && !task.completed;
                let deadlineText = task.deadline ? task.deadline : 'No Deadline';

                if (overdue) {
                    deadlineText = '🚨 OVERDUE: ' + deadlineText;
                    li.style.borderLeftColor = 'var(--high-priority-color)';
                }

                li.innerHTML = `
                    <div class="task-details">
                        <h4>${task.name}</h4>
                        <div class="task-meta">
                            <span class="tag">Category: ${task.category}</span>
                            <span class="tag">Priority: ${task.priority}</span>
                            <span>Due: ${deadlineText}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="action-btn complete-btn" title="${task.completed ? 'Mark as Pending' : 'Mark as Complete'}" onclick="toggleComplete(${task.id})">
                            ${task.completed ? '☑️' : '☐'}
                        </button>
                        <button class="action-btn" title="Edit Task" onclick="editTask(${task.id})">✏️</button>
                        <button class="action-btn delete-btn" title="Delete Task" onclick="deleteTask(${task.id})">🗑️</button>
                    </div>
                `;
                DOM.taskList.appendChild(li);
            });
        }

        function toggleDarkMode() {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', isDark);
            DOM.modeIcon.textContent = isDark ? '☀️' : '🌙';
        }

        function initDarkMode() {
            const savedMode = localStorage.getItem('darkMode') === 'true';
            if (savedMode) {
                document.body.classList.add('dark-mode');
                DOM.modeIcon.textContent = '☀️';
            } else {
                DOM.modeIcon.textContent = '🌙';
            }
        }

        function initApp() {
            initDarkMode();
            loadTasks();
            updateAnalytics();
            applyFiltersAndSort();

            DOM.taskForm.addEventListener('submit', addTask);
            DOM.search.addEventListener('input', applyFiltersAndSort);
            DOM.modeToggle.addEventListener('click', toggleDarkMode);
        }

        window.onload = initApp;