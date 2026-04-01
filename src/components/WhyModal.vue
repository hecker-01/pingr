<template>
  <div class="modal-overlay" @click.self="$emit('update:modelValue', false)">
    <div class="modal">
      <button class="modal-close" @click="$emit('update:modelValue', false)">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <p class="headline">Imagine this; it's April Fools</p>
      <p class="body">
        And your smooth-brian forgot to plan anything and now the day's already
        here, classic. <br />
        Now don't panic! Just upload your server's icon, download the result,
        swap it in discord, and watch your entire server lose their minds
        thinking they all got pinged.
        <br />
        You dont have to do anything, yet they suffer, it's absolutely amazing.
      </p>

      <p class="sign-off">You're welcome.</p>
    </div>
  </div>
</template>

<script setup>
defineProps({ modelValue: Boolean });
defineEmits(["update:modelValue"]);
</script>

<style scoped>
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

.headline {
  font-size: 22px;
  font-weight: 800;
  color: var(--ctp-red);
  margin-bottom: 14px;
}

.body {
  font-size: 14px;
  line-height: 1.7;
  color: var(--ctp-subtext1);
  margin-bottom: 18px;
}

.sign-off {
  font-size: 13px;
  color: var(--ctp-overlay0);
  font-style: italic;
}
</style>
