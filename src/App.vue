<template>
  <div class="app">
    <AppHeader @why-click="whyOpen = true" />
    <WhyModal v-if="whyOpen" v-model="whyOpen" />

    <main class="main">
      <div class="card">
        <DropZone v-if="!resultUrl" @file-picked="processImage" />
        <ResultPreview
          v-else
          :result-url="resultUrl"
          @download="download"
          @reset="reset"
        />
        <canvas ref="canvas" style="display: none"></canvas>
      </div>
    </main>

    <footer class="app-footer">
      &copy; 2026 Pingr, by
      <a href="https://heckr.dev/" target="_blank" rel="noopener noreferrer"
        >heckr.dev</a
      >
      &middot; All rights reserved.
    </footer>
  </div>
</template>

<script setup>
import { ref } from "vue";
import AppHeader from "./components/AppHeader.vue";
import WhyModal from "./components/WhyModal.vue";
import DropZone from "./components/DropZone.vue";
import ResultPreview from "./components/ResultPreview.vue";

const whyOpen = ref(false);
const canvas = ref(null);
const resultUrl = ref(null);

async function processImage(file) {
  const iconUrl = URL.createObjectURL(file);

  const [icon, overlay] = await Promise.all([
    loadImage(iconUrl),
    loadImage("/ping-overlay.png"),
  ]);

  const SIZE = 512;
  const ctx = canvas.value.getContext("2d");
  canvas.value.width = SIZE;
  canvas.value.height = SIZE;

  ctx.drawImage(icon, 0, 0, SIZE, SIZE);
  ctx.drawImage(overlay, 0, 0, SIZE, SIZE);

  URL.revokeObjectURL(iconUrl);

  canvas.value.toBlob((blob) => {
    if (resultUrl.value) URL.revokeObjectURL(resultUrl.value);
    resultUrl.value = URL.createObjectURL(blob);
  }, "image/png");
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function download() {
  const a = document.createElement("a");
  a.href = resultUrl.value;
  a.download = "pinged-icon.png";
  a.click();
}

function reset() {
  if (resultUrl.value) {
    URL.revokeObjectURL(resultUrl.value);
    resultUrl.value = null;
  }
}
</script>

<style>
/* Catppuccin Mocha - Red accent */
:root {
  --ctp-text: #cdd6f4;
  --ctp-subtext1: #bac2de;
  --ctp-subtext0: #a6adc8;
  --ctp-overlay0: #6c7086;
  --ctp-surface2: #585b70;
  --ctp-surface1: #45475a;
  --ctp-surface0: #313244;
  --ctp-base: #1e1e2e;
  --ctp-mantle: #181825;
  --ctp-crust: #11111b;
  --ctp-red: #f38ba8;
  --ctp-maroon: #eba0ac;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--ctp-base);
  color: var(--ctp-text);
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.card {
  background: var(--ctp-mantle);
  border: 1px solid var(--ctp-surface0);
  border-radius: 20px;
  padding: 36px;
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.app-footer {
  text-align: center;
  padding: 12px;
  font-size: 12px;
  color: var(--ctp-overlay0);
  border-top: 1px solid var(--ctp-surface0);
  background: var(--ctp-mantle);
}

.app-footer a {
  color: var(--ctp-red);
  text-decoration: none;
}

.app-footer a:hover {
  text-decoration: underline;
}

::selection {
  background: var(--ctp-red);
  color: var(--ctp-crust);
}

*::-webkit-scrollbar {
  width: 8px;
}
*::-webkit-scrollbar-track {
  background: transparent;
}
*::-webkit-scrollbar-thumb {
  background: var(--ctp-surface1);
  border-radius: 9999px;
}
*::-webkit-scrollbar-thumb:hover {
  background: var(--ctp-surface2);
}
</style>
