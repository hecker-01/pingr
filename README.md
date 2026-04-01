# Pingr

it's april fools. you forgot to plan anything. now what?

upload your discord server icon, download the result, swap it in, and watch your entire server think they got pinged. you did nothing. they suffer. that's the bit.

## What it does

Takes any server icon, overlays a Discord-style ping badge (`1`) onto it, and gives you back a PNG ready to drop straight into your server settings.

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

1. User uploads (or drops) a server icon image
2. Both the icon and `ping-overlay.png` are drawn onto an offscreen `<canvas>` at 512×512
3. The composited result is exported as a PNG blob and previewed + downloadable

## Tech Stack

- [Vue 3](https://vuejs.org/) + [Vite](https://vite.dev/)
- Canvas API for image compositing (no dependencies)
- Catppuccin Mocha theme with red accent

## License

[GNU General Public License v2.0](./LICENSE)
