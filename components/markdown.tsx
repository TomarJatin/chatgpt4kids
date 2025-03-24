import Link from "next/link";
import React, { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// // `rehype-katex` does not import the CSS for you
// import "katex/dist/katex.min.css";
// Note: this is done in the chat layout.tsx

import { CodeBlock } from "./code-block";

const components: Partial<Components> = {
  // @ts-expect-error
  code: CodeBlock,
  pre: ({ children }) => <>{children}</>,
  ol: ({ node, children, ...props }) => {
    return (
      <ol className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="py-1" {...props}>
        {children}
      </li>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ node, children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    );
  },
  a: ({ node, children, ...props }) => {
    return (
      <Link
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noreferrer"
        {...props}
        href={props.href ?? "#"}
      >
        {children}
      </Link>
    );
  },
  h1: ({ node, children, ...props }) => {
    return (
      <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ node, children, ...props }) => {
    return (
      <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ node, children, ...props }) => {
    return (
      <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ node, children, ...props }) => {
    return (
      <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ node, children, ...props }) => {
    return (
      <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
        {children}
      </h5>
    );
  },
  h6: ({ node, children, ...props }) => {
    return (
      <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
        {children}
      </h6>
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
