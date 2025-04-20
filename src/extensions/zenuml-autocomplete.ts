import type { CompletionContext } from '@codemirror/autocomplete';

function zenumlCompletions(context: CompletionContext) {
	const word = context.matchBefore(/\w*/);
	if (!word || (word.from === word.to && !context.explicit)) return null;

	return {
		from: word.from,
		options: [
			// Keywords
			{ label: 'title', type: 'keyword' },
			{ label: 'participant', type: 'keyword' },
			{ label: 'group', type: 'keyword' },
			{ label: 'if', type: 'keyword' },
			{ label: 'else', type: 'keyword' },
			{ label: 'while', type: 'keyword' },
			{ label: 'par', type: 'keyword' },
			{ label: 'opt', type: 'keyword' },
			{ label: 'critical', type: 'keyword' },
			{ label: 'section', type: 'keyword' },
			{ label: 'try', type: 'keyword' },
			{ label: 'catch', type: 'keyword' },
			{ label: 'finally', type: 'keyword' },
			{ label: 'async', type: 'keyword' },
			{ label: 'Starter', type: 'type' },
			// Common participant types
			{ label: 'Boundary', type: 'type' },
			{ label: 'Control', type: 'type' },
			{ label: 'Actor', type: 'type' },
			{ label: 'User', type: 'type' },
			{ label: 'System', type: 'type' },
			{ label: 'Database', type: 'type' },
			{ label: 'Service', type: 'type' },
			// Common stereotypes
			{ label: '<<interface>>', type: 'type' },
			{ label: '<<boundary>>', type: 'type' },
			{ label: '<<control>>', type: 'type' },
			{ label: '<<entity>>', type: 'type' },
		],
	};
}

export { zenumlCompletions };
