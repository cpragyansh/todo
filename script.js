document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const emptyState = document.getElementById('empty-state');
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const progressText = document.getElementById('progress-text');
    const progressCircle = document.querySelector('.progress-ring__circle');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const clearBtn = document.getElementById('clear-completed');
    const dateDisplay = document.getElementById('date-display');

    // --- State ---
    let tasks = JSON.parse(localStorage.getItem('protasks')) || [];
    let currentFilter = 'all';

    // --- Initialize ---
    setDate();
    renderTasks();
    updateStats();

    // --- Date Formatting ---
    function setDate() {
        const optionsWeekday = { weekday: 'long' };
        const optionsDate = { month: 'long', day: 'numeric', year: 'numeric' };
        const today = new Date();
        
        dateDisplay.innerHTML = `
            <span class="date-day">${today.toLocaleDateString('en-US', optionsWeekday)}</span>
            <span class="date-full">${today.toLocaleDateString('en-US', optionsDate)}</span>
        `;
    }

    // --- Event Listeners ---
    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = todoInput.value.trim();
        if (text) {
            addTask(text);
            todoInput.value = '';
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active class
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Set current filter and re-render
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    clearBtn.addEventListener('click', () => {
        tasks = tasks.filter(t => !t.completed);
        saveAndRender();
    });

    // --- Core Functions ---
    function addTask(text) {
        const newTask = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        tasks.unshift(newTask); // Add to beginning
        saveAndRender();
    }

    function toggleTask(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        saveAndRender();
    }

    function deleteTask(id) {
        // Find DOM element to add exit animation
        const li = document.querySelector(`[data-id="${id}"]`);
        if (li) {
            li.classList.add('deleting');
            // Wait for animation to finish before actually removing
            setTimeout(() => {
                tasks = tasks.filter(task => task.id !== id);
                saveAndRender();
            }, 300);
        } else {
            tasks = tasks.filter(task => task.id !== id);
            saveAndRender();
        }
    }

    function editTask(id, textEl) {
        const li = textEl.closest('.todo-item');
        const task = tasks.find(t => t.id === id);
        if(!task) return;

        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = task.text;
        input.className = 'edit-input';
        
        // Basic styling for inline edit
        input.style.width = '100%';
        input.style.background = 'transparent';
        input.style.border = 'none';
        input.style.borderBottom = '1px solid var(--accent-primary)';
        input.style.color = 'var(--text-primary)';
        input.style.fontSize = '1.05rem';
        input.style.outline = 'none';
        input.style.fontFamily = 'inherit';
        
        textEl.replaceWith(input);
        input.focus();

        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText) {
                task.text = newText;
            }
            saveAndRender();
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') saveAndRender();
        });
    }

    // --- Rendering ---
    function renderTasks() {
        todoList.innerHTML = '';
        
        let filteredTasks = tasks;
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(t => !t.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(t => t.completed);
        }

        if (filteredTasks.length === 0) {
            emptyState.classList.add('visible');
            todoList.style.display = 'none';
        } else {
            emptyState.classList.remove('visible');
            todoList.style.display = 'flex';
            
            filteredTasks.forEach(task => {
                const li = document.createElement('li');
                li.className = `todo-item ${task.completed ? 'completed' : ''}`;
                li.dataset.id = task.id;
                
                li.innerHTML = `
                    <div class="task-left">
                        <label class="custom-checkbox">
                            <input type="checkbox" ${task.completed ? 'checked' : ''} class="task-checkbox">
                            <span class="checkmark"></span>
                        </label>
                        <span class="task-text">${escapeHTML(task.text)}</span>
                    </div>
                    <div class="task-actions">
                        <button class="action-btn edit-btn" aria-label="Edit task">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="action-btn delete-btn" aria-label="Delete task">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                `;

                // Add event listeners to the generated elements
                const checkbox = li.querySelector('.task-checkbox');
                checkbox.addEventListener('change', () => toggleTask(task.id));

                const deleteBtn = li.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', () => deleteTask(task.id));

                const editBtn = li.querySelector('.edit-btn');
                const textEl = li.querySelector('.task-text');
                editBtn.addEventListener('click', () => editTask(task.id, textEl));
                
                // Allow double click on text to edit
                textEl.addEventListener('dblclick', () => editTask(task.id, textEl));

                todoList.appendChild(li);
            });
        }
    }

    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        
        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        pendingTasksEl.textContent = pending;

        // Circular progress calculation
        const circumference = 2 * Math.PI * 26; // r=26
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
        const offset = circumference - (percent / 100) * circumference;
        
        progressCircle.style.strokeDashoffset = offset;
        progressText.textContent = `${percent}%`;
    }

    function saveAndRender() {
        localStorage.setItem('protasks', JSON.stringify(tasks));
        renderTasks();
        updateStats();
    }

    // Utility: prevent XSS
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
