import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

/**
 * Parse a Markdown string into an mdast tree.
 * Supports GFM (tables, strikethrough, task lists, autolinks)
 * and math ($inline$ and $$display$$).
 */
export function parseMarkdown(md) {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkMath);
  return processor.parse(md);
}
