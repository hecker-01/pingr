<template>
  <div class="app">
    <header class="header">
      <div class="brand">
        <img :src="'/logo.png'" alt="Wordr" class="brand-logo" />
        <div class="brand-text">
          <h1>Wordr</h1>
          <span class="tagline">Markdown → DOCX</span>
        </div>
      </div>
      <ConvertButton
        :markdown="markdown"
        :file-name="fileName"
        :disabled="!markdown.trim()"
        :image-map="imageMap"
        @error="handleError"
        @missing-images="handleMissingImages"
        @warnings="handleWarnings"
      />
    </header>

    <div v-if="error" class="error-bar">
      <i class="fa-solid fa-circle-exclamation"></i> {{ error }}
      <button class="error-close" @click="error = ''">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <div v-if="warnings.length" class="warning-bar">
      <div class="warning-content">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div class="warning-messages">
          <div v-for="(w, i) in warnings" :key="i">{{ w }}</div>
        </div>
      </div>
      <button class="warning-close" @click="warnings = []">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <div v-if="localLinkWarnings.length" class="warning-bar">
      <div class="warning-content">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div class="warning-messages">
          <div v-for="(w, i) in localLinkWarnings" :key="'ll-' + i">
            {{ w }}
          </div>
        </div>
      </div>
      <button class="warning-close" @click="localLinkWarnings = []">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <!-- Missing images upload modal -->
    <div
      v-if="missingImagePaths.length > 0"
      class="modal-overlay"
      @click.self="missingImagePaths = []"
    >
      <div class="modal">
        <div class="modal-header">
          <h3><i class="fa-solid fa-images"></i> Images Found</h3>
          <button class="modal-close" @click="missingImagePaths = []">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <p class="modal-desc">
          Your Markdown references
          <strong
            >{{ missingImagePaths.length }} image{{
              missingImagePaths.length > 1 ? "s" : ""
            }}</strong
          >. Upload them to embed in the DOCX, or skip to use placeholders.
        </p>

        <!-- Progress bar -->
        <div class="upload-progress">
          <div
            class="upload-progress-bar"
            :style="{ width: uploadPercent + '%' }"
          ></div>
          <span class="upload-progress-text"
            >{{ uploadedCount }} / {{ missingImagePaths.length }} uploaded</span
          >
        </div>

        <!-- Bulk drop zone -->
        <div
          class="bulk-drop-zone"
          :class="{ 'drag-over': bulkDragOver }"
          @dragover.prevent="bulkDragOver = true"
          @dragleave="bulkDragOver = false"
          @drop.prevent="handleBulkDrop"
          @click="$refs.bulkInput.click()"
        >
          <i class="fa-solid fa-cloud-arrow-up"></i>
          <span>Drop all images here or <em>click to browse</em></span>
          <span class="bulk-hint">Files are matched to paths by filename</span>
          <input
            ref="bulkInput"
            type="file"
            accept="image/*"
            multiple
            style="display: none"
            @change="handleBulkSelect"
          />
        </div>

        <!-- Individual image list -->
        <div class="missing-list">
          <div
            v-for="path in missingImagePaths"
            :key="path"
            class="missing-item"
            :class="{ uploaded: imageMap.has(path) }"
            @dragover.prevent="dragOverPath = path"
            @dragleave="dragOverPath = null"
            @drop.prevent="(e) => handleSingleDrop(path, e)"
          >
            <!-- Thumbnail or placeholder -->
            <div class="img-thumb">
              <img v-if="thumbUrls[path]" :src="thumbUrls[path]" alt="" />
              <i v-else class="fa-regular fa-image"></i>
            </div>

            <div class="img-info">
              <span class="img-name">{{ extractFileName(path) }}</span>
              <span class="img-path">{{ path }}</span>
            </div>

            <div class="img-status">
              <span v-if="imageMap.has(path)" class="status-badge done">
                <i class="fa-solid fa-circle-check"></i> Ready
              </span>
              <label
                v-else
                class="file-upload-btn"
                :class="{ 'drag-target': dragOverPath === path }"
              >
                <i class="fa-solid fa-folder-open"></i> Browse
                <input
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="(e) => handleImageUpload(path, e)"
                />
              </label>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" @click="missingImagePaths = []">
            <i class="fa-solid fa-forward"></i> Skip images
          </button>
          <button
            class="btn-primary"
            :disabled="uploadedCount === 0"
            @click="retryConvert"
          >
            <i class="fa-solid fa-download"></i>
            Convert{{
              uploadedCount > 0
                ? ` (${uploadedCount} image${uploadedCount > 1 ? "s" : ""})`
                : ""
            }}
          </button>
        </div>
      </div>
    </div>

    <main class="main">
      <section class="pane input-pane">
        <MarkdownInput
          ref="markdownInputRef"
          v-model="markdown"
          @update:file-name="fileName = $event"
          @error="handleError"
        />
      </section>
      <div class="divider"></div>
      <section class="pane preview-pane">
        <div class="pane-label">
          <div class="preview-tab"><i class="fa-solid fa-eye"></i> Preview</div>
        </div>
        <MarkdownPreview
          :markdown="markdown"
          @local-link-warnings="handleLocalLinkWarnings"
        />
      </section>
    </main>
    <!-- Global drag overlay -->
    <div
      v-if="globalDragOver"
      class="global-drop-overlay"
      @dragover.prevent
      @dragleave.prevent="globalDragOver = false"
      @drop.prevent="handleGlobalDrop"
    >
      <div class="global-drop-content">
        <i class="fa-solid fa-file-arrow-up"></i>
        <p>Drop <strong>.md</strong> file to open</p>
      </div>
    </div>

    <footer class="app-footer">
      © 2026 Wordr, by
      <a href="https://heckr.dev/" target="_blank" rel="noopener noreferrer"
        >heckr.dev</a
      >
      · All rights reserved.
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, toRaw, onMounted, onUnmounted } from "vue";
import MarkdownInput from "./components/MarkdownInput.vue";
import MarkdownPreview from "./components/MarkdownPreview.vue";
import ConvertButton from "./components/ConvertButton.vue";
import { generateDocx } from "./lib/generateDocx.js";

const markdown = ref("");
const fileName = ref("document");
const markdownInputRef = ref(null);
const globalDragOver = ref(false);
let dragLeaveTimeout = null;

function onGlobalDragOver(e) {
  // Only show overlay when files are being dragged
  if (!e.dataTransfer?.types?.includes("Files")) return;
  e.preventDefault();
  clearTimeout(dragLeaveTimeout);
  globalDragOver.value = true;
}

function onGlobalDragLeave() {
  // Small delay to prevent flicker when dragging over child elements
  dragLeaveTimeout = setTimeout(() => {
    globalDragOver.value = false;
  }, 50);
}

function handleGlobalDrop(e) {
  globalDragOver.value = false;
  const file = e.dataTransfer.files[0];
  if (!file) return;
  // Feed through validated readFile - it switches to editor on success,
  // or emits an error for invalid files
  if (markdownInputRef.value) {
    const valid = markdownInputRef.value.readFile(file);
    if (!valid) {
      markdownInputRef.value.mode = "upload";
    }
  }
}

onMounted(() => {
  document.addEventListener("dragover", onGlobalDragOver);
  document.addEventListener("dragleave", onGlobalDragLeave);
});

onUnmounted(() => {
  document.removeEventListener("dragover", onGlobalDragOver);
  document.removeEventListener("dragleave", onGlobalDragLeave);
  clearTimeout(dragLeaveTimeout);
});
const error = ref("");
const warnings = ref([]);
const localLinkWarnings = ref([]);
const missingImagePaths = ref([]);
const imageMap = reactive(new Map());
const thumbUrls = reactive({});
const bulkDragOver = ref(false);
const dragOverPath = ref(null);

const uploadedCount = computed(() => {
  return missingImagePaths.value.filter((p) => imageMap.has(p)).length;
});

const uploadPercent = computed(() => {
  if (missingImagePaths.value.length === 0) return 0;
  return Math.round(
    (uploadedCount.value / missingImagePaths.value.length) * 100,
  );
});

function extractFileName(path) {
  return path.split("/").pop().split("\\").pop() || path;
}

function handleError(msg) {
  error.value = msg;
  setTimeout(() => {
    error.value = "";
  }, 5000);
}

function handleWarnings(msgs) {
  warnings.value = msgs;
  setTimeout(() => {
    warnings.value = [];
  }, 8000);
}

function handleLocalLinkWarnings(msgs) {
  localLinkWarnings.value = msgs;
}

function handleMissingImages(paths) {
  missingImagePaths.value = [...paths];
}

async function processImageFile(path, file) {
  const buf = await file.arrayBuffer();
  const url = URL.createObjectURL(file);

  // Store thumbnail
  if (thumbUrls[path]) URL.revokeObjectURL(thumbUrls[path]);
  thumbUrls[path] = url;

  // Get dimensions
  const dims = await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 576;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxW) {
        h = Math.round((h * maxW) / w);
        w = maxW;
      }
      resolve({ width: w, height: h });
    };
    img.onerror = () => resolve({ width: 400, height: 300 });
    img.src = url;
  });

  imageMap.set(path, { data: new Uint8Array(buf), ...dims });
}

async function handleImageUpload(path, event) {
  const file = event.target.files[0];
  if (!file) return;
  await processImageFile(path, file);
}

function handleSingleDrop(path, event) {
  dragOverPath.value = null;
  const file = event.dataTransfer.files[0];
  if (!file || !file.type.startsWith("image/")) return;
  processImageFile(path, file);
}

async function handleBulkDrop(event) {
  bulkDragOver.value = false;
  const files = [...event.dataTransfer.files].filter((f) =>
    f.type.startsWith("image/"),
  );
  await matchAndUploadFiles(files);
}

async function handleBulkSelect(event) {
  const files = [...event.target.files];
  await matchAndUploadFiles(files);
  event.target.value = "";
}

async function matchAndUploadFiles(files) {
  for (const file of files) {
    const fName = file.name.toLowerCase();
    // Find matching path by filename
    const match = missingImagePaths.value.find((p) => {
      const pathName = extractFileName(p).toLowerCase();
      return pathName === fName;
    });
    if (match) {
      await processImageFile(match, file);
    } else {
      // If no exact match, try partial match (filename without extension)
      const fBase = fName.replace(/\.[^.]+$/, "");
      const partial = missingImagePaths.value.find((p) => {
        const pathBase = extractFileName(p)
          .toLowerCase()
          .replace(/\.[^.]+$/, "");
        return pathBase === fBase;
      });
      if (partial && !imageMap.has(partial)) {
        await processImageFile(partial, file);
      } else {
        // Assign to first unmatched slot
        const unmatched = missingImagePaths.value.find((p) => !imageMap.has(p));
        if (unmatched) {
          await processImageFile(unmatched, file);
        }
      }
    }
  }
}

async function retryConvert() {
  missingImagePaths.value = [];
  try {
    const baseName =
      fileName.value.replace(/\.(md|markdown|txt)$/i, "") || "document";
    // Create a plain (non-reactive) copy so docx gets raw binary data
    const rawMap = new Map();
    for (const [key, val] of imageMap) {
      const raw = toRaw(val);
      rawMap.set(key, {
        data: new Uint8Array(raw.data),
        width: raw.width,
        height: raw.height,
      });
    }
    const blob = await generateDocx(markdown.value, baseName, {
      imageMap: rawMap,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    handleError(err.message);
  }
}
</script>

<style>
:root {
  /* Catppuccin Mocha palette */
  --ctp-rosewater: #f5e0dc;
  --ctp-flamingo: #f2cdcd;
  --ctp-pink: #f5c2e7;
  --ctp-mauve: #cba6f7;
  --ctp-red: #f38ba8;
  --ctp-maroon: #eba0ac;
  --ctp-peach: #fab387;
  --ctp-yellow: #f9e2af;
  --ctp-green: #a6e3a1;
  --ctp-teal: #94e2d5;
  --ctp-sky: #89dceb;
  --ctp-sapphire: #74c7ec;
  --ctp-blue: #89b4fa;
  --ctp-lavender: #b4befe;

  --ctp-text: #cdd6f4;
  --ctp-subtext1: #bac2de;
  --ctp-subtext0: #a6adc8;
  --ctp-overlay2: #9399b2;
  --ctp-overlay1: #7f849c;
  --ctp-overlay0: #6c7086;
  --ctp-surface2: #585b70;
  --ctp-surface1: #45475a;
  --ctp-surface0: #313244;
  --ctp-base: #1e1e2e;
  --ctp-mantle: #181825;
  --ctp-crust: #11111b;

  /* App aliases - change these to retheme */
  --accent: var(--ctp-pink);
  --accent-hover: var(--ctp-rosewater);
  --accent-dim: var(--ctp-pink);
  --gradient-end: var(--ctp-yellow);
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
  height: 100%;
  background: var(--ctp-base);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 1px solid var(--ctp-surface0);
  background: var(--ctp-mantle);
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

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.brand h1 {
  font-size: 20px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}

.tagline {
  font-size: 12px;
  color: var(--ctp-overlay0);
  line-height: 1;
}

.error-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  padding: 10px 24px;
  background: rgba(243, 139, 168, 0.1);
  color: var(--ctp-red);
  font-size: 14px;
  border-bottom: 1px solid rgba(243, 139, 168, 0.2);
}

.warning-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  background: rgba(249, 226, 175, 0.1);
  color: var(--ctp-yellow);
  font-size: 14px;
  border-bottom: 1px solid rgba(249, 226, 175, 0.2);
}

.warning-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.warning-content > i {
  margin-top: 2px;
}

.warning-messages {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.warning-close {
  background: none;
  border: none;
  color: var(--ctp-yellow);
  cursor: pointer;
  font-size: 16px;
}

.error-close {
  background: none;
  border: none;
  color: var(--ctp-red);
  cursor: pointer;
  font-size: 16px;
}

.main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.divider {
  width: 1px;
  background: var(--ctp-surface0);
}

.pane-label {
  padding: 8px 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ctp-overlay0);
  border-bottom: 1px solid var(--ctp-surface0);
  background: var(--ctp-mantle);
}

.preview-tab {
  border-bottom: 2px solid transparent;
}

.pane-label i {
  margin-right: 4px;
}

.preview-pane {
  background: var(--ctp-base);
}

.app-footer {
  text-align: center;
  padding: 10px;
  font-size: 12px;
  color: var(--ctp-overlay0);
  border-top: 1px solid var(--ctp-surface0);
  background: var(--ctp-mantle);
}

.app-footer a {
  color: var(--accent);
  text-decoration: none;
}

.app-footer a:hover {
  text-decoration: underline;
}

/* Global drop overlay */
.global-drop-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(17, 17, 27, 0.85);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: all;
}

.global-drop-content {
  text-align: center;
  color: var(--ctp-text);
  border: 2px dashed var(--accent);
  border-radius: 16px;
  padding: 48px 64px;
  background: var(--ctp-mantle);
  pointer-events: none;
}

.global-drop-content i {
  font-size: 56px;
  color: var(--accent);
  margin-bottom: 16px;
  display: block;
}

.global-drop-content p {
  font-size: 18px;
  margin: 0;
  color: var(--ctp-subtext0);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: var(--ctp-mantle);
  border: 1px solid var(--ctp-surface0);
  border-radius: 16px;
  padding: 28px;
  max-width: 560px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.modal-header h3 {
  color: var(--accent);
  font-size: 20px;
}

.modal-header h3 i {
  margin-right: 8px;
}

.modal-close {
  background: none;
  border: none;
  color: var(--ctp-overlay0);
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  transition: color 0.15s;
}

.modal-close:hover {
  color: var(--ctp-text);
}

.modal-desc {
  color: var(--ctp-subtext0);
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.modal-desc strong {
  color: var(--ctp-subtext1);
}

/* Upload progress */
.upload-progress {
  position: relative;
  height: 28px;
  background: var(--ctp-surface0);
  border-radius: 14px;
  margin-bottom: 16px;
  overflow: hidden;
}

.upload-progress-bar {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--accent), var(--gradient-end));
  border-radius: 14px;
  transition: width 0.3s ease;
}

.upload-progress-text {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 12px;
  font-weight: 600;
  color: var(--ctp-crust);
}

/* Bulk drop zone */
.bulk-drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px 16px;
  border: 2px dashed var(--ctp-surface1);
  border-radius: 12px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--ctp-overlay0);
  text-align: center;
}

.bulk-drop-zone:hover,
.bulk-drop-zone.drag-over {
  border-color: var(--accent);
  background: rgba(203, 166, 247, 0.06);
  color: var(--accent);
}

.bulk-drop-zone i {
  font-size: 28px;
  margin-bottom: 4px;
}

.bulk-drop-zone em {
  color: var(--accent);
  font-style: normal;
  text-decoration: underline;
}

.bulk-hint {
  font-size: 11px;
  opacity: 0.7;
}

/* Image list */
.missing-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  max-height: 40vh;
  overflow-y: auto;
}

.missing-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: var(--ctp-surface0);
  border-radius: 10px;
  gap: 12px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.missing-item.uploaded {
  border-color: var(--ctp-green);
  background: rgba(166, 227, 161, 0.08);
}

.img-thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: var(--ctp-base);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.img-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-thumb i {
  font-size: 20px;
  color: var(--ctp-surface1);
}

.img-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.img-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ctp-subtext1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.img-path {
  font-size: 11px;
  color: var(--ctp-overlay0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: monospace;
}

.img-status {
  flex-shrink: 0;
}

.status-badge.done {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: rgba(166, 227, 161, 0.15);
  color: var(--ctp-green);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.file-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--ctp-surface0);
  color: var(--accent);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: all 0.15s;
  border: 2px solid transparent;
}

.file-upload-btn:hover {
  background: var(--ctp-surface1);
}

.file-upload-btn.drag-target {
  border-color: var(--accent);
  background: rgba(203, 166, 247, 0.1);
}

/* Modal actions */
.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 8px 20px;
  background: var(--ctp-surface0);
  color: var(--ctp-subtext0);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-secondary:hover {
  background: var(--ctp-surface1);
}

.btn-primary {
  padding: 8px 20px;
  background: var(--accent);
  color: var(--ctp-crust);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.15s;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-primary i {
  margin-right: 4px;
}

/* Scrollbars - Chromium, Safari (WebKit) */
*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background: var(--ctp-surface1);
  border-radius: 9999px;
  border: 2px solid transparent;
  background-clip: content-box;
}

*::-webkit-scrollbar-thumb:hover {
  background: var(--ctp-surface2);
  border: 2px solid transparent;
  background-clip: content-box;
}

*::-webkit-scrollbar-corner {
  background: transparent;
}

/* Scrollbars - Firefox (standard properties) */
@supports (scrollbar-width: thin) {
  * {
    scrollbar-width: thin;
    scrollbar-color: var(--ctp-surface1) transparent;
  }
}

@media (max-width: 768px) {
  .main {
    flex-direction: column;
  }
  .divider {
    width: auto;
    height: 1px;
  }
}
</style>
