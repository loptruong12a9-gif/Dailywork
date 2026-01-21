/**
 * NexusOS - Enterprise Task Management
 * Developed by: Tân Nguyễn
 */

const state = {
    currentDate: new Date(),
    selectedDate: new Date(),
    tasks: JSON.parse(localStorage.getItem('nexus_tasks')) || []
};

const UI = {
    monthYear: document.getElementById('month-year-display'),
    fullDate: document.getElementById('full-date-display'),
    calendarDays: document.getElementById('calendar-days'),
    taskDeck: document.getElementById('task-deck'),
    dayLabel: document.getElementById('current-day-label'),
    modal: document.getElementById('task-modal'),
    input: document.getElementById('task-input'),
    btnPrev: document.getElementById('prev-month'),
    btnNext: document.getElementById('next-month'),
    btnAdd: document.getElementById('add-task-trigger'),
    btnSave: document.getElementById('save-task'),
    btnClose: document.getElementById('close-modal'),
    statComp: document.getElementById('stat-completed'),
    statPend: document.getElementById('stat-pending')
};

const CONFIG = {
    months: ["Tháng 01", "Tháng 02", "Tháng 03", "Tháng 04", "Tháng 05", "Tháng 06", "Tháng 07", "Tháng 08", "Tháng 09", "Tháng 10", "Tháng 11", "Tháng 12"],
    weekdays: ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]
};

// Initialization
function init() {
    renderCalendar();
    renderTasks();
    updateHeader();
    setupEventListeners();
}

function setupEventListeners() {
    UI.btnPrev.addEventListener('click', () => navigateMonth(-1));
    UI.btnNext.addEventListener('click', () => navigateMonth(1));
    UI.btnAdd.addEventListener('click', () => toggleModal(true));
    UI.btnClose.addEventListener('click', () => toggleModal(false));

    // Tách riêng logic gán sự kiện cho btnSave để linh hoạt hơn
    UI.btnSave.addEventListener('click', () => {
        // btnSave.onclick sẽ được modal quản lý để biết là thêm mới hay sửa
        if (typeof UI.btnSave.onclick === 'function') {
            UI.btnSave.onclick();
        } else {
            saveTask();
        }
    });

    UI.modal.addEventListener('click', (e) => {
        if (e.target === UI.modal) toggleModal(false);
    });

    UI.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (typeof UI.btnSave.onclick === 'function') {
                UI.btnSave.onclick();
            } else {
                saveTask();
            }
        }
    });
}

// Calendar Engine
function navigateMonth(dir) {
    state.selectedDate.setMonth(state.selectedDate.getMonth() + dir);
    renderCalendar();
}

function renderCalendar() {
    const year = state.selectedDate.getFullYear();
    const month = state.selectedDate.getMonth();

    UI.monthYear.textContent = `${CONFIG.months[month]}, ${year}`;
    UI.calendarDays.innerHTML = '';

    const first = new Date(year, month, 1).getDay();
    const last = new Date(year, month + 1, 0).getDate();
    const prevLast = new Date(year, month, 0).getDate();

    // Fill prev month days
    for (let i = first - 1; i >= 0; i--) {
        appendDay(prevLast - i, true);
    }

    // Fill current month days
    for (let i = 1; i <= last; i++) {
        const isToday = i === state.currentDate.getDate() && month === state.currentDate.getMonth() && year === state.currentDate.getFullYear();
        const isSelected = i === state.selectedDate.getDate();
        appendDay(i, false, isToday, isSelected);
    }

    // Fill next month days
    const totalCells = first + last;
    const nextFill = totalCells > 35 ? 42 - totalCells : 35 - totalCells;
    for (let i = 1; i <= nextFill; i++) {
        appendDay(i, true);
    }
}

function appendDay(d, isOther, isToday, isSelected) {
    const cell = document.createElement('div');
    cell.className = `day-cell ${isOther ? 'other' : ''} ${isToday ? 'today' : ''} ${isSelected && !isOther ? 'active' : ''}`;
    cell.textContent = d;

    if (!isOther) {
        cell.onclick = () => {
            state.selectedDate.setDate(d);
            renderCalendar();
            renderTasks();
            updateHeader();
        };
    }
    UI.calendarDays.appendChild(cell);
}

// Task Management
function renderTasks() {
    const key = formatDate(state.selectedDate);
    const dayTasks = state.tasks.filter(t => t.date === key);

    // Thêm hệ thống lọc (Filter)
    UI.taskDeck.innerHTML = '';

    // Header nhỏ bên trong danh sách để lọc
    const filterBar = document.createElement('div');
    filterBar.style.cssText = "grid-column: 1/-1; display: flex; gap: 1rem; margin-bottom: 0.5rem; justify-content: flex-start;";
    filterBar.innerHTML = `
        <span style="font-size: 0.8rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Lọc danh mục:</span>
        <button onclick="state.filter = 'all'; renderTasks();" style="border:none; background:none; cursor:pointer; font-size:0.8rem; font-weight:700; color:${!state.filter || state.filter === 'all' ? 'var(--accent-color)' : 'var(--text-secondary)'}">Tất cả</button>
        <button onclick="state.filter = 'pending'; renderTasks();" style="border:none; background:none; cursor:pointer; font-size:0.8rem; font-weight:700; color:${state.filter === 'pending' ? 'var(--accent-color)' : 'var(--text-secondary)'}">Đang chờ</button>
        <button onclick="state.filter = 'completed'; renderTasks();" style="border:none; background:none; cursor:pointer; font-size:0.8rem; font-weight:700; color:${state.filter === 'completed' ? 'var(--accent-color)' : 'var(--text-secondary)'}">Hoàn tất</button>
    `;
    UI.taskDeck.appendChild(filterBar);

    let filtered = dayTasks;
    if (state.filter === 'pending') filtered = dayTasks.filter(t => !t.completed);
    if (state.filter === 'completed') filtered = dayTasks.filter(t => t.completed);

    if (filtered.length === 0) {
        UI.taskDeck.innerHTML += `<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-secondary); opacity: 0.5;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 1rem;">
                <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>Danh sách theo bộ lọc đang trống.</p>
        </div>`;
        return;
    }

    filtered.forEach(t => {
        const card = document.createElement('div');
        card.className = `task-card ${t.completed ? 'completed' : ''}`;

        const priority = getPriority(t);
        const countdownInfo = getCountdown(t.date);

        card.innerHTML = `
            <div class="status-badge ${priority.class}">${priority.label}</div>
            <h3 class="task-title" onclick="editTask('${t.id}')" style="cursor: pointer;">${t.text}</h3>
            ${!t.completed ? `<div class="countdown-box ${countdownInfo.isUrgent ? 'urgent' : ''}" id="countdown-${t.id}">${countdownInfo.text}</div>` : ''}
            <div class="task-meta">
                <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">Nexus ID: ${t.id.slice(-4)}</span>
                <div class="custom-checkbox" onclick="toggleComplete('${t.id}')"></div>
            </div>
            <div style="position: absolute; top: 1rem; right: 1rem; display: flex; gap: 0.5rem;">
                 <div style="cursor: pointer; color: #cbd5e1;" onclick="editTask('${t.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </div>
                <div style="cursor: pointer; color: #cbd5e1;" onclick="deleteTask('${t.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </div>
            </div>
        `;
        UI.taskDeck.appendChild(card);
    });
    updateStats();
}

function updateAllCountdowns() {
    state.tasks.forEach(t => {
        if (t.completed) return;
        const countdownEl = document.getElementById(`countdown-${t.id}`);
        if (!countdownEl) return;

        const countdownInfo = getCountdown(t.date);
        countdownEl.innerText = countdownInfo.text;

        if (countdownInfo.isUrgent) {
            countdownEl.classList.add('urgent');
        } else {
            countdownEl.classList.remove('urgent');
        }
    });
}

function getCountdown(targetDateStr) {
    const now = new Date();
    // Safari Fix: Chuyển đổi dấu gạch ngang sang gạch chéo để tương thích hoàn toàn
    const targetDate = new Date(targetDateStr.replace(/-/g, '/'));
    targetDate.setHours(23, 59, 59, 999);

    const diff = targetDate - now;

    if (diff <= 0) {
        return { text: "⚠️ HẾT HẠN", isUrgent: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    let text = "";
    if (days > 0) text += `${days} Ngày `;
    text += `${hours} Giờ ${mins} Phút ${secs} Giây`;

    const isUrgent = (days === 0 && hours < 3);
    return { text: `Thời gian còn lại: ${text}`, isUrgent };
}

setInterval(updateAllCountdowns, 1000);

function getPriority(task) {
    if (task.completed) return { label: 'Đã hoàn thành', class: 'badge-gray' };

    const today = new Date(); today.setHours(0, 0, 0, 0);
    // Safari Fix: Replace dashes with slashes for more reliable parsing
    const target = new Date(task.date.replace(/-/g, '/'));
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

    if (diff === 0) return { label: 'Hôm nay', class: 'badge-green' };
    if (diff > 7) return { label: 'Tầm nhìn xa', class: 'badge-red' };
    if (diff < 0 || diff <= 3) return { label: 'Ưu tiên cao', class: 'badge-yellow' };
    return { label: 'Kế hoạch', class: 'badge-yellow' };
}

function toggleModal(show, editId = null) {
    UI.modal.classList.toggle('active', show);
    if (show) {
        if (editId) {
            const t = state.tasks.find(tk => tk.id === editId);
            UI.input.value = t.text;
            UI.btnSave.onclick = () => saveTask(editId);
            UI.input.placeholder = "Chỉnh sửa tác vụ...";
        } else {
            UI.input.value = '';
            UI.btnSave.onclick = () => saveTask();
            UI.input.placeholder = "Ví dụ: Họp chiến lược quý 1...";
        }
        UI.input.focus();
    }
}

function saveTask(editId = null) {
    const val = UI.input.value.trim();
    if (!val) return;

    if (editId) {
        state.tasks = state.tasks.map(t => t.id === editId ? { ...t, text: val } : t);
    } else {
        state.tasks.push({
            id: Date.now().toString(),
            text: val,
            date: formatDate(state.selectedDate),
            completed: false
        });
    }

    sync();
    toggleModal(false);
    renderTasks();
}

function editTask(id) {
    toggleModal(true, id);
}

function toggleComplete(id) {
    state.tasks = state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    sync();
    renderTasks();
}

function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    sync();
    renderTasks();
    renderCalendar();
}

function sync() {
    try {
        localStorage.setItem('nexus_tasks', JSON.stringify(state.tasks));
        // Thông báo lưu thành công trên iPhone (vùng an toàn)
        console.log("NexusOS: Data synced successfully.");
    } catch (e) {
        console.error("NexusOS Persistence Error:", e);
        alert("Lỗi lưu trữ: Bộ nhớ của bạn có thể đã đầy hoặc đang ở chế độ duyệt web ẩn danh.");
    }
}

function updateHeader() {
    const day = CONFIG.weekdays[state.selectedDate.getDay()];
    const date = state.selectedDate.getDate();
    const month = state.selectedDate.getMonth() + 1;
    UI.fullDate.textContent = `${day}, ${date} Tháng ${month}, ${state.selectedDate.getFullYear()}`;
    UI.dayLabel.textContent = isAtDate(state.selectedDate, state.currentDate) ? "Chào buổi sáng, Tân" : `Kế hoạch ngày ${date}/${month}`;
}

function updateStats() {
    const month = state.selectedDate.getMonth();
    // Safari Fix cho date-parsing
    const monthTasks = state.tasks.filter(t => new Date(t.date.replace(/-/g, '/')).getMonth() === month);
    const comp = monthTasks.filter(t => t.completed).length;
    UI.statComp.textContent = comp;
    UI.statPend.textContent = monthTasks.length - comp;
}

function formatDate(d) {
    return [d.getFullYear(), (d.getMonth() + 1).toString().padStart(2, '0'), d.getDate().toString().padStart(2, '0')].join('-');
}

function isAtDate(d1, d2) {
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
}

// Start System
init();
