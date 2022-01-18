# Tailwind CSS IntelliSense

> fork from [vscode-tailwindcss](https://github.com/bradlc/vscode-tailwindcss) v0.2.0

[Tailwind CSS](https://tailwindcss.com/) class name completion for coc.nvim

![image](https://user-images.githubusercontent.com/5492542/72122448-e6e47980-3398-11ea-908f-820a64b16b47.png)

## Install

```viml
CocInstall coc-tailwindcss
```

or with [vim-plug](https://github.com/junegunn/vim-plug),
in your `.vimrc`/`init.vim` inside the `plug#begin/end` block:

```viml
Plug 'iamcco/coc-tailwindcss',  {'do': 'yarn install --frozen-lockfile && yarn run build'}
```

Create tailwindCSS configuration in your project

> this extension need the configuration exists in your project

``` bash
tailwind init
```

## Settings

- `tailwindCSS.trace.server`: Trace level of tailwindCSS language server, default: `off`
- `tailwindCSS.custom.serverPath`: Custom path to server module. If there is no setting, the built-in module will be used, default: `""`
- `tailwindCSS.emmetCompletions`: Enable class name completions when using Emmet-style syntax, for example `div.bg-red-500.uppercase`, default: `false`
- `tailwindCSS.includeLanguages`: Enable features in languages that are not supported by default. Add a mapping here between the new language and an already supported language. E.g.: `{"plaintext": "html"}`, default: `{ "eelixir": "html", "elixir": "html", "eruby": "html", "htmldjango": "html", "html.twig": "html" }`
- `tailwindCSS.files.exclude`: Configure glob patterns to exclude from all IntelliSense features. Inherits all glob patterns from the `#files.exclude#` setting, default: ["**/.git/**", "**/node_modules/**", "**/.hg/**"]
- `tailwindCSS.classAttributes`: The HTML attributes for which to provide class completions, hover previews, linting etc, default: `["class", "className", "ngClass"]`
- `tailwindCSS.validate`: Enable linting. Rules can be configured individually using the `tailwindcss.lint.*` settings, default: `true`
- `tailwindCSS.lint.cssConflict`: Class names on the same HTML element which apply the same CSS property or properties, valid option ["ignore", "warning", "error"], default: `warning`
- `tailwindCSS.lint.invalidApply`: Unsupported use of the [`@apply` directive](https://tailwindcss.com/docs/functions-and-directives/#apply), valid option ["ignore", "warning", "error"], default: `error`
- `tailwindCSS.lint.invalidScreen`: Unknown screen name used with the [`@screen` directive](https://tailwindcss.com/docs/functions-and-directives/#screen), valid option ["ignore", "warning", "error"], default: `error`
- `tailwindCSS.lint.invalidVariant`: Unknown variant name used with the [`@variants` directive](https://tailwindcss.com/docs/functions-and-directives/#variants), valid option ["ignore", "warning", "error"], default: `error`
- `tailwindCSS.lint.invalidConfigPath`: Unknown or invalid path used with the [`theme` helper](https://tailwindcss.com/docs/functions-and-directives/#theme), valid option ["ignore", "warning", "error"], default: `error`
- `tailwindCSS.lint.invalidTailwindDirective`: Unknown value used with the [`@tailwind` directive](https://tailwindcss.com/docs/functions-and-directives/#tailwind), valid option ["ignore", "warning", "error"], default: `error`
- `tailwindCSS.lint.recommendedVariantOrder`: Class variants not in the recommended order (applies in [JIT mode](https://tailwindcss.com/docs/just-in-time-mode) only), valid option ["ignore", "warning", "error"], default: `error`
- `tailwindCSS.inspectPort`: Enable the Node.js inspector agent for the language server and listen on the specified port, default: `null`

## Features

Tailwind CSS IntelliSense uses your projects Tailwind installation and configuration
to provide suggestions as you type.

### HTML (including Vue, JSX, PHP etc.)

- Class name suggestions
  - Suggestions include color previews where applicable, for example for text and background colors
  - They also include a preview of the actual CSS for that class name
- CSS preview when hovering over class names

### CSS

- Suggestions when using `@apply` and `config()`
- Suggestions when using the `@screen` directive
- Improves syntax highlighting when using `@apply` and `config()`

# Headwind

> fork from [headwind](https://github.com/heybourn/headwind)

Headwind is an opinionated Tailwind CSS class sorter for coc.nvim.
It enforces consistent ordering of classes by parsing your code and reprinting class tags to follow a given order.

> Headwind runs on save, will remove duplicate classes and can even sort entire workspaces.

## Usage

You can trigger Headwind by:

**Commands**

- `tailwindCSS.headwind.sortTailwindClasses` Sort Tailwind CSS Classes
- `tailwindCSS.headwind.sortTailwindClassesOnWorkspace` Sort Tailwind CSS Classes on Entire Workspace

Headwind can sort individual files by running `tailwindCSS.headwind.sortTailwindClasses` via the Command Palette.
Workspaces can also be sorted by running `tailwindCSS.headwind.sortTailwindClassesOnWorkspace`.

Any breakpoints or unknown classes will be moved to the end of the class list, whilst duplicate classes will be removed.

## Customisation

Headwind ships with a default class order (located in [package.json](package.json)).
You can edit this (and other settings) to your liking on the extension settings page.

### `tailwindCSS.headwind.classRegex`:

An object with language IDs as keys and their values determining the regex to search for Tailwind CSS classes.
The default is located in [package.json](package.json) but this can be customized to suit your needs.

There can be multiple capturing groups, that should only contain a string with Tailwind CSS
classes (without any apostrophies etc.). If a new group, which doesn't contain the `class` string,
is created, ensure that it is non-capturing by using `(?:)`.

Example from `package.json`:

```json
"tailwindCSS.headwind.classRegex": {
		"html": "\\bclass\\s*=\\s*[\\\"\\']([_a-zA-Z0-9\\s\\-\\:\\/]+)[\\\"\\']",
		"javascriptreact": "(?:\\bclassName\\s*=\\s*[\\\"\\']([_a-zA-Z0-9\\s\\-\\:\\/]+)[\\\"\\'])|(?:\\btw\\s*`([_a-zA-Z0-9\\s\\-\\:\\/]*)`)"
}
```

### `tailwindCSS.headwind.sortTailwindClasses`:

An array that determines Headwind's default sort order.

### `tailwindCSS.headwind.removeDuplicates`:

Headwind will remove duplicate class names by default. This can be toggled on or off.

`"tailwindCSS.headwind.removeDuplicates": false`

### `tailwindCSS.headwind.runOnSave`:

Headwind will run on save by default (if a `tailwind.config.js` file is present within your working directory). This can be toggled on or off.

`"tailwindCSS.headwind.runOnSave": false`
