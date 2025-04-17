// Utility Functions
const $ = (selector) => document.querySelector(selector) || null;
const $$ = (selector) => document.querySelectorAll(selector);

// Constants
const API_URL = 'http://localhost/spendly/api/Backend';

// State
let currentUser = null;

// Notify Function
function notify(message, type = 'success') {
    console.log(`Notifying: ${type} - ${message}`);
    const existing = $('#notification');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.id = 'notification';
    div.textContent = message;
    div.className = `notification ${type}`;
    document.body.appendChild(div);
    setTimeout(() => {
        div.classList.add('show');
        setTimeout(() => {
            div.classList.remove('show');
            setTimeout(() => div.remove(), 500);
        }, 4000);
    }, 100);
}

// Initial Setup
async function initApp() {
    console.log('Initializing app');
    const username = sessionStorage.getItem('currentUser');
    if (username) {
        currentUser = { username, id: sessionStorage.getItem('userId') };
        $('#auth-section').classList.add('hidden');
        $('#main-app').classList.remove('hidden');
        await fetchUserData();
        handleNavigation();
    } else {
        showAuth();
    }
}

function showAuth() {
    $('#auth-section').classList.remove('hidden');
    $('#main-app').classList.add('hidden');
    handleAuthNavigation();
}

window.addEventListener('load', initApp);
window.addEventListener('hashchange', () => {
    console.log('Hash changed, currentUser:', currentUser);
    currentUser ? handleNavigation() : handleAuthNavigation();
});

// Auth Navigation
function handleAuthNavigation() {
    const hash = window.location.hash || '';
    console.log('Handling auth navigation, hash:', hash);
    const loginForm = $('#login-form');
    const signupForm = $('#signup-form');
    if (loginForm) loginForm.classList.toggle('hidden', hash === '#signup');
    if (signupForm) signupForm.classList.toggle('hidden', hash !== '#signup');
}

// Login Form Handler
const loginForm = $('#loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = $('#loginUsername').value.trim();
        const password = $('#loginPassword').value.trim();
        const loginBtn = $('#loginBtn');

        if (!username || !password || !loginBtn) {
            console.error('Login form elements missing:', { username, password, loginBtn });
            notify('Login form is incomplete. Check your HTML.', 'error');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.querySelector('.btn-text').textContent = 'Logging In...';
        console.log('Login attempt with:', { username, password });

        try {
            const response = await fetch(`${API_URL}/login.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response error:', errorText);
                throw new Error(`HTTP error! Status: ${response.status}, Text: ${errorText}`);
            }

            const data = await response.json();
            console.log('Login response:', data);

            if (data.status === 'success') {
                sessionStorage.setItem('currentUser', data.user.username);
                sessionStorage.setItem('userId', data.user.id);
                currentUser = { username: data.user.username, id: data.user.id, name: data.user.name };
                window.location.hash = '#dashboard'; // Fixed on April 11th
                notify('Login successful! Redirecting...', 'success');
            } else {
                notify(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            notify('Server error: ' + (error.message || 'Unknown error'), 'error');
        }

        loginBtn.disabled = false;
        loginBtn.querySelector('.btn-text').textContent = 'Log In';
    });
}

// Signup Form Handler
const signupForm = $('#signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = $('#signupUsername').value.trim();
        const name = $('#signupName').value.trim();
        const password = $('#signupPassword').value.trim();
        const phone = $('#signupPhone').value.trim();
        const signupBtn = $('#signupBtn');

        if (!username || !name || !password || !phone || !signupBtn) {
            console.error('Signup form elements missing:', { username, name, password, phone, signupBtn });
            notify('Signup form is incomplete. Check your HTML.', 'error');
            return;
        }

        signupBtn.disabled = true;
        signupBtn.querySelector('.btn-text').textContent = 'Signing Up...';
        console.log('Signup attempt with:', { username, name, phone });

        try {
            const response = await fetch(`${API_URL}/signup.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, name, password, phone })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response error:', errorText);
                throw new Error(`HTTP error! Status: ${response.status}, Text: ${errorText}`);
            }

            const data = await response.json();
            console.log('Signup response:', data);

            if (data.status === 'success') {
                notify(data.message || 'Signup successful! Please log in.', 'success');
                window.location.hash = '';
                signupForm.reset();
            } else {
                notify(data.message || 'Signup failed', 'error');
            }
        } catch (error) {
            console.error('Signup error:', error);
            notify('Server error: ' + (error.message || 'Unknown error'), 'error');
        }

        signupBtn.disabled = false;
        signupBtn.querySelector('.btn-text').textContent = 'Sign Up';
    });
}

// Profile Form Handler
const profileForm = $('#profileForm');
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        const name = $('#profileName').value.trim();
        const phone = $('#profilePhone').value.trim();
        if (!name || !phone) {
            notify('Please fill all fields', 'error');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/profile.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone })
            });
            const data = await response.json();
            console.log('Profile update response:', data);
            if (data.status === 'success') {
                currentUser.name = data.user.name;
                currentUser.phone = data.user.phone;
                currentUser.points = data.user.points;
                await fetchUserData();
                notify('Profile updated!', 'success');
                renderProfile();
                renderDashboard();
            } else {
                notify(data.message, 'error');
            }
        } catch (error) {
            console.error('Profile fetch error:', error);
            notify('Server error: ' + error.message, 'error');
        }
    });
}

// Add Expense Form Handler
const addExpenseForm = $('#addExpenseForm');
if (addExpenseForm) {
    addExpenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        const date = $('#expenseDate').value;
        const category = $('#expenseCategory').value;
        const amount = parseFloat($('#expenseAmount').value);
        const description = $('#expenseDescription').value.trim();
        if (!date || !category || isNaN(amount) || amount <= 0) {
            notify('Please provide valid expense details', 'error');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/expenses.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.id, date, category, amount, description })
            });
            const data = await response.json();
            console.log('Expense add response:', data);
            if (data.status === 'success') {
                await fetchUserData();
                addExpenseForm.reset();
                notify(data.message || 'Expense added', 'success');
                renderExpenses();
                renderDashboard();
            } else {
                notify(data.message, 'error');
            }
        } catch (error) {
            console.error('Expense fetch error:', error);
            notify('Server error: ' + error.message, 'error');
        }
    });
}

// Add Goal Form Handler
const addGoalForm = $('#addGoalForm');
if (addGoalForm) {
    addGoalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        const description = $('#goalDescription').value.trim();
        const target = parseFloat($('#goalTarget').value);
        const reward = parseInt($('#goalReward').value);
        if (!description || isNaN(target) || isNaN(reward) || target <= 0 || reward <= 0) {
            notify('Invalid goal details', 'error');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/goals.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.id, description, target, reward_points: reward })
            });
            const data = await response.json();
            console.log('Goal add response:', data);
            if (data.status === 'success') {
                await fetchUserData();
                addGoalForm.reset();
                notify(data.message || 'Goal added', 'success');
                renderGoals();
                renderDashboard();
            } else {
                notify(data.message, 'error');
            }
        } catch (error) {
            console.error('Goal fetch error:', error);
            notify('Server error: ' + error.message, 'error');
        }
    });
}

// Navigation Handler
async function handleNavigation() {
    const hash = window.location.hash.substring(1) || 'profile';
    console.log('Handling navigation, hash:', hash);
    const sections = ['profile', 'dashboard', 'support', 'goals', 'expenses', 'calendar'];
    sections.forEach(section => {
        const el = $(`#${section}`);
        if (el) el.classList.add('hidden');
    });
    if (hash === 'logout') {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('userId');
        currentUser = null;
        window.location.hash = '';
        notify('Logged out successfully!', 'success');
        $('#main-app').classList.add('hidden');
        $('#auth-section').classList.remove('hidden');
        handleAuthNavigation();
    } else if (sections.includes(hash)) {
        const sectionEl = $(`#${hash}`);
        if (sectionEl) {
            sectionEl.classList.remove('hidden');
            await fetchUserData();
            await renderSection(hash);
        } else {
            console.error(`Section #${hash} not found`);
        }
    } else {
        const profileEl = $('#profile');
        if (profileEl) {
            profileEl.classList.remove('hidden');
            await fetchUserData();
            await renderSection('profile');
        } else {
            console.error('Profile section not found');
        }
    }
    $$('nav a').forEach(link => {
        if (link) link.classList.toggle('active', link.getAttribute('href') === `#${hash}`);
    });
}

// Data Management
async function fetchUserData() {
    try {
        const response = await fetch(`${API_URL}/profile.php`, { method: 'GET' });
        const data = await response.json();
        console.log('fetchUserData response:', data);
        if (data.status === 'success') {
            currentUser.name = data.user.name;
            currentUser.phone = data.user.phone;
            currentUser.points = data.user.points;
            await fetchExpenses();
            await fetchGoals();
        } else {
            notify(data.message || 'Failed to fetch user data', 'error');
        }
    } catch (error) {
        console.error('fetchUserData error:', error);
        notify('Server error: ' + error.message, 'error');
    }
}

async function fetchExpenses() {
    try {
        const response = await fetch(`${API_URL}/expenses.php?user_id=${currentUser.id}`, { method: 'GET' });
        const data = await response.json();
        console.log('fetchExpenses response:', data);
        if (data.status === 'success' && data.expenses) currentUser.expenses = data.expenses;
    } catch (error) {
        console.error('fetchExpenses error:', error);
        notify('Server error: ' + error.message, 'error');
    }
}

async function fetchGoals() {
    try {
        const response = await fetch(`${API_URL}/goals.php?user_id=${currentUser.id}`, { method: 'GET' });
        const data = await response.json();
        console.log('fetchGoals response:', data);
        if (data.status === 'success' && data.goals) currentUser.goals = data.goals;
    } catch (error) {
        console.error('fetchGoals error:', error);
        notify('Server error: ' + error.message, 'error');
    }
}

// Render Functions
async function renderSection(section) {
    if (!currentUser) {
        console.error('No current user found during render');
        notify('Session expired, please log in', 'error');
        showAuth();
        return;
    }
    console.log(`Rendering section: ${section}`);
    switch (section) {
        case 'profile': renderProfile(); break;
        case 'dashboard': renderDashboard(); break;
        case 'support': renderSupport(); break;
        case 'goals': renderGoals(); break;
        case 'expenses': renderExpenses(); break;
        case 'calendar': renderCalendar(); break;
        default: console.warn(`Unknown section: ${section}`);
    }
}

function renderProfile() {
    if (!currentUser || !$('#profileName') || !$('#profilePhone')) return;
    $('#profileName').value = currentUser.name || '';
    $('#profilePhone').value = currentUser.phone || '';
}

function renderDashboard() {
    console.log('Rendering dashboard for user:', currentUser);
    if (!currentUser || !$('#welcomeName') || !$('#totalExpenses') || !$('#currentPointsDash') || !$('#goalsProgress') || !$('#expensesChart')) return;
    $('#welcomeName').textContent = currentUser.name || 'User';
    const totalExpenses = (currentUser.expenses || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0).toFixed(2);
    $('#totalExpenses').textContent = isNaN(totalExpenses) ? '0.00' : totalExpenses;
    $('#currentPointsDash').textContent = currentUser.points || 0;
    $('#goalsProgress').innerHTML = (currentUser.goals || []).map(goal => {
        const current = (goal.savings || []).reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
        const progress = ((current / (parseFloat(goal.target) || 1)) * 100).toFixed(2);
        return `
            <div class="dashboard-goal animate-in">
                <h4>${goal.description || 'Goal'}</h4>
                <div class="progress-bar">
                    <div class="progress" style="width: ${progress}%;"></div>
                </div>
                <p>Progress: ${progress}% ($${current.toFixed(2)} / $${parseFloat(goal.target || 0).toFixed(2)})</p>
            </div>
        `;
    }).join('');
    const categories = {};
    (currentUser.expenses || []).forEach(e => categories[e.category] = (categories[e.category] || 0) + (parseFloat(e.amount) || 0));
    new Chart($('#expensesChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderSupport() {
    if (!currentUser || !$('#supportContent')) return;
    $('#supportContent').innerHTML = `
        <h2 class="support-title">Support Center</h2>
        <div class="support-section">
            <h3>Frequently Asked Questions</h3>
            <ul class="faq-list">
                <li><strong>How do I track my expenses?</strong> Add expenses via the 'Expenses' section with date, category, and amount.</li>
                <li><strong>How do I set a goal?</strong> Use the 'Goals' section to add a target amount and reward points.</li>
                <li><strong>What if I forget my password?</strong> Contact us below to reset it.</li>
            </ul>
            <h3>Contact Us</h3>
            <p>Email: support@spendly.com | Phone: (555) 123-4567</p>
            <h3>Feedback Form</h3>
            <textarea id="feedbackText" placeholder="Share your feedback..."></textarea>
            <button id="submitBtn" class="support-btn">Submit Feedback</button>
        </div>
    `;
    $('#submitBtn').addEventListener('click', () => {
        const feedback = $('#feedbackText').value.trim();
        if (feedback) {
            notify('Thank you for your feedback!', 'success');
            $('#feedbackText').value = '';
        } else {
            notify('Please enter feedback', 'error');
        }
    });
}

function renderGoals() {
    if (!currentUser || !$('#goalsList') || !$('#currentPoints')) return;
    $('#goalsList').innerHTML = (currentUser.goals || []).map(goal => {
        const current = (goal.savings || []).reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
        const progress = ((current / (parseFloat(goal.target) || 1)) * 100).toFixed(2);
        return `
            <div class="animate-in">
                <h4>${goal.description || 'Goal'}</h4>
                <p>Target: $${parseFloat(goal.target || 0).toFixed(2)}</p>
                <p>Current: $${current.toFixed(2)}</p>
                <p>Progress: ${progress}%</p>
                <progress value="${current}" max="${parseFloat(goal.target || 1)}"></progress>
            </div>
        `;
    }).join('');
    $('#currentPoints').textContent = currentUser.points || 0;
}

function renderExpenses() {
    if (!currentUser || !$('#expensesList')) return;
    $('#expensesList').innerHTML = (currentUser.expenses || []).map(expense => `
        <div class="animate-in expense-item">
            <p><i class="fas fa-calendar"></i> ${expense.date || 'N/A'}</p>
            <p><i class="fas fa-tag"></i> ${expense.category || 'N/A'}</p>
            <p><i class="fas fa-coins"></i> $${parseFloat(expense.amount || 0).toFixed(2)}</p>
            <p><i class="fas fa-comment"></i> ${expense.description || 'N/A'}</p>
        </div>
    `).join('');
}

function renderCalendar() {
    if (!currentUser || !$('#calendarContainer')) return;
    $('#calendarContainer').innerHTML = generateCalendar();
    $$('#calendarContainer td[data-date]').forEach(td => {
        td.addEventListener('click', () => {
            $$('#calendarContainer td').forEach(t => t.classList.remove('selected'));
            td.classList.add('selected');
            showCalendarDetails(td.getAttribute('data-date'));
        });
    });
}

function generateCalendar() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '<table><tr><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr><tr>';
    for (let i = 0; i < firstDay; i++) html += '<td></td>';
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        html += `<td data-date="${dateStr}">${day}</td>`;
        if ((firstDay + day) % 7 === 0 && day < daysInMonth) html += '</tr><tr>';
    }
    while ((firstDay + daysInMonth) % 7 !== 0) {
        html += '<td></td>';
        if ((firstDay + daysInMonth) % 7 === 0) html += '</tr>';
    }
    html += '</table>';
    return html;
}

function showCalendarDetails(date) {
    if (!currentUser || !$('#selectedDate') || !$('#savingsList') || !$('#savingGoal') || !$('#calendarDetails')) return;
    $('#selectedDate').textContent = date;
    const savingsForDate = [];
    (currentUser.goals || []).forEach(goal => {
        (goal.savings || []).forEach(saving => {
            if (saving.date === date) savingsForDate.push({ goal: goal.description, amount: saving.amount });
        });
    });
    $('#savingsList').innerHTML = savingsForDate.map(s => `<p>${s.goal || 'Goal'}: $${parseFloat(s.amount || 0).toFixed(2)}</p>`).join('');
    $('#savingGoal').innerHTML = (currentUser.goals || []).map(g => `<option value="${g.id}">${g.description || 'Goal'}</option>`).join('');
    $('#calendarDetails').classList.remove('hidden');
}