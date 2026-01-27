/**
 * Portal SPA - The AIgnc Client Portal
 * Vanilla JS single-page application
 */

(function () {
  'use strict';

  // State
  let currentUser = null;
  let currentView = 'overview';
  let token = null;

  // API helper
  async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api${path}`, {
      ...options,
      headers: { ...headers, ...options.headers },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (res.status === 401) {
      // Try refresh
      const refreshed = await refreshToken();
      if (!refreshed) {
        logout();
        return null;
      }
      headers['Authorization'] = `Bearer ${token}`;
      const retryRes = await fetch(`/api${path}`, {
        ...options,
        headers: { ...headers, ...options.headers },
        body: options.body ? JSON.stringify(options.body) : undefined
      });
      return retryRes.json();
    }

    return res.json();
  }

  async function refreshToken() {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') })
      });
      const data = await res.json();
      if (data.success) {
        token = data.token;
        localStorage.setItem('token', data.token);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        return true;
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  // Toast notifications
  function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Initialize
  async function init() {
    // Check for token in URL (OAuth redirect)
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) {
      token = params.get('token');
      localStorage.setItem('token', token);
      window.history.replaceState({}, '', '/portal');
    }

    if (params.get('verified') === 'true') {
      setTimeout(() => showToast('Email verified successfully!'), 500);
    }

    // Get token from storage
    token = token || localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Fetch current user
    const data = await api('/auth/me');
    if (!data || !data.success) {
      window.location.href = '/login';
      return;
    }

    currentUser = data.user;
    render();
    navigate(window.location.hash.slice(1) || 'overview');
  }

  // Navigation
  function navigate(view) {
    currentView = view || 'overview';
    window.location.hash = currentView;

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === currentView);
    });

    // Update topbar title
    const titles = {
      overview: 'Dashboard',
      executions: 'Executions',
      billing: 'Billing',
      profile: 'Profile & Settings',
      activity: 'Activity Log'
    };
    const topbarTitle = document.querySelector('.topbar-title');
    if (topbarTitle) topbarTitle.textContent = titles[currentView] || 'Dashboard';

    // Render view
    const content = document.getElementById('viewContent');
    if (!content) return;

    content.innerHTML = '<div class="page-loading"><div class="loading-spinner"></div></div>';

    switch (currentView) {
      case 'overview': renderOverview(content); break;
      case 'executions': renderExecutions(content); break;
      case 'billing': renderBilling(content); break;
      case 'profile': renderProfile(content); break;
      case 'activity': renderActivity(content); break;
      default: renderOverview(content);
    }
  }

  function logout() {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // Main render
  function render() {
    const app = document.getElementById('app');
    const initials = currentUser
      ? (currentUser.firstName[0] + currentUser.lastName[0]).toUpperCase()
      : '??';

    app.innerHTML = `
      <div class="portal-layout">
        <div class="sidebar-overlay" id="sidebarOverlay"></div>
        <aside class="portal-sidebar" id="sidebar">
          <div class="sidebar-header">
            <a href="/" class="sidebar-logo">THE AI<span class="accent">GNC</span></a>
            <div class="sidebar-user">
              <div class="sidebar-avatar">${initials}</div>
              <div class="sidebar-user-info">
                <div class="sidebar-user-name">${currentUser.fullName}</div>
                <div class="sidebar-user-id">${currentUser.aigncId || ''}</div>
              </div>
            </div>
          </div>
          <nav class="sidebar-nav">
            <div class="nav-section-label">Main</div>
            <a class="nav-item active" data-view="overview"><i class="fas fa-th-large"></i> Overview</a>
            <a class="nav-item" data-view="executions"><i class="fas fa-play-circle"></i> Executions</a>
            <a class="nav-item" data-view="billing"><i class="fas fa-credit-card"></i> Billing</a>
            <div class="nav-section-label">Account</div>
            <a class="nav-item" data-view="profile"><i class="fas fa-user-cog"></i> Profile & Settings</a>
            <a class="nav-item" data-view="activity"><i class="fas fa-shield-alt"></i> Activity</a>
          </nav>
          <div class="sidebar-footer">
            <a class="nav-item" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Sign Out</a>
          </div>
        </aside>
        <main class="portal-main">
          <header class="portal-topbar">
            <div style="display:flex;align-items:center;gap:12px;">
              <button class="mobile-menu-btn" id="mobileMenuBtn"><i class="fas fa-bars"></i></button>
              <h1 class="topbar-title">Dashboard</h1>
            </div>
            <div class="topbar-actions">
              <button class="topbar-btn" onclick="window.open('/', '_blank')"><i class="fas fa-external-link-alt"></i> Website</button>
            </div>
          </header>
          <div class="portal-content" id="viewContent">
            <div class="page-loading"><div class="loading-spinner"></div></div>
          </div>
        </main>
      </div>
    `;

    // Bind nav events
    document.querySelectorAll('.nav-item[data-view]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(el.dataset.view);
        closeMobileMenu();
      });
    });

    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Mobile menu
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const overlay = document.getElementById('sidebarOverlay');
    mobileBtn.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
      overlay.classList.toggle('show');
    });
    overlay.addEventListener('click', closeMobileMenu);
  }

  function closeMobileMenu() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
  }

  // ========================
  // Views
  // ========================

  async function renderOverview(container) {
    const data = await api('/portal/overview');
    if (!data || !data.success) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error loading dashboard</h3></div>';
      return;
    }

    const { overview } = data;
    const plan = currentUser.subscription?.plan || 'trial';
    const status = currentUser.subscription?.status || 'active';

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card subscription-card">
          <div class="stat-icon" style="background:rgba(255,255,255,0.2);color:white;"><i class="fas fa-crown"></i></div>
          <div>
            <div class="stat-value" style="color:white;">${capitalize(plan)}</div>
            <div class="stat-label">Current Plan - ${capitalize(status)}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon cyan"><i class="fas fa-play-circle"></i></div>
          <div>
            <div class="stat-value">${overview.stats.totalExecutions}</div>
            <div class="stat-label">Recent Executions</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon success"><i class="fas fa-receipt"></i></div>
          <div>
            <div class="stat-value">${overview.stats.recentPayments}</div>
            <div class="stat-label">Payments</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon warning"><i class="fas fa-history"></i></div>
          <div>
            <div class="stat-value">${overview.stats.activityEvents}</div>
            <div class="stat-label">Activity Events</div>
          </div>
        </div>
      </div>

      <div class="section-grid">
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Recent Executions</div>
              <div class="card-subtitle">Latest workflow runs</div>
            </div>
            <button class="btn btn-sm btn-outline" onclick="window.location.hash='executions'">View All</button>
          </div>
          ${overview.recentExecutions.length === 0
        ? '<div class="empty-state"><i class="fas fa-inbox"></i><h3>No executions yet</h3><p>Workflow executions will appear here</p></div>'
        : `<div class="table-wrapper"><table>
              <thead><tr><th>Workflow</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>${overview.recentExecutions.slice(0, 5).map(e => `
                <tr>
                  <td>${e.workflowName || e.workflowId}</td>
                  <td><span class="badge ${e.status === 'success' ? 'success' : e.status === 'error' ? 'error' : 'neutral'}">${e.status}</span></td>
                  <td>${formatDate(e.startedAt || e.createdAt)}</td>
                </tr>`).join('')}
              </tbody>
            </table></div>`}
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Account Info</div>
              <div class="card-subtitle">Your account details</div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--portal-text-secondary);">AIGNC ID</span>
              <span style="font-family:monospace;font-weight:600;">${currentUser.aigncId || 'N/A'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--portal-text-secondary);">Email</span>
              <span>${currentUser.email}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--portal-text-secondary);">Organization</span>
              <span>${currentUser.organization?.name || 'N/A'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--portal-text-secondary);">Verified</span>
              <span class="badge ${currentUser.isVerified ? 'success' : 'warning'}">${currentUser.isVerified ? 'Yes' : 'Pending'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--portal-text-secondary);">Member Since</span>
              <span>${formatDate(currentUser.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function renderExecutions(container) {
    let data;
    try {
      data = await api('/n8n/executions');
    } catch (e) {
      data = null;
    }

    const executions = data?.success ? (data.data?.data || data.data || []) : [];

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Workflow Executions</div>
            <div class="card-subtitle">View your n8n workflow execution history</div>
          </div>
        </div>
        ${executions.length === 0
        ? `<div class="empty-state">
              <i class="fas fa-play-circle"></i>
              <h3>No executions found</h3>
              <p>${!data?.success ? 'Unable to connect to n8n. Please check your subscription.' : 'Workflow executions will appear here once your workflows run.'}</p>
            </div>`
        : `<div class="table-wrapper"><table>
            <thead><tr><th>ID</th><th>Workflow</th><th>Status</th><th>Started</th><th>Finished</th></tr></thead>
            <tbody>${executions.map(e => `
              <tr>
                <td style="font-family:monospace;font-size:0.8rem;">${e.id || e.executionId || '-'}</td>
                <td>${e.workflowData?.name || e.workflowId || '-'}</td>
                <td><span class="badge ${e.status === 'success' ? 'success' : e.status === 'error' ? 'error' : e.status === 'running' ? 'info' : 'neutral'}">${e.status || 'unknown'}</span></td>
                <td>${formatDate(e.startedAt)}</td>
                <td>${formatDate(e.stoppedAt || e.finishedAt)}</td>
              </tr>`).join('')}
            </tbody>
          </table></div>`}
      </div>
    `;
  }

  async function renderBilling(container) {
    const data = await api('/billing/status');
    const sub = data?.success ? data.subscription : currentUser.subscription;
    const payments = data?.success ? data.payments : [];

    container.innerHTML = `
      <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
        <div class="stat-card subscription-card">
          <div class="stat-icon" style="background:rgba(255,255,255,0.2);color:white;"><i class="fas fa-crown"></i></div>
          <div>
            <div class="stat-value" style="color:white;">${capitalize(sub?.plan || 'trial')}</div>
            <div class="stat-label">Current Plan</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon ${sub?.status === 'active' ? 'success' : 'warning'}">
            <i class="fas fa-${sub?.status === 'active' ? 'check-circle' : 'exclamation-triangle'}"></i>
          </div>
          <div>
            <div class="stat-value">${capitalize(sub?.status || 'unknown')}</div>
            <div class="stat-label">Subscription Status</div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:24px;">
        <div class="card-header">
          <div class="card-title">Subscription Management</div>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <button class="btn btn-primary" id="upgradeBtn"><i class="fas fa-arrow-up"></i> Upgrade Plan</button>
          <button class="btn btn-outline" id="portalBtn"><i class="fas fa-external-link-alt"></i> Manage Billing</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Payment History</div>
            <div class="card-subtitle">Recent transactions</div>
          </div>
        </div>
        ${payments.length === 0
        ? '<div class="empty-state"><i class="fas fa-receipt"></i><h3>No payments yet</h3></div>'
        : `<div class="table-wrapper"><table>
            <thead><tr><th>Date</th><th>Amount</th><th>Plan</th><th>Status</th><th>Invoice</th></tr></thead>
            <tbody>${payments.map(p => `
              <tr>
                <td>${formatDate(p.createdAt)}</td>
                <td>$${(p.amount / 100).toFixed(2)}</td>
                <td>${capitalize(p.plan)}</td>
                <td><span class="badge ${p.status === 'succeeded' ? 'success' : p.status === 'failed' ? 'error' : 'neutral'}">${p.status}</span></td>
                <td>${p.invoiceUrl ? `<a href="${p.invoiceUrl}" target="_blank" class="btn btn-sm btn-outline">View</a>` : '-'}</td>
              </tr>`).join('')}
            </tbody>
          </table></div>`}
      </div>
    `;

    // Upgrade button - shows plan selection
    document.getElementById('upgradeBtn')?.addEventListener('click', async () => {
      const plan = prompt('Select plan: starter, professional, or enterprise');
      if (!plan || !['starter', 'professional', 'enterprise'].includes(plan)) return;

      const result = await api('/billing/checkout', { method: 'POST', body: { plan } });
      if (result?.success && result.url) {
        window.location.href = result.url;
      } else {
        showToast(result?.message || 'Error creating checkout session', 'error');
      }
    });

    // Billing portal
    document.getElementById('portalBtn')?.addEventListener('click', async () => {
      const result = await api('/billing/portal', { method: 'POST' });
      if (result?.success && result.url) {
        window.location.href = result.url;
      } else {
        showToast(result?.message || 'Error opening billing portal', 'error');
      }
    });
  }

  async function renderProfile(container) {
    container.innerHTML = `
      <div class="section-grid">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Profile Information</div>
          </div>
          <form id="profileForm">
            <div class="form-row">
              <div class="form-group">
                <label>First Name</label>
                <input type="text" class="form-control" name="firstName" value="${currentUser.firstName}">
              </div>
              <div class="form-group">
                <label>Last Name</label>
                <input type="text" class="form-control" name="lastName" value="${currentUser.lastName}">
              </div>
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" class="form-control" value="${currentUser.email}" disabled>
            </div>
            <div class="form-group">
              <label>Organization</label>
              <input type="text" class="form-control" name="organizationName" value="${currentUser.organization?.name || ''}">
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input type="tel" class="form-control" name="phone" value="${currentUser.phone || ''}">
            </div>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </form>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Settings</div>
          </div>
          <form id="settingsForm">
            <div class="form-group">
              <label>Theme</label>
              <select class="form-control" name="theme">
                <option value="light" ${currentUser.settings?.theme === 'light' ? 'selected' : ''}>Light</option>
                <option value="dark" ${currentUser.settings?.theme === 'dark' ? 'selected' : ''}>Dark</option>
                <option value="auto" ${currentUser.settings?.theme === 'auto' ? 'selected' : ''}>Auto</option>
              </select>
            </div>
            <div class="form-group">
              <label>Timezone</label>
              <input type="text" class="form-control" name="timezone" value="${currentUser.settings?.timezone || 'Asia/Dubai'}">
            </div>
            <div class="form-group">
              <label>Language</label>
              <select class="form-control" name="language">
                <option value="en" ${currentUser.settings?.language === 'en' ? 'selected' : ''}>English</option>
                <option value="ar" ${currentUser.settings?.language === 'ar' ? 'selected' : ''}>Arabic</option>
              </select>
            </div>
            <div class="form-group">
              <label style="display:flex;align-items:center;gap:8px;">
                <input type="checkbox" name="emailNotifications" ${currentUser.settings?.notifications?.email ? 'checked' : ''}>
                Email Notifications
              </label>
            </div>
            <button type="submit" class="btn btn-primary">Save Settings</button>
          </form>

          <hr style="border-color:var(--portal-border);margin:24px 0;">

          <div class="card-header">
            <div class="card-title">Connected Accounts</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${(currentUser.providers || []).length === 0
        ? '<p style="color:var(--portal-text-secondary);font-size:0.9rem;">No connected accounts</p>'
        : currentUser.providers.map(p => `
              <div style="display:flex;align-items:center;gap:10px;padding:8px 0;">
                <i class="fab fa-${p.provider}" style="font-size:1.2rem;width:24px;"></i>
                <span style="text-transform:capitalize;">${p.provider}</span>
                <span class="badge success" style="margin-left:auto;">Connected</span>
              </div>`).join('')}
          </div>
        </div>
      </div>
    `;

    // Profile form
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd);
      const result = await api('/portal/profile', { method: 'PUT', body });
      if (result?.success) {
        currentUser = result.user;
        showToast('Profile updated');
      } else {
        showToast(result?.message || 'Error updating profile', 'error');
      }
    });

    // Settings form
    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = {
        theme: fd.get('theme'),
        timezone: fd.get('timezone'),
        language: fd.get('language'),
        notifications: { email: fd.has('emailNotifications') }
      };
      const result = await api('/portal/settings', { method: 'PUT', body });
      if (result?.success) {
        currentUser.settings = result.settings;
        showToast('Settings updated');
      } else {
        showToast(result?.message || 'Error updating settings', 'error');
      }
    });
  }

  async function renderActivity(container) {
    const data = await api('/portal/activity');
    const logs = data?.success ? data.logs : [];

    const actionLabels = {
      login_success: { label: 'Login', icon: 'sign-in-alt', badge: 'success' },
      login_failed: { label: 'Failed Login', icon: 'times-circle', badge: 'error' },
      logout: { label: 'Logout', icon: 'sign-out-alt', badge: 'neutral' },
      register: { label: 'Registration', icon: 'user-plus', badge: 'info' },
      password_change: { label: 'Password Changed', icon: 'key', badge: 'warning' },
      password_reset_request: { label: 'Password Reset Request', icon: 'envelope', badge: 'warning' },
      password_reset_complete: { label: 'Password Reset', icon: 'lock', badge: 'success' },
      email_verified: { label: 'Email Verified', icon: 'check-circle', badge: 'success' },
      account_locked: { label: 'Account Locked', icon: 'lock', badge: 'error' },
      oauth_login: { label: 'OAuth Login', icon: 'key', badge: 'info' },
      oauth_link: { label: 'Account Linked', icon: 'link', badge: 'info' },
      subscription_change: { label: 'Subscription Change', icon: 'credit-card', badge: 'warning' },
      profile_update: { label: 'Profile Updated', icon: 'user-edit', badge: 'neutral' }
    };

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Security & Activity Log</div>
            <div class="card-subtitle">Recent account activity</div>
          </div>
        </div>
        ${logs.length === 0
        ? '<div class="empty-state"><i class="fas fa-shield-alt"></i><h3>No activity yet</h3></div>'
        : `<div class="table-wrapper"><table>
            <thead><tr><th>Event</th><th>IP Address</th><th>Date</th><th>Details</th></tr></thead>
            <tbody>${logs.map(log => {
          const meta = actionLabels[log.action] || { label: log.action, icon: 'info-circle', badge: 'neutral' };
          return `<tr>
                    <td><span class="badge ${meta.badge}"><i class="fas fa-${meta.icon}"></i> ${meta.label}</span></td>
                    <td style="font-family:monospace;font-size:0.8rem;">${log.ip || '-'}</td>
                    <td>${formatDate(log.createdAt)}</td>
                    <td style="font-size:0.8rem;color:var(--portal-text-secondary);">${log.metadata ? JSON.stringify(log.metadata) : '-'}</td>
                  </tr>`;
        }).join('')}
            </tbody>
          </table></div>`}
      </div>
    `;
  }

  // Helpers
  function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function formatDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  // Hash-based routing
  window.addEventListener('hashchange', () => {
    if (currentUser) navigate(window.location.hash.slice(1));
  });

  // Start
  init();
})();
