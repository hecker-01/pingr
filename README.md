# Wordr

A client-side Vue 3 app that converts Markdown files into Word documents (.docx). No server required - everything runs in the browser.

## Features

- **Paste or type** Markdown directly in the editor
- **Drag & drop** `.md` files to import
- **Live preview** with GitHub Flavored Markdown support
- **Download** as `.docx` with one click
- Supports headings, bold, italic, strikethrough, ordered/unordered lists, task lists, code blocks, tables, blockquotes, links, images, footnotes, and thematic breaks
- Uses Word's built-in styles (`Heading1`–`Heading3`, `Normal`) with Aptos and Aptos Display fonts

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build for Production

```bash
npm run build
npm run preview
```

## How It Works

1. Markdown is parsed into an [mdast](https://github.com/syntax-tree/mdast) AST using `unified` + `remark-parse` + `remark-gfm`
2. The AST is walked and converted into `docx` package objects (paragraphs, text runs, tables, etc.)
3. The `docx` library packs everything into a `.docx` blob, which is downloaded via the browser

## Tech Stack

- [Vue 3](https://vuejs.org/) + [Vite](https://vite.dev/)
- [unified](https://unifiedjs.com/) / [remark](https://github.com/remarkjs/remark) for Markdown parsing
- [docx](https://github.com/dolanmiriern/docx) for Word document generation (built-in Word styles)
- [rehype](https://github.com/rehypejs/rehype) for live HTML preview

## License

[GNU General Public License v2.0](./LICENSE)
