document.addEventListener('DOMContentLoaded', () => {
  let rentBalance = 1200;
  document.getElementById('rent-balance').textContent = `$${rentBalance.toFixed(2)}`;


  // Stripe payment
  document.getElementById('pay-stripe').addEventListener('click', async function () {
    const amount = document.getElementById('amount').value;
    if (!amount || isNaN(amount) || amount <= 0) return alert('Enter a valid amount');
    const res = await fetch('/api/create-stripe-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Failed to start Stripe payment');
    }
  });

  // PayPal payment
  document.getElementById('pay-paypal').addEventListener('click', async function () {
    const amount = document.getElementById('amount').value;
    if (!amount || isNaN(amount) || amount <= 0) return alert('Enter a valid amount');
    const res = await fetch('/api/create-paypal-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    const data = await res.json();
    if (data && data.links) {
      const approve = data.links.find(l => l.rel === 'approve');
      if (approve) {
        window.location.href = approve.href;
        return;
      }
    }
    alert('Failed to start PayPal payment');
  });

  document.getElementById('request-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const issue = document.getElementById('request').value.trim();
    if (!issue) return;

    const list = document.getElementById('requests-list');
    const item = document.createElement('p');
    item.textContent = `🛠️ ${issue} – Status: Pending`;
    list.appendChild(item);
    document.getElementById('request').value = '';
  });

// Payment
document.getElementById('payment-form').addEventListener('submit', async e => {
  e.preventDefault();
  const amount = document.getElementById('amount').value;

  const res = await fetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  });

  const data = await res.json();
  showToast(data.success ? '✅ Payment received!' : '❌ Payment failed');
});

// Repair Request
document.getElementById('request-form').addEventListener('submit', async e => {
  e.preventDefault();
  const description = document.getElementById('request').value;

  const res = await fetch('/api/repair-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description })
  });

  const data = await res.json();
  showToast(data && !data.error ? '✅ Request submitted!' : '❌ Request failed');
});

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