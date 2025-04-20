import { EditorState } from '@codemirror/state';
import { EditorView } from 'codemirror';
import { afterEach, describe, expect, it } from 'vitest';
import { parser } from '../grammar/zenuml-parser';
import { zenumlHighlighter } from './zenuml-highlighter';
import { checkZenuml } from './zenuml-linter';

describe('Sequence Linter', () => {
    function getDiagnostics(doc: string) {
        const state = EditorState.create({
            doc: doc.trim(),
            extensions: [
                // Add the ZenUML language support
                zenumlHighlighter(),
            ]
        });
        const view = new EditorView({ state, parent: document.body });
        const diagnostics = checkZenuml(view);
        view.destroy();
        return diagnostics;
    }

    it('should detect no linting errors', () => {
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
}`
        const diagnostics = getDiagnostics(doc);

        expect(diagnostics).toHaveLength(0);
    })

    it('should detect no errors for function parameters', () => {
        const doc = `
			OrderController.post(payload12) {
				order = new Order(payload)
			}
		`;
        const diagnostics = getDiagnostics(doc);
        const tree = parser.parse(doc);
        console.log(tree.toString());
        expect(diagnostics).toHaveLength(0);
    })
    it('should detect unclosed stereotypes', () => {
        const doc = `
      <<interface A
    `;
        const diagnostics = getDiagnostics(doc);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toBe('Unclosed stereotype');
    });

    it('should detect invalid color formats', () => {
        const doc = `
      participant A #12
    `;
        const diagnostics = getDiagnostics(doc);

        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toBe('Invalid color format');
    });

    it('should detect empty blocks', () => {
        const doc = `
      group test {
      }
    `;
        const diagnostics = getDiagnostics(doc);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toBe('Empty block');
    });

    it('not a empty block', () => {
        const doc = `
      group test {
        @Lambda PurchaseService
        @AzureFunction InvoiceService
      }
    `;
        const diagnostics = getDiagnostics(doc);
        const tree = parser.parse(doc);
        console.log(tree);
        expect(diagnostics).toHaveLength(0);
    })


    it('should detect undefined participants', () => {
        const doc = `
       A -> B:
    `;


        const diagnostics = getDiagnostics(doc);
        expect(diagnostics).toHaveLength(2);
        expect(diagnostics[0].message).toBe('Undefined participant: A');
        expect(diagnostics[1].message).toBe('Undefined participant: B');
    });

    it('should detect missing to participant', () => {
        const doc = `
      A ->
    `;
        const diagnostics = getDiagnostics(doc);
        expect(diagnostics).toHaveLength(2);
        expect(diagnostics[0].message).toBe('Undefined participant: A');
        expect(diagnostics[1].message).toBe('Missing To participant');
    });

    it('should detect missing from participant', () => {
        const doc = `
      -> B: message
    `;
        const diagnostics = getDiagnostics(doc);
        expect(diagnostics).toHaveLength(2);
        expect(diagnostics[0].message).toBe('Missing From participant');
        expect(diagnostics[1].message).toBe('Undefined participant: B');
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });
});