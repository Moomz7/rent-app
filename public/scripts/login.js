document.addEventListener('DOMContentLoaded', () => {
  const usernameInput = document.querySelector('input[name="username"]');
  const toast = document.getElementById('toast');
  const params = new URLSearchParams(window.location.search);

  // Auto-focus and lowercase enforcement
  if (usernameInput) {
    usernameInput.focus();
    usernameInput.addEventListener('input', e => {
      e.target.value = e.target.value.toLowerCase();
    });
  }

  // Feedback messages
  const messages = {
    error: {
      invalid: { text: '❌ Invalid username or password', color: 'red' }
    },
    signup: {
      success: { text: '✅ Account created! You can now log in.', color: 'green' }
    },
    reset: {
      success: { text: '🔐 Password reset successful! You can now log in.', color: 'green' }
    },
    loggedOut: {
      true: { text: '👋 You’ve been logged out.', color: 'gray' }
    }
  };

  for (const [key, variants] of Object.entries(messages)) {
    const value = params.get(key);
    if (value && variants[value]) {
      showToast(variants[value].text, variants[value].color);
      break;
    }
  }

  function showToast(message, color) {
    if (!toast) {
      const msg = document.createElement('p');
      msg.textContent = message;
      msg.style.color = color;
      msg.style.marginTop = '1rem';
      msg.style.textAlign = 'center';
      document.body.prepend(msg);
      setTimeout(() => msg.remove(), 5000);
    } else {
      toast.textContent = message;
      toast.style.color = color;
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 5000);
    }
  }
});