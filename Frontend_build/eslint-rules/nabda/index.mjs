const MESSAGE = "Use the logical equivalent.";

function physicalUtility(value) {
  const tokens = value.split(/\s+/u).filter(Boolean);

  return tokens.find((token) => {
    const utility = token.split(":").at(-1) ?? token;
    return (
      /^(?:ml|mr|pl|pr|left|right)-/u.test(utility) ||
      /^text-(?:left|right)$/u.test(utility) ||
      /^border-(?:l|r)(?:-|$)/u.test(utility)
    );
  });
}

function physicalCssDeclarations(sourceCode) {
  const pattern = /\b(margin-left|margin-right|padding-left|padding-right|left|right)\s*:/gu;
  const matches = [];
  let match = pattern.exec(sourceCode.text);

  while (match) {
    matches.push({ index: match.index, value: match[1] });
    match = pattern.exec(sourceCode.text);
  }

  return matches;
}

const noPhysicalProperties = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow physical CSS properties and Tailwind direction utilities.",
    },
    schema: [],
    messages: {
      logicalEquivalent: MESSAGE,
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;

    function reportString(node, value) {
      if (!physicalUtility(value)) return;
      context.report({ node, messageId: "logicalEquivalent" });
    }

    return {
      Program(node) {
        if (!context.filename.includes(".css")) return;

        for (const match of physicalCssDeclarations(sourceCode)) {
          const start = sourceCode.getLocFromIndex(match.index);
          const end = sourceCode.getLocFromIndex(match.index + match.value.length);
          context.report({ node, loc: { start, end }, messageId: "logicalEquivalent" });
        }
      },
      Literal(node) {
        if (typeof node.value === "string") reportString(node, node.value);
      },
      TemplateElement(node) {
        reportString(node, node.value.raw);
      },
    };
  },
};

const cssProcessor = {
  meta: { name: "nabda/css-logical-properties", version: "1.0.0" },
  preprocess(text, filename) {
    const commentedCss = text
      .split(/\r?\n/u)
      .map((line) => `//${line}`)
      .join("\n");

    return [{ text: commentedCss, filename: `${filename}.js` }];
  },
  postprocess(messageLists) {
    return messageLists.flat().map((message) => ({
      ...message,
      column: Math.max(1, message.column - 2),
      endColumn: message.endColumn ? Math.max(1, message.endColumn - 2) : message.endColumn,
    }));
  },
  supportsAutofix: false,
};

const plugin = {
  meta: { name: "eslint-plugin-nabda", version: "1.0.0" },
  rules: { "no-physical-properties": noPhysicalProperties },
  processors: { css: cssProcessor },
};

export default plugin;
