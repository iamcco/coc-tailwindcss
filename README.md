# Tailwind CSS IntelliSense

> fork from [vscode-tailwindcss](https://github.com/bradlc/vscode-tailwindcss) v0.1.16

[Tailwind CSS](https://tailwindcss.com/) class name completion for coc.nvim

## Install

```viml
CocInstall coc-tailwindcss
```

coc-settings.json
```json
{
  "tailwind.enable": true,
  "tailwind.shortcut": "TWCSS",
  "tailwind.priority": 99
}
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
