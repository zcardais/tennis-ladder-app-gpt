import './firebase-setup.js';
console.log("Main.js loaded");

function loadPageScripts() {
  const page = window.location.pathname;

  if (page.endsWith('dashboard.html')) {
	import('./js/dashboard.js').then(module => module.init());
  } else if (page.endsWith('challenges.html')) {
	import('./js/challenges.js').then(module => module.init());
  } else if (page.endsWith('profile.html')) {
	import('./js/profile.js').then(module => module.init());
  } else if (page.endsWith('stats.html')) {
	import('./js/stats.js').then(module => module.init());
  } else if (page.endsWith('report.html')) {
	import('./js/report.js').then(module => module.init());
  }

  // 🔽 Move admin check above ladder.html
  else if (page.includes('/admin/')) {
	if (page.endsWith('index.html')) {
	  import('./js/admin-index.js').then(module => module.init());
	} else if (page.endsWith('ladders.html')) {
	  import('./js/admin-ladders.js').then(module => module.init());
	} else if (page.endsWith('matches.html')) {
	  import('./js/admin-matches.js').then(module => module.init());
	} else if (page.endsWith('new-ladder.html')) {
	  import('./js/admin-new-ladder.js').then(module => module.init());
	} else if (page.endsWith('edit-ladder.html')) {
	  import('./js/admin-edit-ladder.js').then(module => module.init());
	} else if (page.endsWith('players.html')) {
	  import('./js/admin-players.js').then(module => module.init());
	} else if (page.endsWith('settings.html')) {
	  import('./js/admin-settings.js').then(module => module.init());
	}
  }

  // 🔽 Ladder.html must come after admin check
  else if (page.endsWith('ladder.html')) {
	import('./js/ladder.js').then(module => module.init());
  }
}

loadPageScripts();

function highlightActiveTab() {
  const path = window.location.pathname;

  const navLinks = document.querySelectorAll("nav a");
  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (path.endsWith(href)) {
      link.classList.add("text-blue-600", "font-medium");
      link.classList.remove("text-gray-400", "text-gray-600");
    }
  });
}

highlightActiveTab();