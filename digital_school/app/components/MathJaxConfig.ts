export const mathJaxConfig = {
  loader: { 
    load: ["input/tex", "output/chtml", "output/svg", "[tex]/mhchem"] 
  },
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    packages: { '[+]': ['mhchem', 'ams', 'base', 'extpfeil'] }
  },
  options: {
    enableEnrichment: false,
    renderActions: {
      findScript: [10, function (doc: any) {
        for (const node of Array.from(document.querySelectorAll('script[type^="math/tex"]')) as HTMLScriptElement[]) {
          doc.math.push(new doc.options.MathItem(node.textContent, doc.inputJax[0], !!node.type.match(/; *mode=display/)));
          node.parentNode?.removeChild(node);
        }
      }, '']
    }
  },
  startup: {
    ready: () => {
      console.log("MathJax is ready!");
      // @ts-ignore
      MathJax.startup.defaultReady();
    }
  }
};
