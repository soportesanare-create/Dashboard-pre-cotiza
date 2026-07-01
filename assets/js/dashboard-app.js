(function() {
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => Array.from(el.querySelectorAll(q));

  // 🔐 LOGIN USERS (Same as Pre-Cotizador)
  const USERS = {
    "admin": "g84k$2H*9Xl!",
    "bere": "Bere1102",
    "alain": "Ala1103",
    "oscar": "Osca1104",
    "anayely": "Ana1105",
    "dayana": "Daya1106"
  };

  const LS_THEME = "sanare_pre_theme_v1";
  const LS_DASH_LOGIN = "sanare_dash_auth_v1"; // Session state just for UI bypass if recently logged in, though here we'll keep it simple and require login on fresh load.

  // Login handler
  window.checkLogin = function() {
    const rawUser = $('#user').value.trim();
    const u = rawUser.toLowerCase();
    const p = $('#pass').value.trim();
    if (USERS[u] && USERS[u] === p) {
      $('#overlay').style.display = 'none';
      sessionStorage.setItem(LS_DASH_LOGIN, "true"); // keep active for session
      loadDashboardData();
    } else {
      alert("Usuario o contraseña incorrectos");
    }
  };

  // Auto bypass if already authenticated in this session tab
  if (sessionStorage.getItem(LS_DASH_LOGIN) === "true") {
    $('#overlay').style.display = 'none';
    setTimeout(loadDashboardData, 500); // Give Firebase time to init
  }

  // Theme Controller
  function initTheme() {
    const btn = $('#toggleThemeBtn');
    if (!btn) return;

    function applyTheme(theme) {
      document.body.dataset.theme = theme;
      const themeLabel = btn.querySelector('.theme-label');
      const themeIcon = btn.querySelector('i');
      if (themeLabel) themeLabel.textContent = theme === "dark" ? "Oscuro" : "Claro";
      if (themeIcon) themeIcon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    }

    let currentTheme = "light";
    try {
      currentTheme = localStorage.getItem(LS_THEME) || "light";
    } catch(e) {}
    applyTheme(currentTheme);

    btn.addEventListener("click", () => {
      currentTheme = currentTheme === "dark" ? "light" : "dark";
      try { localStorage.setItem(LS_THEME, currentTheme); } catch(e) {}
      applyTheme(currentTheme);
    });
  }

  // Data Formatting
  function formatDate(timestamp) {
    if (!timestamp) return "—";
    // Firebase timestamp has toDate()
    const d = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleString("es-MX", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  // Load Firestore Data
  async function loadDashboardData() {
    if (!window.db) {
      alert("La base de datos de Firebase no está lista.");
      return;
    }

    $('#loadingView').style.display = 'block';
    $('#dashboardView').style.display = 'none';

    try {
      // Query the last 50 quotes ordered by creation date descending
      const snapshot = await window.db.collection("cotizaciones")
                                      .orderBy("createdAt", "desc")
                                      .limit(100)
                                      .get();

      const quotes = [];
      snapshot.forEach(doc => {
        quotes.push({ id: doc.id, ...doc.data() });
      });

      renderDashboard(quotes);

    } catch (error) {
      console.error("Error obteniendo datos: ", error);
      alert("Hubo un error al descargar las cotizaciones. Verifica que hayas actualizado las Reglas en Firebase (allow read: if true;).");
      $('#loadingView').innerHTML = `<div style="color:red;">Error de permisos o conexión. Revisa consola.</div>`;
    }
  }

  // Bind refresh
  $('#btnRefresh')?.addEventListener("click", loadDashboardData);

  // Render Logic
  function renderDashboard(quotes) {
    let pdfCount = 0;
    let imgCount = 0;
    const kamCounts = {};

    quotes.forEach(q => {
      // Counts
      if (String(q.tipo_exportacion).toUpperCase() === "PDF") pdfCount++;
      if (String(q.tipo_exportacion).toUpperCase() === "IMAGEN") imgCount++;
      
      // KAM Grouping
      const kam = (q.kam || "Desconocido").trim();
      const normalizedKam = kam.charAt(0).toUpperCase() + kam.slice(1).toLowerCase();
      kamCounts[normalizedKam] = (kamCounts[normalizedKam] || 0) + 1;
    });

    // Update Top Cards
    $('#dashTotalCount').textContent = quotes.length;
    $('#dashPdfCount').textContent = pdfCount;
    $('#dashImgCount').textContent = imgCount;

    // Render KAM List
    const kamArray = Object.entries(kamCounts).sort((a, b) => b[1] - a[1]); // sort descending
    const kamListEl = $('#kamList');
    kamListEl.innerHTML = "";
    if (kamArray.length === 0) {
      kamListEl.innerHTML = `<div class="muted" style="padding: 10px;">No hay cotizaciones registradas aún.</div>`;
    } else {
      kamArray.forEach(([name, count]) => {
        kamListEl.innerHTML += `
          <div class="kam-item">
            <span>${name}</span>
            <strong>${count}</strong>
          </div>
        `;
      });
    }

    // Render History Table
    const tableBody = $('#historyTable tbody');
    tableBody.innerHTML = "";
    quotes.slice(0, 50).forEach(q => { // Show max 50 in table
      tableBody.innerHTML += `
        <tr>
          <td>${formatDate(q.createdAt)}</td>
          <td>${q.kam || "—"}</td>
          <td>${q.paciente || "—"}</td>
          <td>${String(q.sede || "—").split(" ")[0]}</td>
          <td>
            <span class="quote-pill" style="font-size: 10px; padding: 2px 8px;">
              ${q.tipo_exportacion || "PDF"}
            </span>
          </td>
          <td><strong>${q.total || "$0.00"}</strong></td>
        </tr>
      `;
    });

    // Switch views
    $('#loadingView').style.display = 'none';
    $('#dashboardView').style.display = 'block';
  }

  // Document Ready
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
  });

})();
