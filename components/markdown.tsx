import Link from "next/link";
import React, { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// // `rehype-katex` does not import the CSS for you
// import "katex/dist/katex.min.css";
// Note: this is done in the chat layout.tsx

import { cn } from "@/lib/utils";

const components: Partial<Components> = {
  p: ({ children }) => <div>{children}</div>,

  strong: ({ node, ...props }) => <span className="font-semibold" {...props} />,
  a: ({ node, href = "#", ...props }) => (
    <Link
      className="text-blue-500 hover:underline"
      target="_blank"
      rel="noreferrer"
      {...props}
      href={href}
    />
  ),

  ol: ({ node, ...props }) => (
    <ol className="list-decimal list-outside ml-4" {...props} />
  ),
  li: ({ node, ...props }) => <li className="py-1" {...props} />,
  ul: ({ node, ...props }) => (
    <ul className="list-decimal list-outside ml-4" {...props} />
  ),

  h1: ({ node, ...props }) => (
    <h1 className="text-3xl font-semibold mt-6 mb-2" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-2xl font-semibold mt-6 mb-2" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-xl font-semibold mt-6 mb-2" {...props} />
  ),
  h4: ({ node, ...props }) => (
    <h4 className="text-lg font-semibold mt-6 mb-2" {...props} />
  ),
  h5: ({ node, ...props }) => (
    <h5 className="text-base font-semibold mt-6 mb-2" {...props} />
  ),
  h6: ({ node, ...props }) => (
    <h6 className="text-sm font-semibold mt-6 mb-2" {...props} />
  ),

  // currently, this library uses `pre` for multiline code blocks, and no
  // longer passes `inline` to `code`:
  // https://github.com/remarkjs/react-markdown/commit/434627686e21d4bcfb4301417e0da2bb851d4391
  //
  // Hence, we don't put our custom `code`, maybe having a nested <div>, inside a <pre> tag,
  // and instead elide the <pre> altogether.
  pre: ({ children }) => <>{children}</>,

  code: ({ node, className, ...props }) => {
    if (!node) throw new Error("node is required");
    const isInline =
      node.children.length === 1 &&
      node.children[0].type === "text" &&
      !node.children[0].value.includes("\n");
    console.log(node, isInline, className);

    // let langs: string[] = [];
    // if ("className" in node.properties) {
    //   const classes = node.properties.className;
    //   invariant(Array.isArray(classes), "classes must be an array");
    //   langs = classes.filter((c) => {
    //     invariant(typeof c === "string", "class must be a string");
    //     return c.startsWith("language-");
    //   }) as string[];
    // }

    const commonCodeCss = "not-prose text-sm font-mono whitespace-pre-wrap";
    const inlineCodeCss = "border py-0.5 px-1 rounded-md";

    if (isInline) {
      return (
        <code
          className={cn(commonCodeCss, inlineCodeCss, className)}
          {...props}
        />
      );
    }

    return (
      <div className="border rounded-md p-2">
        <code className={cn(commonCodeCss, className)} {...props} />
      </div>
    );
  },
};

const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeKatex];

// in nodejs, on my M1 macbook, reusing this saves ~5ms (~10ms -> ~5ms for .replaceAll(...))
const latexRegexStateful = /(\\\((.+?)\\\)|\\\[(.+?)\\\])/gsu;

/*

Examples:

const examples = `
\\[
\\Gamma(n) = \\int_0^\\infty t^{n-1} e^{-t} dt
\\]

$\\sigma_U \\sim \\mathrm{Normal}(0, \\Theta_U^2)$


Lift($$L$$) can be determined by Lift Coefficient ($$C_L$$) like the following
equation.

$$
L = \\frac{1}{2} \\rho v^2 S C_L
$$

\`\`\`math
L2 = \\frac{1}{2} \\rho v^2 S C_L
\`\`\`

`;
 */

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  if (typeof children !== "string")
    throw new Error("markdown children must be a string");

  // \(v\) -> $$v$$
  // \[v\] -> $$v$$
  // children = children.replace(/\\\((.+?)\\\)/gsu, "$$$$$1$$$$");
  // children = children.replace(/\\\[(.+?)\\\]/gsu, "$$$$$1$$$$");
  // -or-
  // together in one regex:
  latexRegexStateful.lastIndex = 0;
  children = children.replaceAll(latexRegexStateful, "$$$$$2$3$$$$");

  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
