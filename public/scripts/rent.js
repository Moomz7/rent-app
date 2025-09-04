document.addEventListener('DOMContentLoaded', () => {
  let rentBalance = 1200;
  document.getElementById('rent-balance').textContent = `$${rentBalance.toFixed(2)}`;

  document.getElementById('payment-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('amount').value);
    if (isNaN(amount) || amount <= 0) return;

    rentBalance -= amount;
    document.getElementById('rent-balance').textContent = `$${Math.max(rentBalance, 0).toFixed(2)}`;
    document.getElementById('receipt').textContent = `✅ Payment of $${amount.toFixed(2)} received.`;
    document.getElementById('amount').value = '';
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