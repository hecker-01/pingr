<template>
  <button
    class="convert-btn"
    :disabled="disabled || converting"
    @click="handleConvert"
  >
    <i class="fa-solid fa-download"></i>
    Download DOCX
  </button>

  <Teleport to="body">
    <Transition name="overlay-fade">
      <div v-if="converting" class="gen-overlay" @click.self="() => {}">
        <div class="gen-modal">
          <!-- Animated doc icon -->
          <div class="doc-icon-wrap">
            <div
              class="doc-icon"
              :class="{ 'icon-done': currentStep >= steps.length }"
            >
              <i
                v-if="currentStep < steps.length"
                class="fa-solid fa-file-word"
              ></i>
              <i v-else class="fa-solid fa-circle-check"></i>
            </div>
            <svg
              class="ring-spinner"
              :class="{ 'ring-done': currentStep >= steps.length }"
              viewBox="0 0 100 100"
            >
              <circle class="ring-track" cx="50" cy="50" r="44" />
              <circle
                class="ring-progress"
                cx="50"
                cy="50"
                r="44"
                :style="{ strokeDashoffset: ringOffset }"
              />
            </svg>
          </div>

          <!-- Step label -->
          <div class="step-label">
            {{
              currentStep < steps.length ? steps[currentStep].label : "Done!"
            }}
          </div>

          <!-- Progress bar -->
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>

          <!-- Step list -->
          <div class="step-list">
            <div
              v-for="(step, i) in steps"
              :key="step.id"
              class="step-item"
              :class="{
                'step-done': i < currentStep,
                'step-active': i === currentStep && currentStep < steps.length,
                'step-pending': i > currentStep,
                'step-all-done': currentStep >= steps.length,
              }"
            >
              <div class="step-icon">
                <i
                  v-if="i < currentStep || currentStep >= steps.length"
                  class="fa-solid fa-check"
                ></i>
                <i
                  v-else-if="i === currentStep"
                  class="fa-solid fa-spinner fa-spin"
                ></i>
                <span v-else class="step-dot"></span>
              </div>
              <span class="step-text">{{ step.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, toRaw } from "vue";
import { generateDocx } from "../lib/generateDocx.js";

const props = defineProps({
  markdown: { type: String, default: "" },
  fileName: { type: String, default: "document" },
  disabled: { type: Boolean, default: false },
  imageMap: { type: Map, default: () => new Map() },
});

const emit = defineEmits(["error", "missing-images", "warnings"]);
const converting = ref(false);
const currentStep = ref(0);

const steps = [
  { id: "parse", label: "Parsing Markdown…" },
  { id: "structure", label: "Building document structure…" },
  { id: "images", label: "Embedding images…" },
  { id: "styles", label: "Applying styles…" },
  { id: "package", label: "Packaging DOCX…" },
];

const circumference = 2 * Math.PI * 44;
const ringOffset = computed(() => {
  const progress =
    currentStep.value >= steps.length
      ? 0
      : circumference -
        (circumference * (currentStep.value + 0.5)) / steps.length;
  return progress;
});

const progressPercent = computed(() => {
  if (currentStep.value >= steps.length) return 100;
  return ((currentStep.value + 0.5) / steps.length) * 100;
});

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleConvert() {
  if (!props.markdown.trim()) return;
  converting.value = true;
  currentStep.value = 0;

  try {
    const baseName =
      props.fileName.replace(/\.(md|markdown|txt)$/i, "") || "document";
    let hasMissing = false;

    const rawMap = new Map();
    for (const [key, val] of props.imageMap) {
      const raw = toRaw(val);
      rawMap.set(key, {
        data: new Uint8Array(raw.data),
        width: raw.width,
        height: raw.height,
      });
    }

    // Step 0: Parsing
    await wait(600);
    currentStep.value = 1;

    // Step 1: Building structure
    await wait(600);
    currentStep.value = 2;

    // Step 2: Embedding images
    await wait(600);
    currentStep.value = 3;

    // Step 3: Applying styles - kick off real conversion here
    const conversionPromise = generateDocx(props.markdown, baseName, {
      imageMap: rawMap,
      onMissingImages(paths) {
        hasMissing = true;
        emit("missing-images", paths);
      },
    });

    await wait(600);
    currentStep.value = 4;

    // Step 4: Packaging - wait for real conversion to finish
    const { blob, warnings } = await conversionPromise;
    await wait(600);

    if (hasMissing) {
      converting.value = false;
      return;
    }

    if (warnings && warnings.length > 0) {
      emit("warnings", warnings);
    }

    // Done state
    currentStep.value = steps.length;
    await wait(700);

    downloadBlob(blob, `${baseName}.docx`);
  } catch (err) {
    console.error("Conversion error:", err);
    emit("error", err.message);
  } finally {
    converting.value = false;
    currentStep.value = 0;
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.convert-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: var(--accent);
  color: var(--ctp-crust);
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.convert-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.convert-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Overlay ── */
.gen-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(11, 11, 19, 0.75);
  backdrop-filter: blur(6px);
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.25s ease;
}
.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

.gen-modal {
  background: var(--ctp-base);
  border: 1px solid var(--ctp-surface0);
  border-radius: 16px;
  padding: 36px 40px 32px;
  width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  animation: modal-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes modal-pop {
  from {
    transform: scale(0.9) translateY(10px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

/* ── Animated doc icon with ring ── */
.doc-icon-wrap {
  position: relative;
  width: 90px;
  height: 90px;
}

.doc-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: var(--accent);
  transition: all 0.4s ease;
}

.doc-icon.icon-done {
  color: var(--ctp-green);
  transform: scale(1.15);
}

.ring-spinner {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-track {
  fill: none;
  stroke: var(--ctp-surface0);
  stroke-width: 4;
}

.ring-progress {
  fill: none;
  stroke: var(--accent);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 276.46;
  transition:
    stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    stroke 0.3s ease;
}

.ring-done .ring-progress {
  stroke: var(--ctp-green);
}

/* ── Step label ── */
.step-label {
  font-size: 16px;
  font-weight: 600;
  color: var(--ctp-text);
  text-align: center;
  min-height: 24px;
  transition: all 0.3s ease;
}

/* ── Progress bar ── */
.progress-track {
  width: 100%;
  height: 6px;
  background: var(--ctp-surface0);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--gradient-end));
  border-radius: 3px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Step list ── */
.step-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.step-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.step-done .step-icon {
  background: var(--ctp-green);
  color: var(--ctp-crust);
}

.step-active .step-icon {
  background: var(--accent);
  color: var(--ctp-crust);
}

.step-pending .step-icon {
  background: var(--ctp-surface0);
  color: var(--ctp-surface2);
}

.step-all-done .step-icon {
  background: var(--ctp-green);
  color: var(--ctp-crust);
}

.step-dot {
  display: block;
  width: 6px;
  height: 6px;
  background: var(--ctp-surface2);
  border-radius: 50%;
}

.step-text {
  font-size: 13px;
  color: var(--ctp-overlay0);
  transition: color 0.3s ease;
}

.step-done .step-text {
  color: var(--ctp-subtext0);
}

.step-active .step-text {
  color: var(--ctp-text);
  font-weight: 500;
}

.step-all-done .step-text {
  color: #a6e3a1;
}
</style>
