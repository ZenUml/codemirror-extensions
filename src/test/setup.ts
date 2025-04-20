import { Window } from 'happy-dom';
import { beforeAll } from 'vitest';

beforeAll(() => {
	const window = new Window({
		url: 'http://localhost',
		width: 1024,
		height: 768,
	});

	// Mock MutationObserver
	class MockMutationObserver {
		disconnect() {}
		observe(_target: Node, _options: MutationObserverInit) {}
		takeRecords(): MutationRecord[] {
			return [];
		}
	}
	global.MutationObserver = MockMutationObserver;

	// @ts-expect-error
	global.document = window.document;
	// @ts-expect-error
	global.window = window as unknown as Window & typeof globalThis;
});
