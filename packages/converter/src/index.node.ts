import { createCanvas, Canvas } from 'canvas';
import { pdf2img as _pdf2img, Pdf2ImgOptions } from './pdf2img.js';
import { pdf2size as _pdf2size, Pdf2SizeOptions } from './pdf2size.js';

let pdfjsLibPromise: Promise<any> | null = null;

const getPdfjsLib = async () => {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = (async () => {
      // Use Function constructor to prevent TypeScript from converting to require()
      const dynamicImport = new Function('specifier', 'return import(specifier)');
      const pdfjsLib = await dynamicImport('pdfjs-dist/legacy/build/pdf.mjs');
      // Set worker source to the URL path instead of importing the module
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs';
      return pdfjsLib;
    })();
  }
  return pdfjsLibPromise;
};

export const pdf2img = async (
  pdf: ArrayBuffer | Uint8Array,
  options: Pdf2ImgOptions = {},
): Promise<ArrayBuffer[]> => {
  const pdfjsLib = await getPdfjsLib();
  return _pdf2img(pdf, options, {
    getDocument: (pdf) => pdfjsLib.getDocument(pdf).promise,
    createCanvas: (width, height) => {
      const canvas = createCanvas(width, height);
      // Ensure the canvas has the expected interface for pdfjs
      if (!canvas.getContext) {
        throw new Error('Canvas does not support getContext');
      }
      // Add any missing properties that pdfjs might expect
      if (!canvas.style) {
        (canvas as any).style = {};
      }
      if (!canvas.width) {
        (canvas as any).width = width;
      }
      if (!canvas.height) {
        (canvas as any).height = height;
      }
      return canvas as unknown as HTMLCanvasElement;
    },
    canvasToArrayBuffer: (canvas) => {
      // Using a more specific type for the canvas from the 'canvas' package
      const nodeCanvas = canvas as unknown as Canvas;
      // Get buffer from the canvas - using the synchronous version without parameters
      // This will use the default PNG format
      const buffer = nodeCanvas.toBuffer();
      // Convert to ArrayBuffer
      return new Uint8Array(buffer).buffer;
    },
  });
};

export const pdf2size = async (pdf: ArrayBuffer | Uint8Array, options: Pdf2SizeOptions = {}) => {
  const pdfjsLib = await getPdfjsLib();
  return _pdf2size(pdf, options, {
    getDocument: (pdf) => pdfjsLib.getDocument(pdf).promise,
  });
};

export { img2pdf } from './img2pdf.js';
