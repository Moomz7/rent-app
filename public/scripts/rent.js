document.addEventListener('DOMContentLoaded', () => {
  // Load balance data on page load
  loadBalanceData();

  // Check if returning from payment success
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('payment') === 'success') {
    showToast('✅ Payment completed successfully!');
    // Refresh balance after a short delay to allow webhook processing
    setTimeout(() => {
      refreshBalance();
    }, 2000);
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Refresh balance button
  document.getElementById('refresh-balance').addEventListener('click', () => {
    refreshBalance();
    showToast('🔄 Refreshing balance...');
  });

  // Stripe payment
  document.getElementById('pay-stripe').addEventListener('click', async function () {
    const amount = document.getElementById('amount').value;
    if (!amount || isNaN(amount) || amount <= 0) return alert('Enter a valid amount');
    
    try {
      const res = await fetch('/api/create-stripe-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount,
          description: `Rent Payment - $${amount}`
        })
      });
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start Stripe payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Network error. Please try again.');
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
  if (data && !data.error) {
    showToast('✅ Payment received!');
    // Refresh balance after successful payment
    setTimeout(() => {
      refreshBalance();
    }, 1000);
    // Clear the amount input
    document.getElementById('amount').value = '';
  } else {
    showToast('❌ Payment failed');
  }
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

// Load balance and payment data
async function loadBalanceData() {
  try {
    const response = await fetch('/api/balance');
    if (!response.ok) {
      throw new Error('Failed to load balance data');
    }
    
    const data = await response.json();
    updateBalanceDisplay(data);
    return data;
    
  } catch (error) {
    console.error('Error loading balance:', error);
    showErrorMessage('Unable to load balance data');
    throw error;
  }
}

// Update the balance display with fetched data
function updateBalanceDisplay(data) {
  const {
    balance,
    monthlyRent,
    leaseStart,
    nextDueDate,
    payments
  } = data;
  
  // Update main balance
  const balanceElement = document.getElementById('rent-balance');
  const balanceColor = balance > 0 ? '#dc3545' : balance < 0 ? '#28a745' : '#333';
  balanceElement.innerHTML = `<span style="color: ${balanceColor}; font-weight: bold;">$${Math.abs(balance).toFixed(2)}</span>`;
  
  // Update balance details
  updateBalanceDetails(data);
  
  // Update payment history
  updatePaymentHistory(payments);
}

// Update detailed balance information
function updateBalanceDetails(data) {
  const {
    balance,
    monthlyRent,
    leaseStart,
    nextDueDate,
    payments
  } = data;
  
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const leaseStartFormatted = new Date(leaseStart).toLocaleDateString();
  const nextDueFormatted = new Date(nextDueDate).toLocaleDateString();
  
  document.getElementById('monthly-rent').textContent = `$${monthlyRent.toFixed(2)}`;
  document.getElementById('total-paid').textContent = `$${totalPaid.toFixed(2)}`;
  document.getElementById('lease-start').textContent = leaseStartFormatted;
  document.getElementById('next-due').textContent = nextDueFormatted;
  
  // Set balance status message
  const statusElement = document.getElementById('balance-status');
  if (balance > 0) {
    statusElement.innerHTML = `<span style="color: #dc3545;">💸 Amount Due: $${balance.toFixed(2)}</span>`;
  } else if (balance < 0) {
    statusElement.innerHTML = `<span style="color: #28a745;">✅ Paid Ahead: $${Math.abs(balance).toFixed(2)}</span>`;
  } else {
    statusElement.innerHTML = `<span style="color: #28a745;">✅ All Caught Up!</span>`;
  }
}

// Update payment history display
function updatePaymentHistory(payments) {
  const historyContainer = document.getElementById('payment-history');
  if (!payments || payments.length === 0) {
    historyContainer.innerHTML = '<p style="color: #666; font-style: italic;">No payments recorded yet.</p>';
    return;
  }
  
  const recentPayments = payments.slice(0, 5); // Show last 5 payments
  const historyHtml = recentPayments.map(payment => {
    const date = new Date(payment.date).toLocaleDateString();
    const method = payment.paymentMethod || 'manual';
    const statusColor = payment.status === 'completed' ? '#28a745' : '#ffc107';
    
    return `
      <div class="payment-item">
        <div class="payment-info">
          <span class="payment-amount">$${payment.amount.toFixed(2)}</span>
          <span class="payment-date">${date}</span>
        </div>
        <div class="payment-meta">
          <span class="payment-method">${method}</span>
          <span class="payment-status" style="color: ${statusColor};">${payment.status}</span>
        </div>
      </div>
    `;
  }).join('');
  
  historyContainer.innerHTML = historyHtml;
  
  if (payments.length > 5) {
    historyContainer.innerHTML += `<p style="text-align: center; margin-top: 10px;"><a href="#" onclick="showAllPayments()">View all ${payments.length} payments</a></p>`;
  }
}

// Show error message
function showErrorMessage(message) {
  const balanceElement = document.getElementById('rent-balance');
  balanceElement.innerHTML = `<span style="color: #dc3545;">Error: ${message}</span>`;
}

// Show toast notification
function showToast(message) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 5px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Refresh balance after payment
function refreshBalance() {
  const refreshBtn = document.getElementById('refresh-balance');
  const originalText = refreshBtn.innerHTML;
  
  // Show loading state
  refreshBtn.innerHTML = '⏳';
  refreshBtn.disabled = true;
  
  loadBalanceData().finally(() => {
    // Reset button after loading
    setTimeout(() => {
      refreshBtn.innerHTML = originalText;
      refreshBtn.disabled = false;
    }, 500);
  });
}