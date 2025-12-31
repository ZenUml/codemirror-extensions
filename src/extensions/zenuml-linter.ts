import { type Diagnostic, linter } from '@codemirror/lint';
import type { EditorView } from '@codemirror/view';
// @ts-ignore
import Zenuml from '@zenuml/core';
const zenuml = new Zenuml(document.createElement('div'));
async function checkDocument(view: EditorView): Promise<Diagnostic[]> {
	const diagnostics: Diagnostic[] = [];
	const doc = view.state.doc.toString();
	const result = await zenuml.parse(doc);
	// If the parse result contains syntax errors, add them to diagnostics
	if (result && result.errorDetails && Array.isArray(result.errorDetails) && result.errorDetails.length > 0) {
		// Only process the first error detail
		const error = result.errorDetails[0];
		// Convert line/column to position in the document
		// Note: line is 1-indexed, column is 0-indexed in the ParseResult
		const line = error.line - 1; // Convert to 0-indexed
		const column = error.column;

		// Calculate the position in the document
		const lines = doc.split('\n');
		if (line >= 0 && line < lines.length) {
			// Calculate the character position based on line and column
			let position = 0;
			for (let i = 0; i < line; i++) {
				position += lines[i].length + 1; // +1 for newline character
			}
			const from = position + column;
			const to = from + 1; // Default to single character at the error position

			diagnostics.push({
				from,
				to,
				severity: 'error',
				message: error.msg || 'Syntax error in zenuml diagram',
			});
		}
	}

	// If parsing failed overall, add a general error
	if (result && !result.pass) {
		// If there were no specific error details, add a general error
		if (!result.errorDetails || result.errorDetails.length === 0) {
			diagnostics.push({
				from: 0,
				to: doc.length,
				severity: 'error',
				message: 'Syntax error in zenuml diagram',
			});
		}
	}
	return diagnostics;
}

// Export both the linter extension and the direct diagnostic function
export const checkZenuml = checkDocument;
export const zenumlLinter = () => linter(async (view) => await checkDocument(view));
