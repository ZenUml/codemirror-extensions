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
	if (
		result?.errorDetails &&
		Array.isArray(result.errorDetails) &&
		result.errorDetails.length > 0
	) {
		// Find the first and last error positions to create a range
		const firstError = result.errorDetails[0];
		const lastError = result.errorDetails[result.errorDetails.length - 1];

		// Convert line/column to position in the document for first error
		const firstLine = firstError.line - 1; // Convert to 0-indexed
		const firstColumn = firstError.column;

		// Convert line/column to position in the document for last error
		const lastLine = lastError.line - 1; // Convert to 0-indexed
		const lastColumn = lastError.column;

		// Calculate the position in the document
		const lines = doc.split('\n');

		let firstPosition = 0;
		if (firstLine >= 0 && firstLine < lines.length) {
			for (let i = 0; i < firstLine; i++) {
				firstPosition += lines[i].length + 1; // +1 for newline character
			}
			firstPosition += firstColumn;
		}

		let lastPosition = 0;
		if (lastLine >= 0 && lastLine < lines.length) {
			for (let i = 0; i < lastLine; i++) {
				lastPosition += lines[i].length + 1; // +1 for newline character
			}
			lastPosition += lastColumn;
		}

		// Ensure the range is valid (from <= to)
		const from = Math.min(firstPosition, lastPosition);
		const to = Math.max(firstPosition, lastPosition) + 1; // Extend to include the last error character

		diagnostics.push({
			from,
			to,
			severity: 'error',
			message: firstError.msg || 'Syntax error in zenuml diagram',
		});
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
