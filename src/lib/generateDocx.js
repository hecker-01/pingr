import { Document, Packer } from "docx";
import { parseMarkdown } from "./parseMarkdown.js";
import { mdastToDocx } from "./mdastToDocx.js";

/**
 * Convert a Markdown string to a DOCX Blob.
 * @param {string} markdownString
 * @param {string} filename
 * @param {object} options
 * @param {Map} options.imageMap - pre-resolved image map for local images
 * @param {function} options.onMissingImages - callback(Set<string>) for missing local images
 * @returns {Promise<Blob>}
 */
export async function generateDocx(
  markdownString,
  filename = "document",
  options = {},
) {
  const tree = parseMarkdown(markdownString);
  const { children, footnotes, warnings } = await mdastToDocx(tree, options);

  // Convert footnote Map to the format docx expects
  const footnotesConfig = {};
  for (const [id, fn] of footnotes) {
    footnotesConfig[id] = fn;
  }

  const doc = new Document({
    creator: "Wordr",
    title: filename,
    footnotes:
      Object.keys(footnotesConfig).length > 0 ? footnotesConfig : undefined,
    styles: {
      default: {
        document: {
          run: {
            font: "Aptos",
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return { blob, warnings: warnings || [] };
}

/**
 * Trigger browser download of a Blob as a file.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
