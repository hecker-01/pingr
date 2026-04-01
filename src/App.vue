<template>
  <div class="app">
    <header class="header">
      <div class="brand">
        <img src="/logo.png" alt="Pingr" class="brand-logo" />
        <div class="brand-text">
          <h1>Pingr</h1>
          <span class="tagline">make 'em think they missed something</span>
        </div>
      </div>
      <button class="btn-why" @click="whyOpen = true">
        <i class="fa-solid fa-circle-question"></i> why?
      </button>
    </header>

    <!-- Why modal -->
    <div v-if="whyOpen" class="modal-overlay" @click.self="whyOpen = false">
      <div class="modal">
        <button class="modal-close" @click="whyOpen = false">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <p class="modal-why-headline">it's april fools.</p>
        <p class="modal-why-body">
          you forgot to plan anything and now it's already the 1st. classic. but
          don't panic — just upload your server's icon, download the result,
          swap it in discord, and watch your entire server lose their minds
          thinking they all got pinged. you did nothing. they suffer. that's the
          bit.
        </p>
        <p class="modal-why-footer">you're welcome.</p>
      </div>
    </div>

    <main class="main">
      <div class="card">
        <!-- Upload zone -->
        <div
          v-if="!resultUrl"
          class="drop-zone"
          :class="{ 'drag-over': isDragging }"
          @click="fileInput.click()"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDrop"
        >
          <div class="drop-icon">
            <i class="fa-solid fa-circle-plus"></i>
          </div>
          <p class="drop-label">Drop your server icon here</p>
          <p class="drop-hint">or click to browse &middot; PNG / JPG / WEBP</p>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="onFileSelect"
          />
        </div>

        <!-- Result preview -->
        <div v-else class="result-area">
          <div class="preview-wrap">
            <img
              :src="resultUrl"
              alt="Pinged server icon"
              class="preview-img"
            />
          </div>
          <div class="result-actions">
            <button class="btn-primary" @click="download">
              <i class="fa-solid fa-download"></i> Download
            </button>
            <button class="btn-secondary" @click="reset">
              <i class="fa-solid fa-rotate-left"></i> Try another
            </button>
          </div>
        </div>

        <!-- Hidden canvas for compositing -->
        <canvas ref="canvas" style="display: none"></canvas>
      </div>
    </main>

    <footer class="app-footer">
      Pingr &middot; by
      <a href="https://heckr.dev/" target="_blank" rel="noopener noreferrer"
        >heckr.dev</a
      >
      &middot; go fool someone
    </footer>
  </div>
</template>

<script setup>
import { ref } from "vue";

const whyOpen = ref(false);
const fileInput = ref(null);
const canvas = ref(null);
const isDragging = ref(false);
const resultUrl = ref(null);

function onFileSelect(e) {
  const file = e.target.files[0];
  if (file) processImage(file);
  e.target.value = "";
}

function onDrop(e) {
  isDragging.value = false;
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) processImage(file);
}

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
/* Catppuccin Mocha – Red accent */
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

/* ── Header ── */
.header {
  padding: 16px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--ctp-mantle);
  border-bottom: 1px solid var(--ctp-surface0);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.brand-text h1 {
  font-size: 22px;
  font-weight: 800;
  color: var(--ctp-red);
  letter-spacing: -0.5px;
  line-height: 1;
}

.tagline {
  font-size: 12px;
  color: var(--ctp-overlay0);
}

/* ── Main ── */
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

/* ── Drop zone ── */
.drop-zone {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 56px 24px;
  border: 2px dashed var(--ctp-surface1);
  border-radius: 14px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
  text-align: center;
}

.drop-zone:hover,
.drop-zone.drag-over {
  border-color: var(--ctp-red);
  background: rgba(243, 139, 168, 0.05);
}

.drop-icon i {
  font-size: 48px;
  color: var(--ctp-surface2);
  transition: color 0.2s;
}

.drop-zone:hover .drop-icon i,
.drop-zone.drag-over .drop-icon i {
  color: var(--ctp-red);
}

.drop-label {
  font-size: 16px;
  font-weight: 600;
  color: var(--ctp-subtext1);
}

.drop-hint {
  font-size: 13px;
  color: var(--ctp-overlay0);
}

/* ── Result ── */
.result-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.preview-wrap {
  width: 200px;
  height: 200px;
  border-radius: 30%;
  overflow: hidden;
  border: 3px solid var(--ctp-surface1);
  box-shadow: 0 0 24px rgba(243, 139, 168, 0.2);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-actions {
  display: flex;
  gap: 12px;
}

/* ── Buttons ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: var(--ctp-red);
  color: var(--ctp-crust);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  transition: background 0.15s;
}

.btn-primary:hover {
  background: var(--ctp-maroon);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--ctp-surface0);
  color: var(--ctp-subtext0);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
}

.btn-secondary:hover {
  background: var(--ctp-surface1);
}

/* ── Why button ── */
.btn-why {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--ctp-surface0);
  color: var(--ctp-overlay0);
  border: 1px solid var(--ctp-surface1);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition:
    color 0.15s,
    border-color 0.15s;
}

.btn-why:hover {
  color: var(--ctp-red);
  border-color: var(--ctp-red);
}

/* ── Why modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  position: relative;
  background: var(--ctp-mantle);
  border: 1px solid var(--ctp-surface0);
  border-radius: 16px;
  padding: 36px 32px 28px;
  max-width: 420px;
  width: 90%;
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  background: none;
  border: none;
  color: var(--ctp-overlay0);
  font-size: 16px;
  cursor: pointer;
  transition: color 0.15s;
}

.modal-close:hover {
  color: var(--ctp-text);
}

.modal-why-headline {
  font-size: 22px;
  font-weight: 800;
  color: var(--ctp-red);
  margin-bottom: 14px;
}

.modal-why-body {
  font-size: 14px;
  line-height: 1.7;
  color: var(--ctp-subtext1);
  margin-bottom: 18px;
}

.modal-why-footer {
  font-size: 13px;
  color: var(--ctp-overlay0);
  font-style: italic;
}

/* ── Footer ── */
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

/* ── Scrollbars ── */
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
