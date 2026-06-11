/**
 * WorkSync Dashboard Interactivity & State Management
 * Inspired by modern SaaS tools (Vercel, Linear, Stripe).
 */

document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // APPLICATION STATE
    // ---------------------------------------------------------
    let employees = [];
    let searchQuery = '';
    let selectedDept = 'all';

    // ---------------------------------------------------------
    // DOM ELEMENTS
    // ---------------------------------------------------------
    const employeeGrid = document.getElementById('employee-grid');
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const toastContainer = document.getElementById('toast-container');

    // Stat Values
    const statTotal = document.getElementById('stat-total');
    const statAvailable = document.getElementById('stat-available');
    const statBusy = document.getElementById('stat-busy');
    const statPercentage = document.getElementById('stat-percentage');
    const trendBadgeContainer = document.getElementById('trend-badge-container');
    const trendValue = document.getElementById('trend-value');

    // Header Stat Values
    const headerStatTotal = document.getElementById('header-stat-total');
    const headerStatAvailable = document.getElementById('header-stat-available');
    const headerStatBusy = document.getElementById('header-stat-busy');

    // Recent Activity List
    const recentActivityList = document.getElementById('recent-activity-list');

    // Department Counts
    const deptCountEng = document.getElementById('dept-count-eng');
    const deptCountDes = document.getElementById('dept-count-des');
    const deptCountMkt = document.getElementById('dept-count-mkt');
    const deptCountHr = document.getElementById('dept-count-hr');

    // ---------------------------------------------------------
    // THEME MANAGEMENT (DARK / LIGHT)
    // ---------------------------------------------------------
    function initTheme() {
        const savedTheme = localStorage.getItem('workSyncTheme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const targetTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', targetTheme);
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('workSyncTheme', nextTheme);
        
        // Show subtle notification
        showToast(`Switched to ${nextTheme} mode`);
    });

    // ---------------------------------------------------------
    // AVATAR GENERATION
    // ---------------------------------------------------------
    const AVATAR_COLORS = [
        '#2563eb', // Blue
        '#059669', // Emerald
        '#d97706', // Amber
        '#7c3aed', // Violet
        '#db2777', // Pink
        '#0d9488', // Teal
        '#ea580c', // Orange
        '#4f46e5'  // Indigo
    ];

    function getInitials(name) {
        if (!name) return '';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    function getAvatarColor(name) {
        if (!name) return AVATAR_COLORS[0];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % AVATAR_COLORS.length;
        return AVATAR_COLORS[index];
    }

    // ---------------------------------------------------------
    // TIME FORMATTING (RELATIVE)
    // ---------------------------------------------------------
    function formatRelativeTime(isoString) {
        if (!isoString) return 'Never';
        const date = new Date(isoString);
        const now = new Date();
        const secondsDiff = Math.max(0, Math.floor((now - date) / 1000));

        if (secondsDiff < 5) return 'Just now';
        if (secondsDiff < 60) return `${secondsDiff}s ago`;

        const minutesDiff = Math.floor(secondsDiff / 60);
        if (minutesDiff < 60) return `${minutesDiff}m ago`;

        const hoursDiff = Math.floor(minutesDiff / 60);
        if (hoursDiff < 24) return `${hoursDiff}h ago`;

        // Default local date format for longer timeframes
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + 
               date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }

    // ---------------------------------------------------------
    // DYNAMIC METRIC CALCULATIONS
    // ---------------------------------------------------------
    function updateMetrics() {
        const total = employees.length;
        const available = employees.filter(e => e.is_available).length;
        const busy = employees.filter(e => !e.is_available).length;
        const percent = total > 0 ? Math.round((available / total) * 100) : 0;

        // Animate counter updates gently
        statTotal.textContent = total;
        statAvailable.textContent = available;
        statBusy.textContent = busy;
        statPercentage.textContent = `${percent}%`;

        // Update Trend Card Badge dynamically
        if (percent >= 60) {
            trendBadgeContainer.className = 'trend-badge positive';
            trendValue.textContent = '+2.4%';
            trendBadgeContainer.querySelector('.trend-arrow').textContent = '↑';
        } else {
            trendBadgeContainer.className = 'trend-badge negative';
            trendValue.textContent = '-1.2%';
            trendBadgeContainer.querySelector('.trend-arrow').textContent = '↓';
        }

        // Calculate and update department distribution counts
        const deptCounts = {
            'Engineering': 0,
            'Design': 0,
            'Marketing': 0,
            'HR': 0
        };

        employees.forEach(e => {
            if (deptCounts[e.department] !== undefined) {
                deptCounts[e.department]++;
            }
        });

        deptCountEng.textContent = deptCounts['Engineering'];
        deptCountDes.textContent = deptCounts['Design'];
        deptCountMkt.textContent = deptCounts['Marketing'];
        deptCountHr.textContent = deptCounts['HR'];

        // Update header badges
        if (headerStatTotal) headerStatTotal.textContent = total;
        if (headerStatAvailable) headerStatAvailable.textContent = available;
        if (headerStatBusy) headerStatBusy.textContent = busy;

        // Render Recent Activity panel
        updateRecentActivity();
    }

    // ---------------------------------------------------------
    // RECENT ACTIVITY RENDERING
    // ---------------------------------------------------------
    function updateRecentActivity() {
        if (!recentActivityList) return;

        // Sort employees by last_updated descending
        const sorted = [...employees].sort((a, b) => {
            return new Date(b.last_updated) - new Date(a.last_updated);
        });

        const top5 = sorted.slice(0, 5);
        recentActivityList.innerHTML = '';

        if (top5.length === 0) {
            recentActivityList.innerHTML = '<div class="activity-empty">No recent activity</div>';
            return;
        }

        top5.forEach(emp => {
            const item = document.createElement('div');
            item.className = 'activity-item';

            const statusClass = emp.is_available ? 'available' : 'busy';
            const statusText = emp.is_available ? 'Available' : 'Busy';
            
            // SVG clock icon
            const clockIcon = `
                <svg class="clock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
            `;

            item.innerHTML = `
                <div class="activity-details">
                    <span class="activity-name">${emp.name}</span>
                    <span class="activity-arrow">→</span>
                    <span class="activity-status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="activity-time-wrapper">
                    ${clockIcon}
                    <span class="activity-time" data-time="${emp.last_updated}">${formatRelativeTime(emp.last_updated)}</span>
                </div>
            `;
            recentActivityList.appendChild(item);
        });
    }

    // ---------------------------------------------------------
    // SKELETON LOADER
    // ---------------------------------------------------------
    function renderSkeletons(count = 6) {
        employeeGrid.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'employee-card skeleton-card';
            skeleton.innerHTML = `
                <div class="card-header">
                    <div class="skeleton-avatar skeleton-animation"></div>
                    <div class="info-container">
                        <div class="skeleton-title skeleton-animation"></div>
                        <div class="skeleton-subtitle skeleton-animation"></div>
                        <div class="skeleton-badge skeleton-animation"></div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="skeleton-badge skeleton-animation" style="width: 80px;"></div>
                    <div class="skeleton-btn skeleton-animation"></div>
                </div>
                <div class="card-footer">
                    <div class="skeleton-subtitle skeleton-animation" style="width: 100px; margin-bottom: 0;"></div>
                </div>
            `;
            employeeGrid.appendChild(skeleton);
        }
    }

    // ---------------------------------------------------------
    // EMPTY STATE RENDERER
    // ---------------------------------------------------------
    function renderEmptyState() {
        employeeGrid.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'empty-state';

        let title = 'No employees found';
        let desc = 'The employee directory is currently empty.';

        if (searchQuery.trim() !== '') {
            title = 'No results found';
            desc = `No employee matching "${searchQuery}" was found. Try searching for a different name.`;
        } else if (selectedDept !== 'all') {
            title = `No employees in ${selectedDept}`;
            desc = `There are currently no team members assigned to the ${selectedDept} department.`;
        }

        card.innerHTML = `
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <h3 class="empty-title">${title}</h3>
            <p class="empty-desc">${desc}</p>
        `;
        employeeGrid.appendChild(card);
    }

    // ---------------------------------------------------------
    // RENDER EMPLOYEE GRID
    // ---------------------------------------------------------
    function renderEmployeeGrid() {
        const query = searchQuery.toLowerCase().trim();
        const filtered = employees.filter(e => {
            const matchesSearch = e.name.toLowerCase().includes(query);
            const matchesDept = selectedDept === 'all' || e.department === selectedDept;
            return matchesSearch && matchesDept;
        });

        if (filtered.length === 0) {
            renderEmptyState();
            return;
        }

        employeeGrid.innerHTML = '';
        filtered.forEach(employee => {
            const initials = getInitials(employee.name);
            const avatarColor = getAvatarColor(employee.name);
            const statusClass = employee.is_available ? 'available' : 'busy';
            const statusText = employee.is_available ? 'Available' : 'Busy';
            const checkedAttr = employee.is_available ? 'checked' : '';

            const card = document.createElement('div');
            card.className = 'employee-card';
            card.setAttribute('data-id', employee.id);
            card.innerHTML = `
                <div class="card-header">
                    <div class="avatar" style="background-color: ${avatarColor}">${initials}</div>
                    <div class="info-container">
                        <h4 class="emp-name" title="${employee.name}">${employee.name}</h4>
                        <span class="emp-role" title="${employee.role}">${employee.role}</span>
                        <span class="emp-dept">${employee.department}</span>
                    </div>
                </div>
                <div class="card-body">
                    <span class="status-badge ${statusClass}">
                        <span class="status-badge-dot"></span>
                        <span class="status-badge-text">${statusText}</span>
                    </span>
                    <label class="switch-label">
                        <input type="checkbox" class="toggle-status-checkbox" ${checkedAttr}>
                        <span class="switch-slider"></span>
                    </label>
                </div>
                <div class="card-footer">
                    <span class="timestamp" data-time="${employee.last_updated}">Updated ${formatRelativeTime(employee.last_updated)}</span>
                </div>
            `;

            // Attach event listener to checkbox toggle
            const checkbox = card.querySelector('.toggle-status-checkbox');
            checkbox.addEventListener('change', () => handleStatusToggle(employee.id, checkbox));

            employeeGrid.appendChild(card);
        });
    }

    // ---------------------------------------------------------
    // STATUS TOGGLE HANDLER (API Post + Local State Update)
    // ---------------------------------------------------------
    function handleStatusToggle(employeeId, checkbox) {
        // Disable the checkbox to prevent rapid multiple clicks
        checkbox.disabled = true;

        const targetState = checkbox.checked;
        
        fetch('/toggle-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: employeeId,
                is_available: targetState
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.employee) {
                const updatedEmp = data.employee;
                
                // Update local memory state
                const index = employees.findIndex(e => e.id === employeeId);
                if (index !== -1) {
                    employees[index] = updatedEmp;
                }

                // Update metrics counters
                updateMetrics();

                // Update the specific card DOM directly to avoid a full layout reflow
                const card = document.querySelector(`.employee-card[data-id="${employeeId}"]`);
                if (card) {
                    // Update availability badge
                    const badge = card.querySelector('.status-badge');
                    const badgeText = badge.querySelector('.status-badge-text');
                    
                    if (updatedEmp.is_available) {
                        badge.className = 'status-badge available';
                        badgeText.textContent = 'Available';
                    } else {
                        badge.className = 'status-badge busy';
                        badgeText.textContent = 'Busy';
                    }

                    // Update timestamp
                    const timestampSpan = card.querySelector('.timestamp');
                    timestampSpan.setAttribute('data-time', updatedEmp.last_updated);
                    timestampSpan.textContent = `Updated ${formatRelativeTime(updatedEmp.last_updated)}`;
                }

                // Show dynamic success toast notification
                const statusString = updatedEmp.is_available ? 'Available' : 'Busy';
                showToast(`${updatedEmp.name} is now ${statusString}`);
            } else {
                throw new Error(data.error || 'Failed to toggle status');
            }
        })
        .catch(err => {
            console.error('Error toggling employee status:', err);
            // Revert checkout state
            checkbox.checked = !targetState;
            showToast('Failed to update employee status. Please try again.', 'error');
        })
        .finally(() => {
            // Re-enable checkbox
            checkbox.disabled = false;
        });
    }

    // ---------------------------------------------------------
    // TOAST NOTIFICATION UTILITY
    // ---------------------------------------------------------
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        
        const isError = type === 'error';
        const iconSvg = isError ? 
            `<svg class="toast-success-icon" style="color: var(--status-busy-dot)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
             </svg>` : 
            `<svg class="toast-success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
             </svg>`;

        toast.innerHTML = `
            <div class="toast-content">
                ${iconSvg}
                <span>${message}</span>
            </div>
            <button class="toast-close-btn" aria-label="Close notification">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;

        // Attach dismiss handler
        const closeBtn = toast.querySelector('.toast-close-btn');
        closeBtn.addEventListener('click', () => dismissToast(toast));

        toastContainer.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            dismissToast(toast);
        }, 4000);
    }

    function dismissToast(toast) {
        if (!toast.parentNode) return;
        toast.classList.add('removing');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }

    // ---------------------------------------------------------
    // FILTER & SEARCH HANDLERS
    // ---------------------------------------------------------
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderEmployeeGrid();
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active styling
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Apply filter
            selectedDept = btn.getAttribute('data-dept');
            renderEmployeeGrid();
        });
    });

    // ---------------------------------------------------------
    // RELATIVE TIMESTAMP AUTO-REFRESHER
    // ---------------------------------------------------------
    // Periodically update the relative timestamps of cards in-place
    setInterval(() => {
        const timestampElements = document.querySelectorAll('.timestamp');
        timestampElements.forEach(el => {
            const isoString = el.getAttribute('data-time');
            if (isoString) {
                el.textContent = `Updated ${formatRelativeTime(isoString)}`;
            }
        });

        const activityTimeElements = document.querySelectorAll('.activity-time');
        activityTimeElements.forEach(el => {
            const isoString = el.getAttribute('data-time');
            if (isoString) {
                el.textContent = formatRelativeTime(isoString);
            }
        });
    }, 10000); // refresh every 10 seconds for real-time responsiveness

    // ---------------------------------------------------------
    // DATA INITIALIZATION (PAGE LOAD)
    // ---------------------------------------------------------
    initTheme();
    renderSkeletons(8);

    // Fetch employee data
    fetch('/employees')
        .then(res => {
            if (!res.ok) throw new Error('Failed to load employee list');
            return res.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            employees = data;
            updateMetrics();
            renderEmployeeGrid();
        })
        .catch(err => {
            console.error('Error fetching employees:', err);
            employeeGrid.innerHTML = '';
            
            const errorCard = document.createElement('div');
            errorCard.className = 'empty-state';
            errorCard.innerHTML = `
                <svg class="empty-icon" style="color: var(--status-busy-dot)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h3 class="empty-title">Connection failed</h3>
                <p class="empty-desc">Could not synchronize employee availability from database server. Check backend console logs.</p>
            `;
            employeeGrid.appendChild(errorCard);
            showToast('Unable to connect to WorkSync server.', 'error');
        });
});
