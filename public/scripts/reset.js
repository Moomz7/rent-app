document.addEventListener('DOMContentLoaded', () => {
  const passwordInput = document.querySelector('input[name="newPassword"]');
  const toast = document.getElementById('toast');
  const params = new URLSearchParams(window.location.search);

  // Auto-focus
  passwordInput?.focus();

  // Feedback from query params
  const messages = {
    error: {
      expired: { text: '❌ Reset token expired or invalid.', color: 'red' },
      server: { text: '⚠️ Server error. Please try again.', color: 'orange' }
    },
    reset: {
      success: { text: '✅ Password reset successful! You can now log in.', color: 'green' }
    }
  };

  for (const [key, variants] of Object.entries(messages)) {
    const value = params.get(key);
    if (value && variants[value]) {
      showToast(variants[value].text, variants[value].color);
      break;
    }
  }

  function showToast(message, color = 'black') {
    if (!toast) return;
    toast.textContent = message;
    toast.style.color = color;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 4000);
  }
});