// Convenience screen only: static hosting still exposes the underlying files.
(() => {
  'use strict';
  const sessionKey = 'japan-2026-view-unlocked-v1';
  const form = document.getElementById('accessForm');
  const input = document.getElementById('accessPassword');
  const error = document.getElementById('accessError');
  const submit = document.getElementById('accessSubmit');
  let loading = false;

  function openTrip() {
    if (loading) return;
    loading = true;
    submit.disabled = true;
    error.textContent = '';
    const script = document.createElement('script');
    script.src = 'japan-2026-v2.js?v=2.17.2';
    script.onload = () => {
      try { sessionStorage.setItem(sessionKey, 'yes'); } catch { /* Unlock still works without storage. */ }
      input.value = '';
      document.getElementById('accessScreen').hidden = true;
      const app = document.getElementById('tripApplication');
      app.hidden = false;
      app.inert = false;
      document.getElementById('monogram').focus();
    };
    script.onerror = () => {
      script.remove();
      loading = false;
      submit.disabled = false;
      error.textContent = 'Could not load the trip. Reconnect and try again. לא ניתן לטעון את הטיול. התחברו לרשת ונסו שוב.';
      input.focus();
    };
    document.head.appendChild(script);
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (input.value !== '88888888') {
      error.textContent = 'Incorrect password. Try again. סיסמה שגויה. נסו שוב.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      input.select();
      return;
    }
    input.removeAttribute('aria-invalid');
    openTrip();
  });
  input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    error.textContent = '';
  });
  document.getElementById('accessLock').addEventListener('click', () => {
    try { sessionStorage.removeItem(sessionKey); } catch { /* No saved unlock to remove. */ }
    location.reload();
  });
  try { if (sessionStorage.getItem(sessionKey) === 'yes') openTrip(); } catch { /* Ask on each load if storage is unavailable. */ }
})();
