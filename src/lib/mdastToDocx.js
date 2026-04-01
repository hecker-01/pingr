import {
  Paragraph,
  TextRun,
  ExternalHyperlink,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  ImageRun,
  ShadingType,
  FootnoteReferenceRun,
} from "docx";

const HEADING_STYLE_MAP = {
  1: "Heading1",
  2: "Heading2",
  3: "Heading3",
  4: "Heading4",
  5: "Heading5",
  6: "Heading6",
};

const DISPLAY_FONT = "Aptos Display";
const CODE_FONT = "Consolas";

let listCounter = 0;
export function createNumberingConfig() {
  return [];
}

function nextListId() {
  return `list-${++listCounter}`;
}

// ── Image helpers ──

function collectAllImageSources(node, sources) {
  if (node.type === "image") {
    const src = node.url || "";
    if (src) sources.add(src);
  }
  if (node.children) {
    for (const child of node.children) {
      collectAllImageSources(child, sources);
    }
  }
}

// ── Footnote helpers ──

function collectFootnoteDefinitions(tree) {
  const defs = new Map();
  if (!tree.children) return defs;
  for (let i = tree.children.length - 1; i >= 0; i--) {
    const node = tree.children[i];
    if (node.type === "footnoteDefinition") {
      defs.set(node.identifier, node);
      tree.children.splice(i, 1);
    }
  }
  return defs;
}

/**
 * Convert an mdast tree into docx elements.
 * All images must be provided via options.imageMap.
 * Any image not in imageMap triggers the onMissingImages callback.
 * @param {object} tree - mdast tree
 * @param {object} options
 * @param {Map<string, {data,width,height}>} options.imageMap - user-uploaded images keyed by src
 * @param {function} options.onMissingImages - callback(Set<string>) for images needing upload
 */
export async function mdastToDocx(tree, options = {}) {
  listCounter = 0;
  const imageMap = options.imageMap || new Map();

  // Collect ALL image sources from the tree
  const allSources = new Set();
  collectAllImageSources(tree, allSources);

  // Find any that aren't already provided
  const missingImages = new Set();
  for (const src of allSources) {
    if (!imageMap.has(src)) missingImages.add(src);
  }
  if (missingImages.size > 0 && options.onMissingImages) {
    options.onMissingImages(missingImages);
  }

  const footnoteDefs = collectFootnoteDefinitions(tree);

  const ctx = {
    imageMap,
    footnoteDefs,
    footnoteInstances: new Map(),
    footnoteIdCounter: 1,
    warnings: [],
  };

  const elements = [];
  await walkChildren(tree.children, elements, ctx);

  return {
    children: elements,
    footnotes: ctx.footnoteInstances,
    warnings: ctx.warnings,
  };
}

async function walkChildren(nodes, elements, ctx) {
  if (!nodes) return;
  for (const node of nodes) {
    await walkNode(node, elements, ctx);
  }
}

async function walkNode(node, elements, ctx) {
  switch (node.type) {
    case "heading":
      return handleHeading(node, elements, ctx);
    case "paragraph":
      return handleParagraph(node, elements, ctx);
    case "blockquote":
      return handleBlockquote(node, elements, ctx);
    case "list":
      return handleList(node, elements, ctx);
    case "listItem":
      return handleListItem(node, elements, ctx);
    case "code":
      return handleCodeBlock(node, elements);
    case "table":
      return handleTable(node, elements, ctx);
    case "thematicBreak":
      return handleThematicBreak(elements);
    case "math":
      return handleMathBlock(node, elements);
    case "footnoteDefinition":
      return;
    case "html":
      return;
    default:
      if (node.children) {
        await walkChildren(node.children, elements, ctx);
      }
  }
}

// ── Inline nodes → TextRun / ExternalHyperlink ──

function extractPlainText(node) {
  if (node.type === "text") return node.value || "";
  if (node.children) return node.children.map(extractPlainText).join("");
  return "";
}

function collectInlineRuns(node, ctx) {
  const runs = [];
  collectInline(node, runs, ctx);
  return runs;
}

function collectInline(node, runs, ctx) {
  switch (node.type) {
    case "text":
      runs.push(
        new TextRun({
          text: node.value,
          bold: ctx.bold || false,
          italics: ctx.italics || false,
          strike: ctx.strike || false,
          font: ctx.font ? { name: ctx.font } : undefined,
        }),
      );
      break;
    case "strong":
      for (const child of node.children) {
        collectInline(child, runs, { ...ctx, bold: true });
      }
      break;
    case "emphasis":
      for (const child of node.children) {
        collectInline(child, runs, { ...ctx, italics: true });
      }
      break;
    case "delete":
      for (const child of node.children) {
        collectInline(child, runs, { ...ctx, strike: true });
      }
      break;
    case "inlineCode":
      runs.push(
        new TextRun({
          text: node.value,
          bold: ctx.bold || false,
          italics: ctx.italics || false,
        }),
      );
      break;
    case "link": {
      const linkUrl = node.url || "";
      const isLocal =
        linkUrl.startsWith("./") ||
        linkUrl.startsWith("../") ||
        (linkUrl.startsWith("/") && !linkUrl.startsWith("//")) ||
        (!linkUrl.startsWith("http://") &&
          !linkUrl.startsWith("https://") &&
          !linkUrl.startsWith("mailto:") &&
          !linkUrl.startsWith("tel:") &&
          !linkUrl.startsWith("#") &&
          !linkUrl.startsWith("//") &&
          linkUrl.length > 0);

      if (isLocal) {
        // Collect the visible text from the link's children
        const linkText = extractPlainText(node);
        const msg = `"${linkText}" points to a local file (${linkUrl}) which is not supported in DOCX.`;
        if (!ctx.warnings.includes(msg)) ctx.warnings.push(msg);
        // Render as plain text instead of a hyperlink
        for (const child of node.children) {
          collectInline(child, runs, ctx);
        }
      } else {
        runs.push(
          new ExternalHyperlink({
            children: node.children.flatMap((child) => {
              const linkRuns = [];
              collectInline(child, linkRuns, ctx);
              return linkRuns;
            }),
            link: linkUrl,
          }),
        );
      }
      break;
    }
    case "image":
      handleInlineImage(node, runs, ctx);
      break;
    case "inlineMath":
      runs.push(
        new TextRun({
          text: node.value,
          italics: true,
        }),
      );
      break;
    case "footnoteReference":
      handleFootnoteRef(node, runs, ctx);
      break;
    case "break":
      runs.push(new TextRun({ break: 1 }));
      break;
    default:
      if (node.children) {
        for (const child of node.children) {
          collectInline(child, runs, ctx);
        }
      } else if (node.value) {
        runs.push(
          new TextRun({
            text: node.value,
          }),
        );
      }
  }
}

// ── Image handling ──

function detectImageType(data) {
  // Check magic bytes to determine image type
  if (
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47
  )
    return "png";
  if (data[0] === 0xff && data[1] === 0xd8) return "jpg";
  if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) return "gif";
  if (data[0] === 0x42 && data[1] === 0x4d) return "bmp";
  // Default to png - safest fallback for canvas-exported images
  return "png";
}

function handleInlineImage(node, runs, ctx) {
  const src = node.url || "";
  const imgData = ctx.imageMap ? ctx.imageMap.get(src) : null;

  if (imgData && imgData.data) {
    // Clone to break any Vue Proxy wrapper
    const rawData = new Uint8Array(imgData.data);
    const imageType = detectImageType(rawData);
    runs.push(
      new ImageRun({
        type: imageType,
        data: rawData,
        transformation: {
          width: imgData.width || 400,
          height: imgData.height || 300,
        },
        altText: {
          title: node.alt || "Image",
          description: node.alt || "Image",
          name: node.alt || "image",
        },
      }),
    );
  } else {
    runs.push(
      new TextRun({
        text: `[Image: ${node.alt || src}]`,
        italics: true,
      }),
    );
  }
}

// ── Footnote handling ──

function handleFootnoteRef(node, runs, ctx) {
  const id = node.identifier || node.label;
  const def = ctx.footnoteDefs ? ctx.footnoteDefs.get(id) : null;

  if (def) {
    const fnId = ctx.footnoteIdCounter++;
    const fnChildren = [];
    for (const child of def.children) {
      if (child.type === "paragraph") {
        const fnRuns = collectInlineRuns({ children: child.children }, ctx);
        fnChildren.push(new Paragraph({ children: fnRuns }));
      }
    }
    ctx.footnoteInstances.set(fnId, { children: fnChildren });
    runs.push(new FootnoteReferenceRun(fnId));
  } else {
    runs.push(
      new TextRun({
        text: `[${id}]`,
        superScript: true,
      }),
    );
  }
}

// ── Block handlers ──

function handleHeading(node, elements, ctx) {
  const runs = collectInlineRuns(
    { children: node.children },
    { ...ctx, font: DISPLAY_FONT },
  );
  elements.push(
    new Paragraph({
      children: runs,
      style: HEADING_STYLE_MAP[node.depth] || "Heading1",
    }),
  );
}

function handleParagraph(node, elements, ctx) {
  // Block image: paragraph with only an image child
  if (node.children.length === 1 && node.children[0].type === "image") {
    const imgNode = node.children[0];
    const runs = [];
    handleInlineImage(imgNode, runs, ctx);
    if (runs.length > 0) {
      elements.push(
        new Paragraph({
          children: runs,
          alignment: AlignmentType.CENTER,
        }),
      );
      return;
    }
  }

  // Linked image: paragraph > link > image (clickable badges)
  if (
    node.children.length === 1 &&
    node.children[0].type === "link" &&
    node.children[0].children.length === 1 &&
    node.children[0].children[0].type === "image"
  ) {
    const imgNode = node.children[0].children[0];
    const runs = [];
    handleInlineImage(imgNode, runs, ctx);
    if (runs.length > 0) {
      elements.push(
        new Paragraph({
          children: runs,
          alignment: AlignmentType.CENTER,
        }),
      );
      return;
    }
  }

  const runs = collectInlineRuns({ children: node.children }, ctx);
  elements.push(
    new Paragraph({
      children: runs,
      indent: ctx.isBlockquote
        ? { left: convertInchesToTwip(0.5) }
        : ctx.indent
          ? { left: convertInchesToTwip(ctx.indent) }
          : undefined,
    }),
  );
}

async function handleBlockquote(node, elements, ctx) {
  await walkChildren(node.children, elements, { ...ctx, isBlockquote: true });
}

async function handleList(node, elements, ctx) {
  const listId = nextListId();
  const ordered = node.ordered || false;
  const startNum = node.start ?? 1;
  const level = ctx.listLevel ?? 0;

  for (let i = 0; i < node.children.length; i++) {
    const item = node.children[i];
    await handleListItem(item, elements, {
      ...ctx,
      listId,
      listLevel: level,
      ordered,
      itemIndex: i + startNum,
    });
  }
}

async function handleListItem(node, elements, ctx) {
  const level = ctx.listLevel ?? 0;
  const bullet = ctx.ordered ? `${ctx.itemIndex}. ` : "• ";
  const indent = 0.3 + level * 0.3;

  for (const child of node.children) {
    if (child.type === "paragraph") {
      let prefixText = bullet;
      if (
        child.children.length > 0 &&
        child.children[0].type === "text" &&
        /^\[[ xX]\]/.test(child.children[0].value)
      ) {
        const checked = /^\[[xX]\]/.test(child.children[0].value);
        prefixText = checked ? "☑ " : "☐ ";
        child.children[0].value = child.children[0].value.replace(
          /^\[[ xX]\]\s*/,
          "",
        );
      }

      const runs = [
        new TextRun({ text: prefixText }),
        ...collectInlineRuns({ children: child.children }, ctx),
      ];
      elements.push(
        new Paragraph({
          children: runs,
          indent: { left: convertInchesToTwip(indent) },
        }),
      );
    } else if (child.type === "list") {
      await handleList(child, elements, {
        ...ctx,
        listLevel: level + 1,
      });
    } else {
      await walkNode(child, elements, {
        ...ctx,
        indent: indent,
      });
    }
  }
}

function handleCodeBlock(node, elements) {
  const lines = node.value.split("\n");
  for (const line of lines) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line || " ",
            font: { name: CODE_FONT },
            size: 20,
          }),
        ],
        shading: {
          type: ShadingType.CLEAR,
          fill: "F2F2F2",
          color: "auto",
        },
        spacing: { before: 0, after: 0, line: 276 },
        indent: { left: convertInchesToTwip(0.25) },
      }),
    );
  }
}

function getDocxAlignment(align) {
  switch (align) {
    case "center":
      return AlignmentType.CENTER;
    case "right":
      return AlignmentType.RIGHT;
    default:
      return AlignmentType.LEFT;
  }
}

async function handleTable(node, elements, ctx) {
  const alignments = node.align || [];
  const rows = [];

  const thinBorder = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: "BFBFBF",
  };
  const cellBorders = {
    top: thinBorder,
    bottom: thinBorder,
    left: thinBorder,
    right: thinBorder,
  };
  const cellMargins = {
    top: convertInchesToTwip(0.04),
    bottom: convertInchesToTwip(0.04),
    left: convertInchesToTwip(0.08),
    right: convertInchesToTwip(0.08),
  };

  for (let rowIdx = 0; rowIdx < node.children.length; rowIdx++) {
    const rowNode = node.children[rowIdx];
    if (rowNode.type !== "tableRow") continue;
    const isHeader = rowIdx === 0;
    const isEvenRow = rowIdx % 2 === 0;
    const cells = [];

    for (let cellIdx = 0; cellIdx < rowNode.children.length; cellIdx++) {
      const cellNode = rowNode.children[cellIdx];
      if (cellNode.type !== "tableCell") continue;

      const cellAlign = alignments[cellIdx] || "left";
      const runs = collectInlineRuns(
        { children: cellNode.children },
        { ...ctx, bold: isHeader },
      );

      let shading;
      if (isHeader) {
        shading = { type: ShadingType.CLEAR, fill: "D9E2F3", color: "auto" };
      } else if (isEvenRow) {
        shading = { type: ShadingType.CLEAR, fill: "F2F2F2", color: "auto" };
      }

      cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: runs,
              alignment: getDocxAlignment(cellAlign),
            }),
          ],
          shading,
          borders: cellBorders,
          margins: cellMargins,
        }),
      );
    }
    rows.push(new TableRow({ children: cells, tableHeader: isHeader }));
  }

  if (rows.length > 0) {
    elements.push(
      new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
    );
    elements.push(new Paragraph({ spacing: { after: 120 } }));
  }
}

function handleMathBlock(node, elements) {
  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: node.value,
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  );
}

function handleThematicBreak(elements) {
  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "─".repeat(50),
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  );
}
