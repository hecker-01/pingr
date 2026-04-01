<template>
  <div class="markdown-input">
    <div class="tabs">
      <button
        :class="['tab', { active: mode === 'edit' }]"
        @click="mode = 'edit'"
      >
        <i class="fa-solid fa-pen-to-square"></i> Editor
      </button>
      <button
        :class="['tab', { active: mode === 'upload' }]"
        @click="mode = 'upload'"
      >
        <i class="fa-solid fa-upload"></i> Upload File
      </button>
    </div>

    <div v-if="mode === 'edit'" class="editor-pane">
      <textarea
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        placeholder="Type or paste Markdown here…"
        spellcheck="false"
      ></textarea>
    </div>

    <div
      v-else
      class="upload-pane"
      :class="{ dragging }"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="handleDrop"
    >
      <div class="upload-content">
        <div class="upload-icon"><i class="fa-solid fa-file-arrow-up"></i></div>
        <p>Drag &amp; drop a <strong>.md</strong> file here</p>
        <p class="or">or</p>
        <label class="file-btn">
          <i class="fa-solid fa-folder-open"></i> Choose File
          <input type="file" accept=".md,.markdown,.txt" @change="handleFile" />
        </label>
        <p v-if="fileName" class="file-name">
          <i class="fa-solid fa-check"></i> Loaded: {{ fileName }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue", "update:fileName", "error"]);

const mode = ref("edit");
const dragging = ref(false);
const fileName = ref("");

const ALLOWED_EXTENSIONS = /\.(md|markdown|txt)$/i;

function readFile(file) {
  if (!file) return false;
  if (!ALLOWED_EXTENSIONS.test(file.name)) {
    emit(
      "error",
      `"${file.name}" is not a Markdown file. Please upload a .md, .markdown, or .txt file.`,
    );
    return false;
  }
  fileName.value = file.name;
  emit("update:fileName", file.name);
  const reader = new FileReader();
  reader.onload = (e) => {
    emit("update:modelValue", e.target.result);
    mode.value = "edit";
  };
  reader.readAsText(file);
  return true;
}

function handleDrop(e) {
  dragging.value = false;
  const file = e.dataTransfer.files[0];
  readFile(file);
}

function handleFile(e) {
  readFile(e.target.files[0]);
}

defineExpose({ mode, readFile });
</script>

<style scoped>
.markdown-input {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--ctp-surface0);
  background: var(--ctp-mantle);
}

.tab {
  padding: 8px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: var(--ctp-overlay0);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.15s;
}

.tab i {
  margin-right: 4px;
}

.tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.tab:hover {
  color: var(--accent-hover);
}

.editor-pane {
  flex: 1;
  display: flex;
}

textarea {
  flex: 1;
  resize: none;
  border: none;
  padding: 16px;
  font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
  font-size: 14px;
  line-height: 1.6;
  color: var(--ctp-text);
  background: var(--ctp-base);
  outline: none;
}

textarea::placeholder {
  color: var(--ctp-surface2);
}

.upload-pane {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--ctp-surface0);
  border-radius: 8px;
  margin: 16px;
  transition: all 0.2s;
  background: var(--ctp-base);
}

.upload-pane.dragging {
  border-color: var(--accent);
  background: var(--ctp-base);
}

.upload-content {
  text-align: center;
  color: var(--ctp-overlay0);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
  color: var(--accent);
}

.or {
  margin: 8px 0;
  font-size: 13px;
  color: var(--ctp-surface2);
}

.file-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: var(--accent);
  color: var(--ctp-crust);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
}

.file-btn:hover {
  background: var(--accent-hover);
}

.file-btn input {
  display: none;
}

.file-name {
  margin-top: 12px;
  font-size: 13px;
  color: var(--ctp-green);
}

.file-name i {
  margin-right: 4px;
}
</style>
