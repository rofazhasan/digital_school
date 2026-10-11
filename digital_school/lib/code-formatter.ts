/**
 * Code formatting and syntax enhancement utility for questions across all types:
 * MCQ, MC, INT, AR, MTF, CMA, MPC, CQ, SQ, DESCRIPTIVE, CODING
 */

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Basic syntax highlighter for C, C++, Python, JavaScript keywords
 */
function highlightCodeSyntax(code: string, lang: string): string {
    const escaped = escapeHtml(code);
    const l = (lang || '').toLowerCase();

    // Keywords set
    const keywords = [
        'def', 'return', 'import', 'from', 'as', 'if', 'elif', 'else', 'for', 'while', 'in', 'range', 'break', 'continue', 'pass', 'try', 'except', 'finally', 'class', 'with', 'lambda', 'yield', 'global', 'nonlocal', 'assert', 'True', 'False', 'None',
        'int', 'float', 'double', 'char', 'void', 'bool', 'auto', 'const', 'struct', 'typedef', 'sizeof', 'static', 'include', 'define', 'main', 'std', 'vector', 'string', 'cout', 'cin', 'endl', 'printf', 'scanf', 'malloc', 'free', 'new', 'delete', 'nullptr', 'NULL', 'public', 'private', 'protected', 'virtual', 'override'
    ];

    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');

    return escaped
        // Comments (single line)
        .replace(/(\/\/[^\n]*|#[^\n]*)/g, '<span class="text-emerald-400 italic font-sans opacity-80">$1</span>')
        // Strings (double or single quotes)
        .replace(/(&quot;.*?&quot;|&#39;.*?&#39;|".*?"|'.*?')/g, '<span class="text-amber-300">$1</span>')
        // Numbers
        .replace(/\b(\d+)\b/g, '<span class="text-cyan-300 font-bold">$1</span>')
        // Keywords
        .replace(keywordRegex, '<span class="text-purple-400 font-bold">$1</span>');
}

/**
 * Processes text to isolate code blocks and inline code before math rendering,
 * and restores them with beautiful, modern syntax-styled containers afterwards.
 */
export function extractCodeBlocks(text: string): {
    cleanText: string;
    restore: (renderedHtml: string) => string;
} {
    if (!text || (!text.includes('```') && !text.includes('`'))) {
        return {
            cleanText: text,
            restore: (h) => h
        };
    }

    const codePlaceholders: Map<string, string> = new Map();
    let counter = 0;

    // 1. Extract fenced code blocks: ```lang\ncode\n```
    let processed = text.replace(/```([a-zA-Z0-9_\+\#\.\-]*)?\n?([\s\S]*?)```/g, (_, langRaw, codeRaw) => {
        const placeholder = `___CODE_BLOCK_${counter++}___`;
        const lang = (langRaw || 'code').trim();
        const code = codeRaw ? codeRaw.replace(/^\n+|\n+$/g, '') : '';
        const highlighted = highlightCodeSyntax(code, lang);

        const html = `
<div class="relative my-2.5 rounded-xl bg-slate-950/95 border border-slate-800 shadow-md overflow-hidden text-left font-mono text-xs sm:text-sm text-slate-100 not-prose">
  <div class="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-sans font-semibold text-slate-400 select-none">
    <span class="flex items-center gap-1.5 uppercase tracking-wider text-primary-300 font-bold">
      <span class="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
      ${lang || 'CODE'}
    </span>
    <span class="text-[10px] text-slate-500 font-mono">${code.split('\n').length} lines</span>
  </div>
  <pre class="p-3.5 overflow-x-auto leading-relaxed custom-scrollbar font-mono text-slate-200"><code>${highlighted}</code></pre>
</div>`.trim();

        codePlaceholders.set(placeholder, html);
        return placeholder;
    });

    // 2. Extract inline code: `code` (single backtick, not triple)
    processed = processed.replace(/(?<!`)`([^`\n]+)`(?!`)/g, (_, inlineCode) => {
        const placeholder = `___INLINE_CODE_${counter++}___`;
        const escaped = escapeHtml(inlineCode);
        const html = `<code class="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 font-mono text-[0.88em] font-semibold text-pink-600 dark:text-pink-400 select-all">${escaped}</code>`;
        codePlaceholders.set(placeholder, html);
        return placeholder;
    });

    return {
        cleanText: processed,
        restore: (html: string) => {
            let result = html;
            codePlaceholders.forEach((codeHtml, placeholder) => {
                result = result.replaceAll(placeholder, codeHtml);
            });
            return result;
        }
    };
}
