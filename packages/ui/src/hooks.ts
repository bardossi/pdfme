import { RefObject, useRef, useState, useCallback, useEffect } from 'react';
import {
  cloneDeep,
  ZOOM,
  Template,
  Size,
  getB64BasePdf,
  b64toUint8Array,
  SchemaForUI,
  ChangeSchemas,
  isBlankPdf,
} from '@sunnystudiohu/common';
import { pdf2img, pdf2size } from '@sunnystudiohu/converter';

import {
  schemasList2template,
  uuid,
  getUniqueSchemaName,
  moveCommandToChangeSchemasArg,
  arrayBufferToBase64,
  initShortCuts,
  destroyShortCuts,
} from './helper.js';

export const usePrevious = <T>(value: T) => {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
};

const getScale = (n: number, paper: number) =>
  Math.floor((n / paper > 1 ? 1 : n / paper) * 100) / 100;

type UIPreProcessorProps = { template: Template; size: Size; zoomLevel: number; maxZoom: number };

export const useUIPreProcessor = ({ template, size, zoomLevel, maxZoom }: UIPreProcessorProps) => {
  const [backgrounds, setBackgrounds] = useState<string[]>([]);
  const [pageSizes, setPageSizes] = useState<Size[]>([]);
  const [scale, setScale] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const init = async (prop: { template: Template; size: Size }) => {
    const {
      template: { basePdf, schemas },
      size,
    } = prop;

    let paperWidth: number;
    let paperHeight: number;
    let _backgrounds: string[];
    let _pageSizes: { width: number; height: number }[];

    if (isBlankPdf(basePdf)) {
      const { width, height } = basePdf;
      paperWidth = width * ZOOM;
      paperHeight = height * ZOOM;
      _backgrounds = schemas.map(
        () =>
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdj+P///38ACfsD/QVDRcoAAAAASUVORK5CYII=',
      );
      _pageSizes = schemas.map(() => ({ width, height }));
    } else {
      const _basePdf = await getB64BasePdf(basePdf);

      const uint8Array = b64toUint8Array(_basePdf);
      // Create a new ArrayBuffer copy to avoid detachment issues
      const pdfArrayBuffer = new ArrayBuffer(uint8Array.byteLength);
      new Uint8Array(pdfArrayBuffer).set(uint8Array);

      const [_pages, imgBuffers] = await Promise.all([
        pdf2size(pdfArrayBuffer),
        pdf2img(pdfArrayBuffer.slice(), { scale: maxZoom }),
      ]);
      _pageSizes = _pages;
      paperWidth = _pageSizes[0].width * ZOOM;
      paperHeight = _pageSizes[0].height * ZOOM;
      _backgrounds = imgBuffers.map(arrayBufferToBase64);
    }

    const _scale = Math.min(
      getScale(size.width, paperWidth),
      getScale(size.height, paperHeight),
    );

    return {
      backgrounds: _backgrounds,
      pageSizes: _pageSizes,
      scale: _scale,
    };
  };

  useEffect(() => {
    init({ template, size })
      .then(({ pageSizes, scale, backgrounds }) => {
        setPageSizes(pageSizes);
        setScale(scale);
        setBackgrounds(backgrounds);
      })
      .catch((err: Error) => {
        setError(err);
        console.error('[@sunnystudiohu/ui]', err);
      });
  }, [template, size]);

  return {
    backgrounds,
    pageSizes,
    scale: scale * zoomLevel,
    error,
    refresh: (template: Template) =>
      init({ template, size }).then(({ pageSizes, scale, backgrounds }) => {
        setPageSizes(pageSizes);
        setScale(scale);
        setBackgrounds(backgrounds);
      }),
  };
};

type ScrollPageCursorProps = {
  ref: RefObject<HTMLDivElement>;
  pageSizes: Size[];
  scale: number;
  pageCursor: number;
  onChangePageCursor: (page: number) => void;
};

export const useScrollPageCursor = ({
  ref,
  pageSizes,
  scale,
  pageCursor,
  onChangePageCursor,
}: ScrollPageCursorProps) => {
  const onScroll = useCallback(() => {
    if (!pageSizes[0] || !ref.current) {
      return;
    }

    const scroll = ref.current.scrollTop;
    const pageTops = pageSizes.map((_, i) => {
      if (i === 0) return 0;
      const pagesHeight = pageSizes
        .slice(0, i)
        .reduce((acc, cur) => acc + cur.height * ZOOM * scale, 0);

      // Corresponds to the layout logic in Paper.tsx for hasRulers=false
      const initialGap = 10 * 2 * scale;
      const gap = 10 * scale;
      const gapsHeight = initialGap + (i - 1) * gap;

      return pagesHeight + gapsHeight;
    });

    const scrollWithMargin = scroll + 8;

    let _pageCursor = 0;
    for (let i = pageTops.length - 1; i >= 0; i--) {
      if (scrollWithMargin >= pageTops[i]) {
        _pageCursor = i;
        break;
      }
    }

    if (_pageCursor !== pageCursor) {
      onChangePageCursor(_pageCursor);
    }
  }, [onChangePageCursor, pageCursor, pageSizes, ref, scale]);

  useEffect(() => {
    ref.current?.addEventListener('scroll', onScroll);

    return () => {
      ref.current?.removeEventListener('scroll', onScroll);
    };
  }, [ref, onScroll]);
};

export const useMountStatus = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsMounted(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  return isMounted;
};

interface UseInitEventsParams {
  pageCursor: number;
  pageSizes: Size[];
  activeElements: HTMLElement[];
  template: Template;
  schemasList: SchemaForUI[][];
  changeSchemas: ChangeSchemas;
  commitSchemas: (newSchemas: SchemaForUI[]) => void;
  removeSchemas: (ids: string[]) => void;
  onSaveTemplate: (t: Template) => void;
  past: React.MutableRefObject<SchemaForUI[][]>;
  future: React.MutableRefObject<SchemaForUI[][]>;
  setSchemasList: React.Dispatch<React.SetStateAction<SchemaForUI[][]>>;
  onEdit: (targets: HTMLElement[]) => void;
  onEditEnd: () => void;
}

export const useInitEvents = ({
  pageCursor,
  pageSizes,
  activeElements,
  template,
  schemasList,
  changeSchemas,
  commitSchemas,
  removeSchemas,
  onSaveTemplate,
  past,
  future,
  setSchemasList,
  onEdit,
  onEditEnd,
}: UseInitEventsParams) => {
  const copiedSchemas = useRef<SchemaForUI[] | null>(null);
  const originalCopiedSchemas = useRef<SchemaForUI[] | null>(null);
  const hasCopiedSinceLastPaste = useRef<boolean>(false);

  const initEvents = useCallback(() => {
    const getActiveSchemas = () => {
      const ids = activeElements.map((ae) => ae.id);

      return schemasList[pageCursor].filter((s) => ids.includes(s.id));
    };
    const timeTravel = (mode: 'undo' | 'redo') => {
      const isUndo = mode === 'undo';
      const stack = isUndo ? past : future;
      if (stack.current.length <= 0) return;
      (isUndo ? future : past).current.push(cloneDeep(schemasList[pageCursor]));
      const s = cloneDeep(schemasList);
      s[pageCursor] = stack.current.pop()!;
      setSchemasList(s);
    };

    // Expose a function to clear internal clipboard (called by Canvas when external content is pasted)
    const w = window as Window & { __sunnystudiohu_clearInternalClipboard?: () => void };
    w.__sunnystudiohu_clearInternalClipboard = () => {
      copiedSchemas.current = null;
      originalCopiedSchemas.current = null;
      console.log('[Hotkeys] Internal clipboard cleared by external paste');
    };

    initShortCuts({
      move: (command, isShift) => {
        const pageSize = pageSizes[pageCursor];
        const activeSchemas = getActiveSchemas();
        const arg = moveCommandToChangeSchemasArg({ command, activeSchemas, pageSize, isShift });
        changeSchemas(arg);
      },

      copy: () => {
        const activeSchemas = getActiveSchemas();
        if (activeSchemas.length === 0) return;
        copiedSchemas.current = activeSchemas;
        originalCopiedSchemas.current = cloneDeep(activeSchemas);
        hasCopiedSinceLastPaste.current = true;
        console.log('[Hotkeys] Copied internal objects');
      },
      cut: () => {
        const activeSchemas = getActiveSchemas();
        if (activeSchemas.length === 0) return;
        copiedSchemas.current = activeSchemas;
        originalCopiedSchemas.current = cloneDeep(activeSchemas);
        hasCopiedSinceLastPaste.current = true;
        removeSchemas(activeSchemas.map((s) => s.id));
        console.log('[Hotkeys] Cut internal objects');
      },
      paste: (e?: KeyboardEvent) => {
        // Only handle internal objects IF user has copied since last paste
        if (!copiedSchemas.current || copiedSchemas.current.length === 0 || !hasCopiedSinceLastPaste.current) {
          console.log('[Hotkeys] No internal objects to paste or not copied since last paste');
          return;
        }

        console.log('[Hotkeys] Pasting internal objects, preventing default');
        // Prevent the paste event from propagating to Canvas handler
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }

        // Mark that we've pasted (prevents pasting again without a new copy)
        hasCopiedSinceLastPaste.current = false;

        const schema = schemasList[pageCursor];
        const stackUniqueSchemaNames: string[] = [];
        const pasteSchemas = copiedSchemas.current.map((cs) => {
          const id = uuid();
          const name = getUniqueSchemaName({
            copiedSchemaName: cs.name,
            schema,
            stackUniqueSchemaNames,
          });
          const { height, width, position: p } = cs;
          const ps = pageSizes[pageCursor];
          const position = {
            x: p.x + 10 > ps.width - width ? ps.width - width : p.x + 10,
            y: p.y + 10 > ps.height - height ? ps.height - height : p.y + 10,
          };

          return Object.assign(cloneDeep(cs), { id, name, position });
        });
        commitSchemas(schemasList[pageCursor].concat(pasteSchemas));
        onEdit(pasteSchemas.map((s) => document.getElementById(s.id)!));
        // Update copiedSchemas to the newly pasted schemas for next paste operation
        copiedSchemas.current = pasteSchemas;
        console.log('[Hotkeys] Internal paste complete');
      },
      pasteInPlace: (e?: KeyboardEvent) => {
        // Only handle internal objects - let Canvas handler deal with external clipboard
        if (!originalCopiedSchemas.current || originalCopiedSchemas.current.length === 0) return;

        // Prevent the paste event from propagating to Canvas handler
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }

        const schema = schemasList[pageCursor];
        const stackUniqueSchemaNames: string[] = [];
        const pasteSchemas = originalCopiedSchemas.current.map((cs) => {
          const id = uuid();
          const name = getUniqueSchemaName({
            copiedSchemaName: cs.name,
            schema,
            stackUniqueSchemaNames,
          });
          const { height, width, position: p } = cs;
          const ps = pageSizes[pageCursor];
          // For paste-in-place, keep the exact same position - no offset
          const position = {
            x: Math.max(0, Math.min(p.x, ps.width - width)),
            y: Math.max(0, Math.min(p.y, ps.height - height)),
          };

          return Object.assign(cloneDeep(cs), { id, name, position });
        });
        commitSchemas(schemasList[pageCursor].concat(pasteSchemas));
        onEdit(pasteSchemas.map((s) => document.getElementById(s.id)!));
        // Don't update copiedSchemas.current for paste-in-place to preserve regular paste functionality
      },
      redo: () => timeTravel('redo'),
      undo: () => timeTravel('undo'),
      save: () =>
        onSaveTemplate && onSaveTemplate(schemasList2template(schemasList, template.basePdf)),
      remove: () => removeSchemas(getActiveSchemas().map((s) => s.id)),
      esc: onEditEnd,
      selectAll: () => onEdit(schemasList[pageCursor].map((s) => document.getElementById(s.id)!)),
    });
  }, [
    template,
    activeElements,
    pageCursor,
    pageSizes,
    changeSchemas,
    commitSchemas,
    schemasList,
    onSaveTemplate,
    removeSchemas,
    past,
    future,
    setSchemasList,
    copiedSchemas,
    onEdit,
    onEditEnd,
  ]);

  const destroyEvents = useCallback(() => {
    destroyShortCuts();
  }, []);

  useEffect(() => {
    initEvents();

    return destroyEvents;
  }, [initEvents, destroyEvents]);
};
