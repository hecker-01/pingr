<template>
  <header class="header">
    <div class="brand">
      <img src="/logo.png" alt="Pingr" class="brand-logo" />
      <div class="brand-text">
        <h1>Pingr</h1>
        <span class="tagline">Make 'em think they missed something</span>
      </div>
    </div>
    <button class="btn-why" @click="$emit('why-click')">
      <i class="fa-solid fa-circle-question"></i> Why?
    </button>
  </header>
</template>

<script setup>
defineEmits(["why-click"]);
</script>

<style scoped>
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
</style>
