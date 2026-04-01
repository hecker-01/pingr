<template>
  <div class="markdown-preview" v-html="html"></div>
</template>

<script setup>
import { ref, watch } from "vue";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";

const props = defineProps({
  markdown: { type: String, default: "" },
});

const emit = defineEmits(["local-link-warnings"]);

const html = ref("");

function isLocalUrl(url) {
  if (!url || url.length === 0) return false;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:") ||
    url.startsWith("#") ||
    url.startsWith("//")
  )
    return false;
  return true;
}

function extractText(node) {
  if (node.type === "text") return node.value || "";
  if (node.children) return node.children.map(extractText).join("");
  return "";
}

function remarkStripLocalLinks() {
  return (tree, file) => {
    const warnings = [];
    visit(tree, "link", (node, index, parent) => {
      if (node.type !== "link") return;
      // Skip images - they are handled separately
      if (node.children?.length === 1 && node.children[0].type === "image")
        return;

      const url = node.url || "";
      if (!isLocalUrl(url)) return;

      const text = extractText(node);
      warnings.push(
        `"${text}" points to a local file (${url}) - not supported in DOCX`,
      );

      // Replace the link node with a styled HTML node so it renders as
      // plain text with a visual indicator in the preview
      parent.children.splice(index, 1, {
        type: "html",
        value: `<span class="local-link-stripped" title="Local link (${url}) - will be plain text in DOCX">${text}</span>`,
      });

      return index; // revisit this index since we replaced the node
    });

    file.data.localLinkWarnings = warnings;
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkStripLocalLinks)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeKatex)
  .use(rehypeStringify, { allowDangerousHtml: true });

watch(
  () => props.markdown,
  async (md) => {
    if (!md) {
      html.value = '<p class="empty">Preview will appear here…</p>';
      emit("local-link-warnings", []);
      return;
    }
    const result = await processor.process(md);
    html.value = String(result);
    emit("local-link-warnings", result.data.localLinkWarnings || []);
  },
  { immediate: true },
);
</script>

<style>
@import "katex/dist/katex.min.css";
</style>

<style scoped>
.markdown-preview {
  padding: 20px;
  font-family:
    "Calibri",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-size: 15px;
  line-height: 1.7;
  color: var(--ctp-text);
  overflow-y: auto;
  height: 100%;
  background: var(--ctp-base);
}

.markdown-preview :deep(h1) {
  font-size: 28px;
  font-weight: 700;
  margin: 24px 0 12px;
  color: var(--ctp-text);
  border-bottom: 1px solid var(--ctp-surface0);
  padding-bottom: 8px;
}

.markdown-preview :deep(h2) {
  font-size: 22px;
  font-weight: 700;
  margin: 20px 0 10px;
  color: var(--ctp-text);
}

.markdown-preview :deep(h3) {
  font-size: 18px;
  font-weight: 600;
  margin: 16px 0 8px;
  color: var(--ctp-subtext1);
}

.markdown-preview :deep(p) {
  margin: 0 0 12px;
}

.markdown-preview :deep(.empty) {
  color: var(--ctp-surface2);
  font-style: italic;
}

.markdown-preview :deep(code) {
  background: var(--ctp-surface0);
  color: var(--accent);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: "SF Mono", "Fira Code", monospace;
  font-size: 13px;
}

.markdown-preview :deep(pre) {
  background: var(--ctp-mantle);
  padding: 14px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0 0 16px;
  border: 1px solid var(--ctp-surface0);
}

.markdown-preview :deep(pre code) {
  background: none;
  padding: 0;
  color: var(--ctp-text);
}

.markdown-preview :deep(blockquote) {
  border-left: 4px solid var(--accent);
  margin: 0 0 12px;
  padding: 8px 16px;
  color: var(--ctp-subtext0);
  background: var(--ctp-mantle);
  border-radius: 0 4px 4px 0;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin: 0 0 12px;
  padding-left: 24px;
}

.markdown-preview :deep(li) {
  margin-bottom: 4px;
}

.markdown-preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0 0 16px;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid var(--ctp-surface0);
  padding: 8px 12px;
  text-align: left;
}

.markdown-preview :deep(th) {
  background: var(--ctp-surface0);
  font-weight: 600;
  color: var(--ctp-text);
}

.markdown-preview :deep(td) {
  background: var(--ctp-base);
}

.markdown-preview :deep(a) {
  color: var(--accent);
  text-decoration: none;
}

.markdown-preview :deep(a:hover) {
  text-decoration: underline;
}

.markdown-preview :deep(hr) {
  border: none;
  border-top: 1px solid var(--ctp-surface0);
  margin: 20px 0;
}

.markdown-preview :deep(del) {
  text-decoration: line-through;
  color: var(--ctp-overlay0);
}

.markdown-preview :deep(img) {
  max-width: 100%;
  border-radius: 6px;
}

.markdown-preview :deep(.katex-display) {
  margin: 16px 0;
  overflow-x: auto;
}

.markdown-preview :deep(.katex) {
  color: var(--ctp-text);
}

.markdown-preview :deep(strong) {
  color: var(--ctp-text);
}

.markdown-preview :deep(.local-link-stripped) {
  color: var(--ctp-yellow, #f9e2af);
  text-decoration: underline wavy;
  text-underline-offset: 3px;
  cursor: help;
}
</style>
