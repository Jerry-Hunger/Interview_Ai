import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownRendererProps = {
  content: string;
  /** 渲染变体：default=完整样式(反馈/结果)、chat=聊天气泡(紧凑)、compact=极简(面试问题) */
  variant?: "default" | "chat" | "compact";
  className?: string;
};

/** 统一 Markdown 渲染组件，替代所有分散的 ReactMarkdown 配置 */
const MarkdownRenderer = ({ content, variant = "default", className }: MarkdownRendererProps) => {
  const components = variant === "compact" ? compactComponents
    : variant === "chat" ? chatComponents
    : defaultComponents;

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

/** 内联 code 与代码块的判断逻辑 */
const renderCode = ({ className, children, ...props }: React.ComponentProps<"code">) => {
  const match = /language-(\w+)/.exec(className || "");
  const isInline = !match && !className;
  return isInline ? (
    <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-sm font-mono" {...props}>{children}</code>
  ) : (
    <code className={`block p-4 rounded-lg bg-gray-900 dark:bg-gray-800 text-gray-100 text-sm font-mono overflow-x-auto ${className || ""}`} {...props}>{children}</code>
  );
};

/** 默认配置：完整样式，用于面试反馈/评估结果 */
const defaultComponents = {
  code: renderCode,
  h1: ({ children }: React.ComponentProps<"h1">) => <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{children}</h1>,
  h2: ({ children }: React.ComponentProps<"h2">) => <h2 className="text-xl font-bold mb-3 mt-6 text-gray-900 dark:text-white">{children}</h2>,
  h3: ({ children }: React.ComponentProps<"h3">) => <h3 className="text-lg font-semibold mb-2 mt-4 text-gray-900 dark:text-white">{children}</h3>,
  p: ({ children }: React.ComponentProps<"p">) => <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">{children}</p>,
  ul: ({ children }: React.ComponentProps<"ul">) => <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }: React.ComponentProps<"ol">) => <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 mb-2 space-y-1">{children}</ol>,
  li: ({ children }: React.ComponentProps<"li">) => <li className="text-sm text-gray-700 dark:text-gray-300">{children}</li>,
  strong: ({ children }: React.ComponentProps<"strong">) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
  em: ({ children }: React.ComponentProps<"em">) => <em className="italic">{children}</em>,
  blockquote: ({ children }: React.ComponentProps<"blockquote">) => <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-gray-600 dark:text-gray-400 my-2">{children}</blockquote>,
  table: ({ children }: React.ComponentProps<"table">) => <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-2">{children}</table>,
  th: ({ children }: React.ComponentProps<"th">) => <th className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-left text-xs font-semibold text-gray-700 dark:text-gray-200">{children}</th>,
  td: ({ children }: React.ComponentProps<"td">) => <td className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">{children}</td>,
  hr: () => <hr className="my-4 border-gray-200 dark:border-gray-700" />,
};

/** 聊天变体：紧凑样式，用于聊天气泡内容 */
const chatComponents = {
  p: ({ children }: React.ComponentProps<"p">) => <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-200 mb-2 last:mb-0">{children}</p>,
  strong: ({ children }: React.ComponentProps<"strong">) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
  ul: ({ children }: React.ComponentProps<"ul">) => <ul className="list-disc list-inside text-sm text-gray-900 dark:text-gray-200">{children}</ul>,
  ol: ({ children }: React.ComponentProps<"ol">) => <ol className="list-decimal list-inside text-sm text-gray-900 dark:text-gray-200">{children}</ol>,
  li: ({ children }: React.ComponentProps<"li">) => <li className="text-gray-900 dark:text-gray-200">{children}</li>,
  code: renderCode,
  blockquote: ({ children }: React.ComponentProps<"blockquote">) => <blockquote className="border-l-3 border-indigo-400 pl-3 italic text-gray-600 dark:text-gray-400 my-1">{children}</blockquote>,
};

/** 极简变体：用于面试进行时的当前问题显示（不设颜色/大小，继承容器样式） */
const compactComponents = {
  p: ({ children }: React.ComponentProps<"p">) => <p className="mb-1 last:mb-0">{children}</p>,
  strong: ({ children }: React.ComponentProps<"strong">) => <strong className="font-semibold">{children}</strong>,
  ul: ({ children }: React.ComponentProps<"ul">) => <ul className="list-disc list-inside mb-1">{children}</ul>,
  ol: ({ children }: React.ComponentProps<"ol">) => <ol className="list-decimal list-inside mb-1">{children}</ol>,
  hr: () => <hr className="my-2 border-gray-300 dark:border-gray-600" />,
};

export default MarkdownRenderer;
