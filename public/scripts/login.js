document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);

  if (params.get('error') === 'invalid') {
    const msg = document.createElement('p');
    msg.textContent = '❌ Invalid username or password';
    msg.style.color = 'red';
    document.body.prepend(msg);
  }

  if (params.get('signup') === 'success') {
    const msg = document.createElement('p');
    msg.textContent = '✅ Account created! You can now log in.';
    msg.style.color = 'green';
    document.body.prepend(msg);
  }

  if (params.get('loggedOut') === 'true') {
    const msg = document.createElement('p');
    msg.textContent = '👋 You’ve been logged out.';
    msg.style.color = 'gray';
    document.body.prepend(msg);
  }
});