import { syntaxTree } from '@codemirror/language';
import { type Diagnostic, linter } from '@codemirror/lint';
import type { EditorView } from '@codemirror/view';
import type { SyntaxNodeRef, TreeCursor } from '@lezer/common';

interface ParticipantInfo {
	name: string;
	node: SyntaxNodeRef;
	isDefined: boolean;
}

function checkDocument(view: EditorView): Diagnostic[] {
	const diagnostics: Diagnostic[] = [];
	const tree = syntaxTree(view.state);
	const participants = new Map<string, ParticipantInfo>();

	// First pass: collect all defined participants
	tree.cursor().iterate((node) => {
		if (node.type.name === 'Participant') {
			const c = node as unknown as TreeCursor;
			c.firstChild();
			while (c.nextSibling()) {
				let participantName = '';
				if (c.type.name === 'Name') {
					participantName = view.state.doc.sliceString(c.node.from, c.node.to);
				}
				participants.set(participantName, {
					name: participantName,
					node: node,
					isDefined: true,
				});
			}
		}
	});

	// Second pass: validate the zenuml diagram
	const cursor = tree.cursor();
	cursor.iterate((node) => {
		// Check for syntax errors
		if (node.type.isError && node.type.name !== '⚠') {
			diagnostics.push({
				from: node.from,
				to: node.to,
				severity: 'error',
				message: 'Syntax error in zenuml diagram',
			});
		}

		if (node.type.name === 'Color') {
			const colorText = view.state.doc.sliceString(node.from, node.to);
			if (!validateColorHexCode(colorText)) {
				diagnostics.push({
					from: node.from,
					to: node.to,
					severity: 'error',
					message: 'Invalid color format',
				});
			}
		}

		// Check message participants
		if (node.type.name === 'AsyncMessage') {
			let fromNode: SyntaxNodeRef | null = null;
			let toNode: SyntaxNodeRef | null = null;

			const c = node as unknown as TreeCursor;
			c.firstChild();
			do {
				if (c.type.name === 'From') {
					fromNode = c.node;
				}
				if (c.type.name === 'To') {
					toNode = c.node;
				}
			} while (c.nextSibling());

			if (fromNode) {
				const fromParticipant = view.state.doc.sliceString(fromNode.from, fromNode.to);
				if (fromParticipant === '') {
					diagnostics.push({
						from: fromNode.from,
						to: fromNode.to,
						severity: 'error',
						message: 'Missing From participant',
					});
				} else if (!participants.has(fromParticipant)) {
					diagnostics.push({
						from: fromNode.from,
						to: fromNode.to,
						severity: 'warning',
						message: `Undefined participant: ${fromParticipant}`,
					});
				}
			}

			if (!toNode) {
				diagnostics.push({
					from: node.from,
					to: node.to,
					severity: 'error',
					message: 'Missing To participant',
				});
			} else {
				const toParticipant = view.state.doc.sliceString(toNode.from, toNode.to);
				if (toParticipant === '') {
					diagnostics.push({
						from: toNode.from,
						to: toNode.to,
						severity: 'error',
						message: 'Missing To participant',
					});
				} else if (!participants.has(toParticipant)) {
					diagnostics.push({
						from: toNode.from,
						to: toNode.to,
						severity: 'warning',
						message: `Undefined participant: ${toParticipant}`,
					});
				}
			}
		}

		// // Check for empty blocks
		if (node.type.name === 'BraceBlock') {
			if (isEmptyBlock(node as unknown as TreeCursor)) {
				diagnostics.push({
					from: node.from,
					to: node.to,
					severity: 'info',
					message: 'Empty block',
				});
			} else {
				cursor.parent();
			}
		}

		// Check for unclosed stereotypes
		if (node.type.name === 'Stereotype') {
			const stereotypeText = view.state.doc.sliceString(node.from, node.to);
			if (stereotypeText.startsWith('<<') && !stereotypeText.endsWith('>>')) {
				diagnostics.push({
					from: node.from,
					to: node.to,
					severity: 'error',
					message: 'Unclosed stereotype',
				});
			}
		}
	});

	return diagnostics;
}

function validateColorHexCode(colorText: string): boolean {
	return /^#([0-9a-fA-F]{6})$/.test(colorText);
}

const listOfEmptyBlockTypes = ['Newline', 'OpenBrace', 'CloseBrace', 'BraceBlock', '⚠'];
function isEmptyBlock(node: TreeCursor): boolean {
	let isEmpty = true;
	try {
		node.iterate(
			(child: SyntaxNodeRef) => {
				if (!listOfEmptyBlockTypes.includes(child.type.name)) {
					isEmpty = false;
					throw new Error('Not an empty block');
				}
			},
			(child: SyntaxNodeRef) => {
				if (!listOfEmptyBlockTypes.includes(child.type.name)) {
					isEmpty = false;
					throw new Error('Not an empty block');
				}
			}
		);

		return isEmpty;
		// biome-ignore lint/correctness/noUnusedVariables: Catching and ignoring the error to determine if block is empty
	} catch (e) {
		return isEmpty;
	}
}
// Export both the linter extension and the direct diagnostic function
export const checkZenuml = checkDocument;
export const zenumlLinter = () => linter((view) => checkDocument(view));
