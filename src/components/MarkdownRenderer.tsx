import React, { useState } from 'react';
import { marked, Token, Tokens } from 'marked';
import { Check, Copy, Terminal } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const displayLang = (language || 'text').toLowerCase();

  return (
    <div className="relative my-4 rounded-xl border border-white/10 bg-[#0d1117] overflow-hidden shadow-lg group">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-white/5 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono uppercase tracking-wider font-semibold text-slate-300">
            {displayLang}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="overflow-x-auto p-4 font-mono text-xs sm:text-sm text-slate-200 leading-relaxed scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <pre className="!bg-transparent !p-0 !m-0 font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming }) => {
  // If streaming and content ends with unclosed code block, handle gracefully
  let tokens: Token[] = [];
  try {
    tokens = marked.lexer(content);
  } catch (e) {
    return <div className="whitespace-pre-wrap leading-relaxed">{content}</div>;
  }

  return (
    <div className="prose prose-invert max-w-none text-slate-200 text-sm sm:text-[15px] leading-relaxed space-y-3.5 break-words">
      {tokens.map((token, index) => {
        return <TokenRenderer key={index} token={token} />;
      })}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle rounded-xs" />
      )}
    </div>
  );
};

const TokenRenderer: React.FC<{ token: Token }> = ({ token }) => {
  switch (token.type) {
    case 'code': {
      const codeToken = token as Tokens.Code;
      return <CodeBlock language={codeToken.lang} code={codeToken.text} />;
    }

    case 'heading': {
      const headingToken = token as Tokens.Heading;
      const sizeClasses = {
        1: 'text-2xl font-bold tracking-tight text-white mt-6 mb-3',
        2: 'text-xl font-bold tracking-tight text-white mt-5 mb-2.5 pb-1 border-b border-white/10',
        3: 'text-lg font-semibold text-slate-100 mt-4 mb-2',
        4: 'text-base font-semibold text-slate-200 mt-3 mb-1.5',
        5: 'text-sm font-semibold text-slate-300 mt-2 mb-1',
        6: 'text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2 mb-1',
      }[headingToken.depth] || 'text-base font-bold text-white';

      switch (headingToken.depth) {
        case 1:
          return <h1 className={sizeClasses}><InlineContent text={headingToken.text} /></h1>;
        case 2:
          return <h2 className={sizeClasses}><InlineContent text={headingToken.text} /></h2>;
        case 3:
          return <h3 className={sizeClasses}><InlineContent text={headingToken.text} /></h3>;
        case 4:
          return <h4 className={sizeClasses}><InlineContent text={headingToken.text} /></h4>;
        case 5:
          return <h5 className={sizeClasses}><InlineContent text={headingToken.text} /></h5>;
        default:
          return <h6 className={sizeClasses}><InlineContent text={headingToken.text} /></h6>;
      }
    }

    case 'paragraph': {
      const paraToken = token as Tokens.Paragraph;
      return (
        <p className="leading-relaxed text-slate-200 my-2">
          <InlineContent text={paraToken.text} />
        </p>
      );
    }

    case 'list': {
      const listToken = token as Tokens.List;
      const ListTag = listToken.ordered ? 'ol' : 'ul';
      const listClasses = listToken.ordered
        ? 'list-decimal list-outside ml-6 space-y-1.5 my-2.5 text-slate-200'
        : 'list-disc list-outside ml-6 space-y-1.5 my-2.5 text-slate-200';

      return (
        <ListTag className={listClasses} start={listToken.start || 1}>
          {listToken.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed pl-1 marker:text-cyan-400">
              <InlineContent text={item.text} />
            </li>
          ))}
        </ListTag>
      );
    }

    case 'blockquote': {
      const bqToken = token as Tokens.Blockquote;
      return (
        <blockquote className="border-l-4 border-cyan-500/60 pl-4 py-1 my-3 bg-cyan-950/20 rounded-r-lg text-slate-300 italic">
          <InlineContent text={bqToken.text} />
        </blockquote>
      );
    }

    case 'table': {
      const tableToken = token as Tokens.Table;
      return (
        <div className="overflow-x-auto my-4 rounded-xl border border-white/10 bg-slate-900/60 shadow-md">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {tableToken.header.map((head, idx) => (
                  <th key={idx} className="px-4 py-2.5 font-semibold text-white">
                    <InlineContent text={head.text} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tableToken.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-2 text-slate-300">
                      <InlineContent text={cell.text} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'hr':
      return <hr className="my-5 border-white/10" />;

    case 'space':
      return null;

    default:
      // Fallback for custom or unhandled tokens
      if ('text' in token && typeof (token as any).text === 'string') {
        return (
          <div className="my-1 text-slate-200">
            <InlineContent text={(token as any).text} />
          </div>
        );
      }
      return null;
  }
};

/**
 * Handles inline formatting: bold, italic, inline code, links, strikethrough
 */
const InlineContent: React.FC<{ text: string }> = ({ text }) => {
  const parts = parseInlineMarkdown(text);
  return <>{parts}</>;
};

function parseInlineMarkdown(raw: string): React.ReactNode[] {
  if (!raw) return [];

  // Match:
  // 1. Inline code: `code`
  // 2. Links: [label](url)
  // 3. Bold: **text** or __text__
  // 4. Italic: *text* or _text_
  // 5. Strikethrough: ~~text~~
  const regex = /(`[^`]+`)|(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(~~([^~]+)~~)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(raw.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Inline code
      const code = match[1].slice(1, -1);
      nodes.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 mx-0.5 rounded-md text-xs sm:text-[13px] font-mono bg-cyan-950/40 border border-cyan-500/20 text-cyan-300"
        >
          {code}
        </code>
      );
    } else if (match[2]) {
      // Link [text](url)
      const linkText = match[3];
      const linkUrl = match[4];
      nodes.push(
        <a
          key={match.index}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors inline-flex items-center gap-0.5"
        >
          {linkText}
        </a>
      );
    } else if (match[5]) {
      // Bold
      nodes.push(<strong key={match.index} className="font-semibold text-white">{match[6]}</strong>);
    } else if (match[7]) {
      // Italic
      nodes.push(<em key={match.index} className="italic text-slate-300">{match[8]}</em>);
    } else if (match[9]) {
      // Strikethrough
      nodes.push(<del key={match.index} className="line-through text-slate-500">{match[10]}</del>);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < raw.length) {
    nodes.push(raw.slice(lastIndex));
  }

  return nodes;
}
