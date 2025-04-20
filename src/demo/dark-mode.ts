export const getInitialTheme = (): 'light' | 'dark' => {
	const savedTheme = localStorage.getItem('theme');
	if (savedTheme === 'light' || savedTheme === 'dark') {
		return savedTheme;
	}
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Initialize theme
const setTheme = (theme: 'light' | 'dark') => {
	document.documentElement.setAttribute('data-theme', theme);
	localStorage.setItem('theme', theme);

	// Update button text
	const themeToggle = document.getElementById('theme-toggle');
	if (themeToggle) {
		themeToggle.innerHTML = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
	}
};

// Set initial theme
setTheme(getInitialTheme());

export { setTheme };
