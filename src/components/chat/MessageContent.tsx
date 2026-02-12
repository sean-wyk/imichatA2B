import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

type MessageContentProps = {
  content: string;
  isSelf: boolean;
};

export function MessageContent({ content, isSelf }: MessageContentProps) {
  const isFileLink = (url: string) => {
    return url.includes("/api/telegram/file/");
  };

  const extractFileName = (text: string) => {
    const match = text.match(/\*\*Name:\*\*\s*(.+)/);
    return match ? match[1].trim() : null;
  };

  const extractFileSize = (text: string) => {
    const match = text.match(/\*\*Size:\*\*\s*(.+)/);
    return match ? match[1].trim() : null;
  };

  return (
    <div className="message-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-bold mt-2 mb-1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold mt-2 mb-1">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>
          ),
          p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="my-0.5">{children}</li>,
          code: ({ className, children }) => {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const isInline = !match;
            
            if (isInline) {
              return (
                <code
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                    isSelf
                      ? "bg-emerald-700/40 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {children}
                </code>
              );
            }

            return (
              <SyntaxHighlighter
                language={language}
                style={isSelf ? oneDark : oneLight}
                customStyle={{
                  margin: "0.5rem 0",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.6875rem",
                  background: isSelf ? "rgba(4, 120, 87, 0.3)" : "#f8fafc",
                }}
                codeTagProps={{
                  style: {
                    fontFamily: "monospace",
                  },
                }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            );
          },
          blockquote: ({ children }) => (
            <blockquote
              className={`my-2 pl-3 border-l-2 italic ${
                isSelf
                  ? "border-emerald-300 text-white/90"
                  : "border-slate-300 text-slate-600"
              }`}
            >
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="min-w-full text-[11px] border-collapse">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th
              className={`border px-2 py-1 font-semibold ${
                isSelf
                  ? "border-emerald-400 bg-emerald-700/40"
                  : "border-slate-300 bg-slate-100"
              }`}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className={`border px-2 py-1 ${
                isSelf ? "border-emerald-400" : "border-slate-300"
              }`}
            >
              {children}
            </td>
          ),
          a: ({ children, href }) => {
            const isFile = href && isFileLink(href);
            
            if (isFile) {
              const fileName = extractFileName(content) || "Download File";
              const fileSize = extractFileSize(content);
              
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                    isSelf
                      ? "bg-emerald-700/40 hover:bg-emerald-700/60 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs font-medium">
                    {fileName}
                    {fileSize && <span className="opacity-70 ml-1">({fileSize})</span>}
                  </span>
                </a>
              );
            }
            
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`underline hover:opacity-80 ${
                  isSelf ? "text-emerald-100" : "text-sky-600"
                }`}
              >
                {children}
              </a>
            );
          },
          hr: () => (
            <hr
              className={`my-2 ${
                isSelf ? "border-emerald-400" : "border-slate-300"
              }`}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
