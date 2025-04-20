import type { Completion, CompletionContext } from '@codemirror/autocomplete';
import type { ViewUpdate } from '@codemirror/view';
import type { SyntaxNodeRef, Tree, TreeCursor } from '@lezer/common';

import { parser } from '../grammar/zenuml-parser';

// Function to extract participant names from the syntax tree
// Store participant names globally for autocompletion
const participantNames = new Set<string>();

function extractParticipantNames(content: string, tree: Tree): void {
	participantNames.clear();

	tree.cursor().iterate((node: SyntaxNodeRef) => {
		if (node.type.name === 'Participant') {
			const c = node as unknown as TreeCursor;
			c.firstChild();
			while (c.nextSibling()) {
				if (c.type.name === 'Name' || c.type.name === 'Identifier') {
					const name = content.slice(c.from, c.to).trim();
					if (name) {
						participantNames.add(name);
					}
				}
			}
		}
	});
}

function zenumlParticipantsListener(update: ViewUpdate): void {
	if (update.docChanged) {
		const content = update.state.doc.toString();
		const tree = parser.parse(content);
		console.log(tree.toString());
		extractParticipantNames(content, tree);
	}
}
// Get default completions
const defaultOptions: Completion[] = [
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
];

function zenumlCompletions(context: CompletionContext) {
	const word = context.matchBefore(/\w*/);
	if (!word || (word.from === word.to && !context.explicit)) return null;

	const participantOptions: Completion[] = Array.from(participantNames).map((name) => ({
		label: name,
		type: 'variable',
		boost: 1.5,
	}));

	// Combine both sets of completions
	return {
		from: word.from,
		options: [...defaultOptions, ...participantOptions],
	};
}

export { zenumlCompletions, zenumlParticipantsListener };
