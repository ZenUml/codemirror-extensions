# @zenuml/codemirror-extensions

CodeMirror 6 extensions for ZenUML syntax highlighting, linting, autocomplete, and theming.

## Installation

```bash
# Using npm
npm install @zenuml/codemirror-extensions

# Using yarn
yarn add @zenuml/codemirror-extensions

# Using pnpm
pnpm add @zenuml/codemirror-extensions
```

## Development

### Running the Demo

The package includes a demo application that showcases the extensions in action:

```bash
# Install dependencies
pnpm install

# Run the demo
pnpm demo
```

This will start a development server and open the demo in your browser.

### Code Formatting and Linting

This project uses [Biome](https://biomejs.dev/) for code formatting and linting:

```bash
# Check for linting issues
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Format code and fix issues
pnpm format:fix
```

VS Code users can install the [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) for automatic formatting on save.

### Building the Package

To build the package for distribution:

```bash
pnpm build
```

## Features

- Syntax highlighting for ZenUML
- Linting for ZenUML syntax
- Autocomplete suggestions

## Usage

### Basic Usage

```js
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { zenumlHighlighter, zenumlLinter, zenumlAutocomplete } from '@zenuml/codemirror-extensions';

// Create a new editor
const editor = new EditorView({
  state: EditorState.create({
    extensions: [
      zenumlHighlighter(),
      zenumlLinter(),
      autocompletion({
        override: [zenumlCompletions],
        closeOnBlur: true,
        activateOnTyping: true,
        selectOnOpen: true,
        icons: true,
      }),
    ]
  }),
  parent: document.getElementById('editor')
});
```

### Individual Extensions

You can import and use individual extensions as needed:

```js
// Import only what you need
import { zenumlHighlighter } from '@zenuml/codemirror-extensions/extensions';
import { toggleDarkMode } from '@zenuml/codemirror-extensions/dark-mode';
```

## API Reference

### Highlighter

`zenumlHighlighter()` - Provides syntax highlighting for ZenUML syntax.

### Linter

`zenumlLinter()` - Provides linting capabilities for ZenUML syntax.

### Autocomplete

`zenumlAutocomplete()` - Provides autocompletion suggestions for ZenUML.

## License

MIT
