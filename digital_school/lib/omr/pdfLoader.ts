export interface RenderedPdfPage {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export interface PdfRenderOptions {
  dpi?: number;
  oddPagesOnly?: boolean;
  pages?: number[];
}

// Load pdf.js dynamically in browser context
async function getPdfJs(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('PDF rendering is only supported in browser context');
  }

  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }

  // Load via script tag if not yet present
  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById('pdfjs-script');
    if (existingScript) {
      if ((window as any).pdfjsLib) {
        return resolve((window as any).pdfjsLib);
      }
      existingScript.addEventListener('load', () => {
        resolve((window as any).pdfjsLib);
      });
      existingScript.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.id = 'pdfjs-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib;
      if (pdfjs) {
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjs);
      } else {
        reject(new Error('Failed to load pdfjsLib from CDN'));
      }
    };
    script.onerror = (err) => reject(new Error('Error loading pdf.js script: ' + err));
    document.head.appendChild(script);
  });
}

export async function renderPdfToCanvases(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
  options: PdfRenderOptions = {}
): Promise<RenderedPdfPage[]> {
  const pdfjsLib = await getPdfJs();
  const dpi = options.dpi || 150;
  const scale = dpi / 72.0;

  let data: ArrayBuffer | Uint8Array;
  if (fileOrBuffer instanceof File) {
    data = await fileOrBuffer.arrayBuffer();
  } else {
    data = fileOrBuffer;
  }

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  let targetPages: number[] = [];
  if (options.pages && options.pages.length > 0) {
    targetPages = options.pages.filter(p => p >= 1 && p <= totalPages);
  } else if (options.oddPagesOnly) {
    for (let p = 1; p <= totalPages; p += 2) {
      targetPages.push(p);
    }
  } else {
    for (let p = 1; p <= totalPages; p++) {
      targetPages.push(p);
    }
  }

  const results: RenderedPdfPage[] = [];

  for (const pageNum of targetPages) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error(`Failed to acquire 2D canvas context for page ${pageNum}`);
    }

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    results.push({
      pageNumber: pageNum,
      canvas,
      width: canvas.width,
      height: canvas.height,
    });
  }

  return results;
}

