import { StateField } from '@codemirror/state';
import type { EditorState, Transaction } from '@codemirror/state';
import type { SyntaxNodeRef, Tree } from '@lezer/common';
import { parser } from '../grammar/zenuml-parser';

export const zenumlParticipantStateField = StateField.define<ReadonlySet<string>>({
	create(state: EditorState) {
		const content = state.doc.toString();
		const tree = parser.parse(content);
		return extractParticipantNamesFromTree(content, tree);
	},
	update(value, tr: Transaction) {
		if (tr.docChanged) {
			const newContent = tr.state.doc.toString();
			const newTree = parser.parse(newContent);
			const newParticipantsSet = extractParticipantNamesFromTree(newContent, newTree);
			if (!areSetsEqual(value, newParticipantsSet)) {
				return newParticipantsSet;
			}
		}
		return value;
	},
});

export function getParticipants(state: EditorState): ReadonlySet<string> {
	return state.field(zenumlParticipantStateField);
}

// Function to extract participant names from the syntax tree
function extractParticipantNamesFromTree(content: string, tree: Tree): ReadonlySet<string> {
	const names = new Set<string>();
	tree.cursor().iterate((nodeRef: SyntaxNodeRef) => {
		if (nodeRef.type.name === 'Participant') {
			const participantSyntaxNode = nodeRef.node;
			let childNode = participantSyntaxNode.lastChild;
			while (childNode) {
				if (childNode.type.name === 'Name' || childNode.type.name === 'Identifier') {
					const name = content.slice(childNode.from, childNode.to).trim();
					if (name) {
						names.add(name);
					}
					break;
				}
				childNode = childNode.prevSibling;
			}
		}
	});
	return names;
}

// Helper function to compare two sets
function areSetsEqual<T>(set1: ReadonlySet<T>, set2: ReadonlySet<T>): boolean {
	if (set1.size !== set2.size) {
		return false;
	}
	for (const item of set1) {
		if (!set2.has(item)) {
			return false;
		}
	}
	return true;
}
