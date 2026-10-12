import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Safe by default: react-markdown never renders raw HTML from the model's answer.
const components = {
  h1: ({ node, ...props }) => <h3 className="mt-3 mb-1.5 text-sm font-bold text-slate-900 dark:text-white" {...props} />,
  h2: ({ node, ...props }) => <h3 className="mt-3 mb-1.5 text-sm font-bold text-slate-900 dark:text-white" {...props} />,
  h3: ({ node, ...props }) => <h3 className="mt-3 mb-1.5 text-sm font-bold text-slate-900 dark:text-white first:mt-0" {...props} />,
  h4: ({ node, ...props }) => <h4 className="mt-2.5 mb-1 text-xs font-bold text-slate-800 dark:text-slate-100" {...props} />,
  p: ({ node, ...props }) => <p className="my-1.5 leading-relaxed" {...props} />,
  // remark-gfm marks checklists with "contains-task-list"/"task-list-item"; keep them inside the bubble padding.
  ul: ({ node, className, ...props }) => (
    <ul className={`my-1.5 space-y-1 ${className?.includes("contains-task-list") ? "list-none pl-0" : "list-disc pl-4"}`} {...props} />
  ),
  ol: ({ node, className, ...props }) => <ol className="my-1.5 list-decimal space-y-1 pl-4" {...props} />,
  li: ({ node, className, ...props }) => <li className="leading-relaxed" {...props} />,
  input: ({ node, ...props }) => <input {...props} disabled className="mr-1.5 align-middle accent-indigo-600" />,
  strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900 dark:text-white" {...props} />,
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline dark:text-indigo-400" />,
  hr: () => <hr className="my-3 border-slate-200 dark:border-slate-700" />,
  table: ({ node, ...props }) => (
    <div className="my-2 -mx-1 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="w-full text-left text-[11px] sm:text-xs" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => <thead className="bg-slate-50 dark:bg-slate-800" {...props} />,
  // Amounts never wrap; wide tables scroll inside the bubble instead.
  th: ({ node, ...props }) => <th className="whitespace-nowrap px-2 py-1.5 font-semibold text-slate-700 dark:text-slate-200" {...props} />,
  td: ({ node, ...props }) => <td className="whitespace-nowrap border-t border-slate-200 px-2 py-1.5 align-top dark:border-slate-700" {...props} />
};

export function MarkdownMessage({ text }) {
  return (
    <div className="min-w-0 break-words">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>{text}</Markdown>
    </div>
  );
}
