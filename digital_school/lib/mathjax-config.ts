/**
 * Centralized MathJax Configuration
 * Supports Bangla/Unicode text in LaTeX tables and equations
 */

export const mathJaxConfig = {
    loader: {
        load: ['[tex]/ams', '[tex]/textmacros', '[tex]/unicode']
    },
    tex: {
        packages: {
            '[+]': ['ams', 'textmacros', 'unicode']
        },
        inlineMath: [
            ['$', '$'],
            ['\\(', '\\)']
        ],
        displayMath: [
            ['$$', '$$'],
            ['\\[', '\\]']
        ],
        // Enable processing of text mode for Unicode/Bangla
        processEscapes: true,
        processEnvironments: true,
        // Allow Unicode characters in math mode
        unicode: {
            fonts: 'STIXGeneral, \'Arial Unicode MS\''
        }
    },
    svg: {
        // Use SVG for better Unicode support
        fontCache: 'global',
        // Ensure proper font fallback for Bangla
        mtextInheritFont: true,
        merrorInheritFont: true,
        mathmlSpacing: true,
        exFactor: 0.5
    },
    options: {
        // Enable assistive features
        enableMenu: false,
        // Skip HTML tags
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
        // Process class names
        processHtmlClass: 'mathjax',
        ignoreHtmlClass: 'no-mathjax'
    },
    startup: {
        // Ensure proper rendering on load
        typeset: true,
        ready: () => {
            // @ts-ignore
            if (typeof MathJax !== 'undefined') {
                // @ts-ignore
                MathJax.startup.defaultReady();
                // @ts-ignore
                MathJax.startup.promise.then(() => {
                    console.log('MathJax loaded with Unicode support');
                });
            }
        }
    }
};

/**
 * Helper function to wrap Bangla text in \text{} for proper rendering
 * Use this when you have mixed Bangla and math in the same expression
 * 
 * Example:
 * wrapBanglaInText("সমীকরণ: $x^2 + y^2 = r^2$")
 * Returns: "\text{সমীকরণ: }x^2 + y^2 = r^2"
 */
export function wrapBanglaInText(content: string): string {
    // Regex to detect Bangla Unicode range (U+0980 to U+09FF)
    const banglaRegex = /([\u0980-\u09FF\s]+)/g;

    // Don't process if already wrapped or if it's pure math
    if (content.includes('\\text{') || !banglaRegex.test(content)) {
        return content;
    }

    // Wrap Bangla segments in \text{}
    return content.replace(banglaRegex, (match) => {
        // Skip if it's inside existing commands
        return `\\text{${match}}`;
    });
}

/**
 * Process LaTeX tables with Bangla content
 * Automatically wraps Bangla text in table cells
 * 
 * Example:
 * $$
 * \begin{array}{|c|c|}
 * \hline
 * নাম & মান \\
 * \hline
 * x & 5 \\
 * \hline
 * \end{array}
 * $$
 */
export function processBanglaTable(latex: string): string {
    // Find table environments
    const tableRegex = /\\begin{(array|tabular|table)}[\s\S]*?\\end{\1}/g;

    return latex.replace(tableRegex, (match) => {
        // Split by rows (\\)
        const rows = match.split('\\\\');

        const processedRows = rows.map(row => {
            // Split by cells (&)
            const cells = row.split('&');

            const processedCells = cells.map(cell => {
                // Check if cell contains Bangla
                if (/[\u0980-\u09FF]/.test(cell)) {
                    // Wrap Bangla parts in \text{}
                    return cell.replace(/([\u0980-\u09FF\s]+)/g, '\\text{$1}');
                }
                return cell;
            });

            return processedCells.join('&');
        });

        return processedRows.join('\\\\');
    });
}

export default mathJaxConfig;
