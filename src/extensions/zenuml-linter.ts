import { syntaxTree } from '@codemirror/language';
import { type Diagnostic, linter } from '@codemirror/lint';
import type { EditorView } from '@codemirror/view';
import type { SyntaxNodeRef, Tree } from '@lezer/common';

// Import the shared participant state logic
import { getParticipants } from './zenuml-participant-manager';

interface ParticipantDefLocation {
	node: SyntaxNodeRef;
	// We might not need isDefined here if we solely rely on getParticipants for existence
}

const BraceBlockTypes = ['BraceBlock', 'GroupBraceBlock', 'StatementBraceBlock'];

function checkDocument(view: EditorView): Diagnostic[] {
	const diagnostics: Diagnostic[] = [];
	const tree = syntaxTree(view.state);

	// Get the set of defined participant names from the shared state
	const definedParticipantNames = getParticipants(view.state);

	// This map can still be useful if we need the exact node for defined participants,
	// e.g., for "unused participant" warnings at their definition site (not currently implemented).
	// For checking existence in messages, `definedParticipantNames` is now the source of truth.
	const participantDefinitionLocations = new Map<string, ParticipantDefLocation>();

	const cursor = tree.cursor();

	// First pass: collect participant definition locations (optional if only existence is needed for messages)
	// This pass is kept for now in case node locations are needed for future diagnostics on definitions.
	cursor.iterate((nodeRef: SyntaxNodeRef) => {
		if (nodeRef.type.name === 'Participant') {
			const participantSyntaxNode = nodeRef.node;
			let childNode = participantSyntaxNode.lastChild;
			while (childNode) {
				if (childNode.type.name === 'Name' || childNode.type.name === 'Identifier') {
					const participantName = view.state.doc.sliceString(childNode.from, childNode.to);
					if (participantName && definedParticipantNames.has(participantName)) {
						// Store it only if it's recognized by the shared state, mostly for its node.
						participantDefinitionLocations.set(participantName, {
							node: nodeRef,
						});
					}
					break;
				}
				childNode = childNode.prevSibling;
			}
		}
	});

	// Second pass: validate the zenuml diagram
	cursor.iterate((nodeRef: SyntaxNodeRef) => {
		// Check for syntax errors
		if (nodeRef.type.isError && nodeRef.type.name !== '⚠') {
			diagnostics.push({
				from: nodeRef.from,
				to: nodeRef.to,
				severity: 'error',
				message: 'Syntax error in zenuml diagram',
			});
		}

		if (nodeRef.type.name === 'Color') {
			const colorText = view.state.doc.sliceString(nodeRef.from, nodeRef.to);
			if (!validateColorHexCode(colorText)) {
				diagnostics.push({
					from: nodeRef.from,
					to: nodeRef.to,
					severity: 'error',
					message: 'Invalid color format',
				});
			}
		}

		// Check message participants
		if (nodeRef.type.name === 'AsyncMessage') {
			let fromNode: SyntaxNodeRef | null = null;
			let toNode: SyntaxNodeRef | null = null;

			let n = nodeRef.node.firstChild;
			while (n) {
				if (n.type.name === 'From') {
					fromNode = n.node;
				}
				if (n.type.name === 'To') {
					toNode = n.node;
				}
				n = n.nextSibling;
			}

			if (fromNode) {
				const fromParticipant = view.state.doc.sliceString(fromNode.from, fromNode.to);
				if (fromParticipant === '') {
					diagnostics.push({
						from: fromNode.from,
						to: fromNode.to,
						severity: 'error',
						message: 'Missing From participant',
					});
				} else if (!definedParticipantNames.has(fromParticipant)) {
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
					from: nodeRef.from,
					to: nodeRef.to,
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
				} else if (!definedParticipantNames.has(toParticipant)) {
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
		if (BraceBlockTypes.includes(nodeRef.type.name)) {
			if (isEmptyBlock(nodeRef.node.toTree())) {
				diagnostics.push({
					from: nodeRef.from,
					to: nodeRef.to,
					severity: 'info',
					message: 'Empty block',
				});
			}
		}

		if (nodeRef.type.name === 'Condition') {
			if (isEmptyCondition(nodeRef.node.toTree())) {
				diagnostics.push({
					from: nodeRef.from,
					to: nodeRef.to,
					severity: 'info',
					message: 'Empty condition',
				});
			}
		}

		// Check for unclosed stereotypes
		if (nodeRef.type.name === 'Stereotype') {
			const stereotypeText = view.state.doc.sliceString(nodeRef.from, nodeRef.to);
			if (stereotypeText.startsWith('<<') && !stereotypeText.endsWith('>>')) {
				diagnostics.push({
					from: nodeRef.from,
					to: nodeRef.to,
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

const listOfEmptyBlockTypes = ['Newline', 'OpenBrace', 'CloseBrace', '⚠', ...BraceBlockTypes];
function isEmptyBlock(node: Tree): boolean {
	let isEmpty = true;
	try {
		node.cursor().iterate(
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

const booleanKeywords = ['TrueKeyword', 'FalseKeyword', 'NullKeyword', 'UndefinedKeyword'];
function isEmptyCondition(node: Tree): boolean {
	let isEmpty = true;
	try {
		node.cursor().iterate(
			(child: SyntaxNodeRef) => {
				if (child.type.name === 'Identifier' || booleanKeywords.includes(child.type.name)) {
					isEmpty = false;
					throw new Error('Not an empty condition');
				}
			},
			(child: SyntaxNodeRef) => {
				if (child.type.name === 'Identifier' || booleanKeywords.includes(child.type.name)) {
					isEmpty = false;
					throw new Error('Not an empty condition');
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
