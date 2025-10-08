document.addEventListener('DOMContentLoaded', async () => {
  const tenantList = document.getElementById('tenant-list');
  const requestList = document.getElementById('repair-requests');
  const paymentHistory = document.getElementById('payment-history');

  const welcomeMessage = document.getElementById('welcome-message');

  try {
    const userRes = await fetch('/api/current-user');
    const user = await userRes.json();
    welcomeMessage.textContent = `Welcome back, ${user.username}!`;
  } catch {
    welcomeMessage.textContent = 'Welcome back!';
  }

  try {
    // Fetch tenants
    const tenants = await fetch('/api/tenants').then(res => res.json());
    tenantList.innerHTML = tenants.map(t => `<p>👤 ${t.username}</p>`).join('');

    // Fetch repair requests
    const requests = await fetch('/api/requests').then(res => res.json());
    requestList.innerHTML = requests.map(r => `
      <div class="request-item">
        <p>🛠️ ${r.tenant}: ${r.issue} – Status: ${r.status}</p>
        ${r.status !== 'Resolved' ? `<button data-id="${r._id}" class="resolve-btn">Mark as Resolved</button>` : ''}
      </div>
    `).join('');

    // Attach event listeners to resolve buttons
    document.querySelectorAll('.resolve-btn').forEach(button => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-id');
        const res = await fetch(`/api/requests/${id}/resolve`, { method: 'POST' });
        const updated = await res.json();
        const parent = button.parentElement;
        parent.querySelector('p').textContent = `🛠️ ${updated.tenant}: ${updated.issue} – Status: ${updated.status}`;
        button.remove();
      });
    });

    // Fetch payments
    const payments = await fetch('/api/payments').then(res => res.json());
    paymentHistory.innerHTML = payments.map(p => `
      <p>💰 ${p.tenant} paid $${p.amount} on ${new Date(p.date).toLocaleDateString()}</p>
    `).join('');
  } catch (err) {
    tenantList.textContent = 'Error loading tenants';
    requestList.textContent = 'Error loading requests';
    paymentHistory.textContent = 'Error loading payments';
    console.error(err);
  }

async function loadRequests() {
  const res = await fetch('/api/requests');
  const requests = await res.json();

  const container = document.getElementById('requests-container');
  container.innerHTML = '';

  requests.forEach(r => {
    const div = document.createElement('div');
    div.className = 'request-card';
    div.innerHTML = `
      <p><strong>${r.tenant}</strong> reported: ${r.issue}</p>
      <p>Status: ${r.status}</p>
      <button data-id="${r._id}" class="resolve-btn">Mark Resolved</button>
    `;
    container.appendChild(div);
  });

  // Attach resolve handlers
  document.querySelectorAll('.resolve-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const res = await fetch(`/api/requests/${id}/resolve`, { method: 'POST' });
      const updated = await res.json();
      btn.parentElement.querySelector('p:nth-child(2)').textContent = `Status: ${updated.status}`;
      btn.remove(); // remove button after resolving
    });
  });
}

async function loadPayments() {
  const res = await fetch('/api/payments');
  const payments = await res.json();

  const container = document.getElementById('payments-container');
  container.innerHTML = '<h3>Recent Payments</h3>';

  payments.forEach(p => {
    const entry = document.createElement('p');
    entry.textContent = `${p.username} paid $${p.amount.toFixed(2)} on ${new Date(p.date).toLocaleDateString()}`;
    container.appendChild(entry);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadRequests();
  loadPayments();
});

  // Logout confirmation
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', function (e) {
      e.preventDefault();
      if (confirm('Are you sure you want to log out?')) {
        window.location.href = '/logout';
      }
    });
  }
});