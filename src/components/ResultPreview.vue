<template>
  <div class="result-area">
    <div class="preview-wrap">
      <img :src="resultUrl" alt="Pinged server icon" class="preview-img" />
    </div>
    <div class="result-actions">
      <button class="btn-primary" @click="$emit('download')">
        <i class="fa-solid fa-download"></i> Download
      </button>
      <button class="btn-secondary" @click="$emit('reset')">
        <i class="fa-solid fa-rotate-left"></i> Try another
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({ resultUrl: { type: String, required: true } });
defineEmits(["download", "reset"]);
</script>

<style scoped>
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
</style>
