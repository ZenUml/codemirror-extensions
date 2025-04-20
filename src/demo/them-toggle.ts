import type { Compartment, Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

const darkModeClass = EditorView.theme({
	'&': { '&.cm-editor': { '&.cm-theme-dark': {} } },
});

// Create theme toggle extension
export const createThemeExtension = (
	view: EditorView,
	compartment: Compartment,
	darkTheme: Extension,
	lightTheme: Extension
) => {
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

	const updateTheme = (isDark: boolean) => {
		const theme = isDark ? [darkTheme, darkModeClass] : [lightTheme];
		view.dispatch({
			effects: compartment.reconfigure(theme),
		});
	};

	// Listen for system theme changes
	mediaQuery.addEventListener('change', (e) => {
		updateTheme(e.matches);
	});

	return {
		updateTheme,
	};
};
