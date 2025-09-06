import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownTextProps {
  content: string;
}

const MarkdownText: React.FC<MarkdownTextProps> = ({ content }) => (
  <ReactMarkdown
    components={{
      h1: ({ children }) => (
        <h1 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-6 mb-4 border-b pb-1 border-gray-300 dark:border-gray-600">
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mt-5 mb-3">
          {children}
        </h2>
      ),
      p: ({ children }) => (
        <p className="text-gray-800 dark:text-gray-200 text-base leading-relaxed mb-3">
          {children}
        </p>
      ),
      ul: ({ children }) => (
        <ul className="list-disc list-inside space-y-1 mb-3 text-gray-800 dark:text-gray-200">
          {children}
        </ul>
      ),
      li: ({ children }) => <li className="ml-6">{children}</li>,
      strong: ({ children }) => (
        <strong className="font-semibold text-gray-900 dark:text-gray-100">
          {children}
        </strong>
      ),
      em: ({ children }) => (
        <em className="italic text-gray-700 dark:text-gray-300">{children}</em>
      ),
      code: ({ children }) => (
        <code className="bg-gray-100 dark:bg-gray-800 text-purple-600 dark:text-purple-300 px-1 py-0.5 rounded text-sm">
          {children}
        </code>
      ),
    }}
  >
    {content}
  </ReactMarkdown>
);

export default MarkdownText;
