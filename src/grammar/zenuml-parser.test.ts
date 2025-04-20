import type { Tree, TreeCursor } from '@lezer/common';
import { describe, expect, it } from 'vitest';
import { parser } from './zenuml-parser.js';

// Function to log detailed token information
function logTokenDetails(cursor: TreeCursor, input: string) {
	console.log(`Token: ${cursor.name}`);
	console.log(`Range: ${cursor.from}-${cursor.to}`);
	console.log(`Text: "${input.slice(cursor.from, cursor.to)}"`);
	console.log(`Node Type: ${cursor.type}`);
	console.log('---');
}

// Walk the tree and log details of each token
function walkTree(cursor: TreeCursor, input: string, indent = 0) {
	do {
		const padding = ' '.repeat(indent * 2);
		console.log(
			`${padding}${cursor.name} (${cursor.from}:${cursor.to}): "${input.slice(
				cursor.from,
				cursor.to
			)}"`
		);
		logTokenDetails(cursor, input);

		if (cursor.name === '⚠') {
			console.log(`${padding}ERROR NODE at position ${cursor.from}-${cursor.to}`);
			console.log(
				`${padding}Context: "${input.slice(
					Math.max(0, cursor.from - 10),
					cursor.from
				)}【${input.slice(cursor.from, cursor.to)}】${input.slice(
					cursor.to,
					Math.min(input.length, cursor.to + 10)
				)}"`
			);
		}

		if (cursor.firstChild()) {
			walkTree(cursor, input, indent + 1);
			cursor.parent();
		}
	} while (cursor.nextSibling());
}

function parse(code: string): Tree {
	return parser.parse(code);
}

function hasNode(tree: Tree, type: string): boolean {
	let found = false;
	tree.cursor().iterate((node) => {
		if (node.type.name === type) found = true;
	});
	return found;
}

describe('ZenUML Parser', () => {
	it('print parser tree', () => {
		const code = `
participant User
participant System
User -> System: login()
if (isValid) {
	User -> System: success()
} else {
	User -> System: failure()
}`;
		const tree = parse(code.trim());
		walkTree(tree.cursor(), code.trim());
	});

	it('parses title', () => {
		const tree = parse('title My Sequence Diagram');
		expect(hasNode(tree, 'Title')).toBe(true);
		expect(hasNode(tree, 'TitleContent')).toBe(true);
	});

	describe('parses participant declarations', () => {
		it('parses participant keyword', () => {
			const tree = parse('participant User');
			expect(hasNode(tree, 'Participant')).toBe(true);
			expect(hasNode(tree, 'ParticipantKeyword')).toBe(true);
			expect(String(tree)).toBe('Program(Head(Participant(ParticipantKeyword,Name(Identifier))))');
		});

		it('parses stereotype', () => {
			const tree = parse('<<interface>> User');
			expect(hasNode(tree, 'Stereotype')).toBe(true);
			expect(String(tree)).toBe(
				'Program(Head(Participant(Stereotype(OpenStereotype,Name(Identifier),CloseStereotype),Name(Identifier))))'
			);
		});

		it('parses participant type', () => {
			const tree = parse('@actor User');
			expect(hasNode(tree, 'ParticipantType')).toBe(true);
		});
	});

	it('parses simple async message', () => {
		const tree = parse('User -> System: login()');
		expect(hasNode(tree, 'AsyncMessage')).toBe(true);
		expect(hasNode(tree, 'From')).toBe(true);
		expect(hasNode(tree, 'ArrowOp')).toBe(true);
		expect(hasNode(tree, 'To')).toBe(true);
		expect(hasNode(tree, 'Function')).toBe(true);
	});

	it('parses if statement', () => {
		const tree = parse(`
      if (isValid) {
        User -> System: success()
      } else {
        User -> System: failure()
      }
    `);
		expect(hasNode(tree, 'Alternative')).toBe(true);
		expect(hasNode(tree, 'IfBlock')).toBe(true);
		expect(hasNode(tree, 'ElseBlock')).toBe(true);
	});

	it('parses while loop', () => {
		const tree = parse(`
      while (hasMore) {
        User -> System: process()
      }
    `);
		expect(hasNode(tree, 'Loop')).toBe(true);
	});

	it('parses function call', () => {
		const tree = parse('user.login()');
		expect(hasNode(tree, 'Function')).toBe(true);
		expect(hasNode(tree, 'Signature')).toBe(true);
		expect(hasNode(tree, 'MethodName')).toBe(true);
		expect(hasNode(tree, 'Dot')).toBe(true);
		expect(hasNode(tree, 'OpenParen')).toBe(true);
		expect(hasNode(tree, 'CloseParen')).toBe(true);
	});

	it('parses group', () => {
		const tree = parse(`
      group authentication {
        User -> System: login()
      }
    `);
		expect(hasNode(tree, 'Group')).toBe(true);
	});

	it('parses complex expressions', () => {
		const tree = parse(`
      if (count > 0 && isValid || !isDone) {
        User -> System: process()
      }
    `);
		expect(hasNode(tree, 'BinaryExpression')).toBe(true);
		expect(hasNode(tree, 'UnaryExpression')).toBe(true);
	});

	it('parses stereotypes', () => {
		const tree = parse('<<interface>> System');
		expect(hasNode(tree, 'Stereotype')).toBe(true);
	});

	it('parses annotations', () => {
		const tree = parse('@Starter\n@Return User -> System: response');
		expect(hasNode(tree, 'StarterExp')).toBe(true);
		expect(hasNode(tree, 'Return')).toBe(true);
	});

	it('parses try-catch-finally', () => {
		const tree = parse(`
      try {
        User -> System: riskyOperation()
      } catch (error) {
        User -> System: handleError()
      } finally {
        User -> System: cleanup()
      }
    `);
		expect(hasNode(tree, 'TryCatchFinally')).toBe(true);
		expect(hasNode(tree, 'TryBlock')).toBe(true);
		expect(hasNode(tree, 'CatchBlock')).toBe(true);
		expect(hasNode(tree, 'FinallyBlock')).toBe(true);
	});

	it('parses comments', () => {
		const tree = parse(`
      // This is a comment
      User -> System: login()
    `);
		expect(hasNode(tree, 'Comment')).toBe(true);
	});
});
