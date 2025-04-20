import { LRLanguage, LanguageSupport } from '@codemirror/language';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Compartment } from '@codemirror/state';
import { styleTags, tags as t } from '@lezer/highlight';
import type { EditorView } from 'codemirror';
import { parser } from '../grammar/zenuml-parser.js';

const zenumlHighlighting = styleTags({
	TitleKeyword: t.heading,
	LineContent: t.content,

	// Control flow keywords
	'IfKeyword ElseKeyword WhileKeyword ReturnKeyword NewKeyword TryKeyword CatchKeyword FinallyKeyword ParKeyword':
		t.controlKeyword,
	'NullKeyword TrueKeyword FalseKeyword': t.bool,

	// Participant keywords
	'ParticipantKeyword ActorKeyword StereotypeKeyword StarterAnnotation': t.heading,

	//Structural keywords
	'GroupKeyword OptKeyword CriticalKeyword SectionKeyword FrameKeyword': t.heading,

	// Action keywords
	'MessageKeyword AsyncMessageKeyword CreationKeyword': t.heading,

	// Literals
	String: t.string,
	Number: t.number,

	// Identifiers
	Type: t.typeName,

	// --- Context-Specific Identifiers ---
	// Style Identifier when it's directly under nodes where it represents a 'Name'
	'Participant/Identifier': t.variableName, // Participant declaration Name
	'Group/Identifier': t.variableName, // Group declaration Name
	'Stereotype/Identifier': t.variableName, // Name inside a Stereotype
	'From/Identifier': t.variableName, // 'From' participant Name
	'To/Identifier': t.variableName, // 'To' participant Name (Should cover OrderController)
	'Label/Identifier': t.variableName, // Name used as a Label

	// Style Identifier when it's directly under a node where it represents a 'MethodName'
	'Signature/Identifier': t.propertyName, // Method name within a Signature (Should cover post)

	// Style other specific identifier uses
	'Type/Identifier': t.typeName, // Identifier used as a Type
	'Assignee/Identifier': t.variableName, // Identifier used as an Assignee (LHS of '=')
	'Construct/Identifier': t.typeName, // Identifier used in 'new Construct(...)'
	'MethodName/Identifier': t.propertyName,

	// Punctuation
	'OpenBrace CloseBrace': t.brace,
	'OpenParen CloseParen': t.paren,
	Arrow: t.operator,
	Dot: t.operator,
	Comma: t.separator,
	SemiColon: t.separator,

	// Comments
	Comment: t.lineComment,

	// Special syntax
	Annotation: t.meta,
	Color: t.color,
	Stereotype: t.className,
	Label: t.labelName,

	// Expressions
	UnaryExpression: t.operator,
	BinaryExpression: t.operator,
	FunctionExpression: t.operator,
	InvocationExp: t.operator,
	Parameters: t.operator,
	Parameter: t.operator,
	Declaration: t.operator,
	ArrowOp: t.operator,
	Function: t.operator,
});

// Light theme colors
const lightHighlightStyle = HighlightStyle.define([
	{ tag: t.heading, color: '#0d47a1', fontWeight: 'bold' },
	{ tag: t.content, color: '#1976d2' },
	{ tag: t.keyword, color: '#d32f2f' },
	{ tag: t.string, color: '#2e7d32' },
	{ tag: t.number, color: '#1976d2' },
	{ tag: t.bool, color: '#d32f2f' },
	{ tag: t.variableName, color: '#0288d1' },
	{ tag: t.typeName, color: '#7b1fa2' },
	{ tag: t.propertyName, color: '#1565c0' },
	{ tag: t.operator, color: '#ed6c02' },
	{ tag: t.separator, color: '#757575' },
	{ tag: t.lineComment, color: '#757575', fontStyle: 'italic' },
	{ tag: t.meta, color: '#9c27b0' },
	{ tag: t.color, color: '#d32f2f' },
	{ tag: t.className, color: '#2e7d32' },
	{ tag: t.labelName, color: '#0288d1' },
	{ tag: t.brace, color: '#9c27b0' },
]);

// Dark theme colors
const highlightStyle = HighlightStyle.define([
	{ tag: t.heading, color: '#90caf9', fontWeight: 'bold' },
	{ tag: t.content, color: '#81c784' },
	{ tag: t.keyword, color: '#ff79c6' },
	{ tag: t.string, color: '#81c784' },
	{ tag: t.number, color: '#64b5f6' },
	{ tag: t.bool, color: '#bd93f9' },
	{ tag: t.variableName, color: '#4fc3f7' },
	{ tag: t.typeName, color: '#ce93d8' },
	{ tag: t.propertyName, color: '#ffb74d' },
	{ tag: t.operator, color: '#ffb74d' },
	{ tag: t.separator, color: '#ffb74d' },
	{ tag: t.lineComment, color: '#6272a4', fontStyle: 'italic' },
	{ tag: t.meta, color: '#e1bee7' },
	{ tag: t.color, color: '#bd93f9' },
	{ tag: t.className, color: '#81c784' },
	{ tag: t.labelName, color: '#ffb74d' },
	{ tag: t.brace, color: '#bd93f9' },
]);

// Create a compartment for the highlighting style
const highlightStyleCompartment = new Compartment();

export const zenumlLanguage = LRLanguage.define({
	parser: parser.configure({
		props: [zenumlHighlighting],
	}),
	languageData: {
		commentTokens: { line: '//' },
		closeBrackets: { brackets: ['(', '[', '{', "'", '"'] },
		indentOnInput: /^\s*[{}]$/,
	},
});

export function zenumlHighlighter(mode?: 'light' | 'dark') {
	switch (mode) {
		case 'dark':
			return new LanguageSupport(zenumlLanguage, [
				highlightStyleCompartment.of(syntaxHighlighting(highlightStyle)),
			]);
		case 'light':
			return new LanguageSupport(zenumlLanguage, [
				highlightStyleCompartment.of(syntaxHighlighting(lightHighlightStyle)),
			]);
	}

	const initialTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
	const initialStyle = initialTheme === 'dark' ? highlightStyle : lightHighlightStyle;

	return new LanguageSupport(zenumlLanguage, [
		highlightStyleCompartment.of(syntaxHighlighting(initialStyle)),
	]);
}

// Export a function to update the highlighting style
export function updateHighlightStyle(view: EditorView, isDark: boolean) {
	const style = isDark ? highlightStyle : lightHighlightStyle;
	view.dispatch({
		effects: highlightStyleCompartment.reconfigure(syntaxHighlighting(style)),
	});
}
