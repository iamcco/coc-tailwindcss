# Tailwind CSS IntelliSense

> fork from [vscode-tailwindcss](https://github.com/bradlc/vscode-tailwindcss) v0.2.0

[Tailwind CSS](https://tailwindcss.com/) class name completion for coc.nvim

![image](https://user-images.githubusercontent.com/5492542/72122448-e6e47980-3398-11ea-908f-820a64b16b47.png)

## Install

```viml
CocInstall coc-tailwindcss
```

Create tailwindCSS configuration in your project

> this extension need the configuration exists in your project

``` bash
tailwind init
```

## Settings

- `tailwindCSS.trace.server` Trace level of tailwindCSS language server, default: `off`
- `tailwindCSS.emmetCompletions` Enable class name completions for Emmet-style syntax, default: `false`
- `tailwindCSS.cssLanguages` css languages completion support, default:

  ``` jsonc
  [ "css", "less", "postcss", "sass", "scss", "stylus", "vue" ]
  ```

- `tailwindCSS.jsLanguages` javascript languages completion support, default:

  ``` jsonc
  [ "javascript", "javascriptreact", "reason", "typescriptreact" ]
  ```

- `tailwindCSS.htmlLanguages` html languages completion support, default:

  ``` jsonc
  [ "blade", "edge", "eelixir", "ejs", "elixir", "erb", "eruby", "haml", "handlebars", "html", "HTML (EEx)", "HTML (Eex)", "html.twig", "jade", "leaf", "markdown", "njk", "nunjucks", "php", "razor", "slim", "svelte", "twig", "vue" ]
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
