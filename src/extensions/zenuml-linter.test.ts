import { EditorState } from '@codemirror/state';
import { EditorView } from 'codemirror';
import { afterEach, describe, expect, it } from 'vitest';
import { zenumlHighlighter } from './zenuml-highlighter';
import { checkZenuml } from './zenuml-linter';
import { zenumlParticipantStateField } from './zenuml-participant-manager';

describe('ZenUML Linter', () => {
	async function getDiagnostics(doc: string) {
		const state = EditorState.create({
			doc: doc.trim(),
			extensions: [zenumlParticipantStateField, zenumlHighlighter()],
		});
		const view = new EditorView({ state, parent: document.body });
		const diagnostics = await checkZenuml(view);
		view.destroy();
		return diagnostics;
	}

	it('should detect no linting errors', async () => {
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
	OrderService."create(payload) 6" {
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
		const diagnostics = await getDiagnostics(doc);

		expect(diagnostics).toHaveLength(0);
	});

	it('should detect no errors for function parameters', async () => {
		const doc = `
			OrderController.post(payload12) {
				order = new Order(payload)
			}
		`;
		const diagnostics = await getDiagnostics(doc);

		expect(diagnostics).toHaveLength(0);
	});
	it('should detect unclosed stereotypes', async () => {
		const doc = `
      <<interface A
    `;
		const diagnostics = await getDiagnostics(doc);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0].message).toBe('Unclosed stereotype');
	});

	it('should detect invalid color formats', async () => {
		const doc = `
      participant A #12
    `;
		const diagnostics = await getDiagnostics(doc);

		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0].message).toBe('Invalid color format');
	});

	it('should detect empty group block', async () => {
		const doc = `
      group test {
      }
    `;
		const diagnostics = await getDiagnostics(doc);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0].message).toBe('Empty block');
	});

	it('should detect empty if statement block', async () => {
		const doc = `
      if (true) {
      }
    `;
		const diagnostics = await getDiagnostics(doc);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0].message).toBe('Empty block');
	});

	it('not a empty block', async () => {
		const doc = `
      group test {
        @Lambda PurchaseService
        @AzureFunction InvoiceService
      }
    `;
		const diagnostics = await getDiagnostics(doc);
		expect(diagnostics).toHaveLength(0);
	});

	it('should detect empty condition', async () => {
		const doc = ` if () {
        x = 1
      }
    `;
		const diagnostics = await getDiagnostics(doc);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0].message).toBe('Empty condition');
	});

	it('should detect undefined participants', async () => {
		const doc = `
       A -> B:
    `;

		const diagnostics = await getDiagnostics(doc);
		expect(diagnostics).toHaveLength(2);
		expect(diagnostics[0].message).toBe('Undefined participant: A');
		expect(diagnostics[1].message).toBe('Undefined participant: B');
	});

	it('should detect missing to participant', async () => {
		const doc = `
      A ->
    `;
		const diagnostics = await getDiagnostics(doc);
		expect(diagnostics).toHaveLength(2);
		expect(diagnostics[0].message).toBe('Undefined participant: A');
		expect(diagnostics[1].message).toBe('Missing To participant');
	});

	it('should detect missing from participant', async () => {
		const doc = `
      -> B: message
    `;
		const diagnostics = await getDiagnostics(doc);
		expect(diagnostics).toHaveLength(2);
		expect(diagnostics[0].message).toBe('Missing From participant');
		expect(diagnostics[1].message).toBe('Undefined participant: B');
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});
});
