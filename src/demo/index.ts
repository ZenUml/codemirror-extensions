import { autocompletion } from '@codemirror/autocomplete';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { dracula, tomorrow } from 'thememirror';
import {
	zenumlCompletionKeyMaps,
	zenumlCompletions,
	zenumlParticipantStateField,
} from '../extensions';
import { updateHighlightStyle, zenumlHighlighter } from '../extensions/zenuml-highlighter';
import { zenumlLinter } from '../extensions/zenuml-linter';
import { parser } from '../grammar/zenuml-parser';
import { getInitialTheme, setTheme } from './dark-mode';
import { createThemeExtension } from './them-toggle';

const doc = `title Order Service (Demonstration only)
// Styling participants with background colors is an experimental feature.
// This feature is available for users to test and provide feedback.
@Actor Client #FFEBE6
@Boundary OrderController #0747A6
@EC2 <<BFF>> OrderService #E3FCEF
group BusinessService {
  @Lambda PurchaseService
  @AzureFunction InvoiceService
}

@Starter(Client)
// [font-bold, italic, underline]
// POST /orders
OrderController.post(payload12) {
	// [font-bold, underline]
	OrderService.create(payload) {
		// [underline, font-bold]
		order = new Order(payload)
		if (order != null) {
            par {
				PurchaseService.createPO(order)
				InvoiceService.createInvoice(order)
			}
		}
	}
}`;

const themeCompartment = new Compartment();
const lightTheme = tomorrow;
const darkTheme = dracula;

// Initial parsing of the document
const initialTree = parser.parse(doc);
console.log(initialTree.toString());

// Create the editor
const state = EditorState.create({
	doc,
	extensions: [
		basicSetup,
		zenumlParticipantStateField,
		zenumlHighlighter(),
		autocompletion({
			override: [zenumlCompletions],
			closeOnBlur: true,
			activateOnTyping: true,
			selectOnOpen: true,
			icons: true,
		}),
		themeCompartment.of(darkTheme),
		zenumlLinter(),
		keymap.of([...zenumlCompletionKeyMaps]),
	],
});

const editorElement = document.getElementById('editor');

// Add event listener for theme toggle
document.addEventListener('DOMContentLoaded', () => {
	const initialTheme = getInitialTheme();
	setTheme(initialTheme);

	if (editorElement) {
		const view = new EditorView({
			state,
			parent: editorElement,
		});

		const { updateTheme } = createThemeExtension(view, themeCompartment, darkTheme, lightTheme);

		const themeToggle = document.getElementById('theme-toggle');
		if (themeToggle) {
			themeToggle.addEventListener('click', () => {
				const currentTheme = document.documentElement.getAttribute('data-theme');
				const isDark = currentTheme === 'dark';
				updateTheme(!isDark);
				updateHighlightStyle(view, !isDark);
				setTheme(!isDark ? 'dark' : 'light');
			});
		}

		// Listen for system theme changes
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
			if (!localStorage.getItem('theme')) {
				updateTheme(e.matches);
				updateHighlightStyle(view, e.matches);
				setTheme(e.matches ? 'dark' : 'light');
			}
		});
	}
});
