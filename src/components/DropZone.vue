<template>
  <div
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
</template>

<script setup>
import { ref } from "vue";

const emit = defineEmits(["file-picked"]);

const fileInput = ref(null);
const isDragging = ref(false);

function onFileSelect(e) {
  const file = e.target.files[0];
  if (file) emit("file-picked", file);
  e.target.value = "";
}

function onDrop(e) {
  isDragging.value = false;
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) emit("file-picked", file);
}
</script>

<style scoped>
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
  transition: border-color 0.2s, background 0.2s;
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
</style>
