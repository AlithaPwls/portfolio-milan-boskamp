/**
 * Admin login — redirect naar dashboard bij actieve sessie.
 */

(function () {
  if (!window.PortfolioDB) {
    const err = document.getElementById('login-error');
    if (err) {
      err.textContent = 'Scripts niet geladen. Vernieuw de pagina of run: npm run config:local';
      err.hidden = false;
    }
    return;
  }

  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = !msg;
  }

  async function checkSession() {
    try {
      const session = await window.PortfolioDB.getSession();
      if (session) {
        window.location.replace('/admin/dashboard');
      }
    } catch (e) {
      console.error(e);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    btn.disabled = true;
    btn.textContent = 'Bezig…';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      await window.PortfolioDB.signIn(email, password);
      window.location.replace('/admin/dashboard');
    } catch (err) {
      showError(err.message || 'Inloggen mislukt. Controleer e-mail en wachtwoord.');
      btn.disabled = false;
      btn.textContent = 'Inloggen';
    }
  });

  checkSession();
})();
