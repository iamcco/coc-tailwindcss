# Tailwind CSS IntelliSense

> fork from [vscode-tailwindcss](https://github.com/bradlc/vscode-tailwindcss) v0.2.0

[Tailwind CSS](https://tailwindcss.com/) class name completion for coc.nvim

![screenshot](https://user-images.githubusercontent.com/5492542/52547452-c7e50c80-2e02-11e9-8214-e71e14b2cfb0.png)

## Install

```viml
CocInstall coc-tailwindcss
```

## Features

Tailwind CSS IntelliSense uses your projects Tailwind installation and configuration to provide suggestions as you type.

### HTML (including Vue, JSX, PHP etc.)

- Class name suggestions
  - Suggestions include color previews where applicable, for example for text and background colors
  - They also include a preview of the actual CSS for that class name
- CSS preview when hovering over class names

### CSS

- Suggestions when using `@apply` and `config()`
- Suggestions when using the `@screen` directive
- Improves syntax highlighting when using `@apply` and `config()`
