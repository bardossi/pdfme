import React, {
  Ref,
  useMemo,
  useContext,
  MutableRefObject,
  useRef,
  useState,
  useEffect,
  forwardRef,
  useCallback,
} from 'react';
import { theme, Button } from 'antd';
import MoveableComponent, { OnDrag, OnRotate, OnResize } from 'react-moveable';
import {
  ZOOM,
  SchemaForUI,
  Size,
  ChangeSchemas,
  BasePdf,
  isBlankPdf,
  replacePlaceholders,
  Schema,
} from '@sunnystudiohu/common';
import { PluginsRegistry } from '../../../contexts.js';
import { X } from 'lucide-react';
import { RIGHT_SIDEBAR_WIDTH } from '../../../constants.js';
import { usePrevious } from '../../../hooks.js';
import { uuid, round, flatten } from '../../../helper.js';
import Paper from '../../Paper.js';
import Renderer from '../../Renderer.js';
import Selecto from './Selecto.js';
import Moveable from './Moveable.js';
import Mask from './Mask.js';
import Padding from './Padding.js';
import StaticSchema from '../../StaticSchema.js';

const mm2px = (mm: number) => mm * 3.7795275591;

const DELETE_BTN_ID = uuid();
const fmt4Num = (prop: string) => Number(prop.replace('px', ''));
const fmt = (prop: string) => round(fmt4Num(prop) / ZOOM, 2);
const isTopLeftResize = (d: string) => d === '-1,-1' || d === '-1,0' || d === '0,-1';
const normalizeRotate = (angle: number) => ((angle % 360) + 360) % 360;

const DeleteButton = ({ 
  activeElements: aes, 
  pageSize, 
  scale 
}: { 
  activeElements: HTMLElement[];
  pageSize?: Size;
  scale: number;
}) => {
  const { token } = theme.useToken();

  // Calculate responsive size based on canvas dimensions and scale
  const calculateButtonSize = () => {
    if (!pageSize) return 26; // Default size
    
    const canvasArea = pageSize.width * pageSize.height * scale;
    const verySmallArea = 30 * 30; // Very small labels (30mm x 30mm)
    const smallArea = 80 * 80; // Small labels (80mm x 80mm) 
    const maxArea = 210 * 297; // A4 size threshold
    
    if (canvasArea <= verySmallArea) {
      return 8; // Very small delete button for tiny labels
    } else if (canvasArea <= smallArea) {
      return 16; // Small delete button for small labels
    } else if (canvasArea >= maxArea) {
      return 26; // Default size for A4 and larger
    } else {
      // Linear interpolation between small and max
      const ratio = (canvasArea - smallArea) / (maxArea - smallArea);
      return Math.round(16 + (10 * ratio)); // Scale from 16px to 26px
    }
  };

  const size = calculateButtonSize();
  const top = Math.min(...aes.map(({ style }) => fmt4Num(style.top)));
  const left = Math.max(...aes.map(({ style }) => fmt4Num(style.left) + fmt4Num(style.width))) + 10;

  return (
    <Button
      id={DELETE_BTN_ID}
      style={{
        position: 'absolute',
        zIndex: 1,
        top,
        left,
        width: size,
        height: size,
        minWidth: 'unset',
        minHeight: 'unset',
        padding: 0,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: token.borderRadius,
        color: token.colorWhite,
        background: token.colorPrimary,
        boxSizing: 'border-box',
      }}
    >
      <X style={{ pointerEvents: 'none', width: size * 0.6, height: size * 0.6 }} />
    </Button>
  );
};


interface Props {
  basePdf: BasePdf;
  height: number;
  hoveringSchemaId: string | null;
  onChangeHoveringSchemaId: (id: string | null) => void;
  pageCursor: number;
  schemasList: SchemaForUI[][];
  scale: number;
  backgrounds: string[];
  pageSizes: Size[];
  size: Size;
  activeElements: HTMLElement[];
  onEdit: (targets: HTMLElement[]) => void;
  changeSchemas: ChangeSchemas;
  removeSchemas: (ids: string[]) => void;
  paperRefs: MutableRefObject<HTMLDivElement[]>;
  sidebarOpen: boolean;
  addSchema?: (schema: Schema) => void;
}

const Canvas = (props: Props, ref: Ref<HTMLDivElement>) => {
  const {
    basePdf,
    pageCursor,
    scale,
    backgrounds,
    pageSizes,
    size,
    activeElements,
    schemasList,
    hoveringSchemaId,
    onEdit,
    changeSchemas,
    removeSchemas,
    onChangeHoveringSchemaId,
    paperRefs,
    sidebarOpen,
    addSchema,
  } = props;
  const { token } = theme.useToken();
  const pluginsRegistry = useContext(PluginsRegistry);
  const moveable = useRef<MoveableComponent>(null);

  const [isPressShiftKey, setIsPressShiftKey] = useState(false);
  const [editing, setEditing] = useState(false);

  const prevSchemas = usePrevious(schemasList[pageCursor]);

  const onKeydown = (e: KeyboardEvent) => {
    if (e.shiftKey) setIsPressShiftKey(true);
  };
  const onKeyup = (e: KeyboardEvent) => {
    if (e.key === 'Shift' || !e.shiftKey) setIsPressShiftKey(false);
    if (e.key === 'Escape' || e.key === 'Esc') setEditing(false);
  };

  const onPaste = useCallback((e: ClipboardEvent) => {
    if (!addSchema) return; // If addSchema is not provided, don't handle paste

    console.log('[Canvas] onPaste triggered');

    const clipboardItems = e.clipboardData?.items;
    if (!clipboardItems) {
      console.log('[Canvas] No clipboard items');
      return;
    }

    console.log('[Canvas] Checking for images in clipboard, items:', clipboardItems.length);

    // Look for image items in the clipboard
    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        e.stopPropagation();

        // Signal to hotkeys that external content was pasted (clear internal clipboard)
        const w = window as Window & { __sunnystudiohu_clearInternalClipboard?: () => void };
        if (w.__sunnystudiohu_clearInternalClipboard) {
          w.__sunnystudiohu_clearInternalClipboard();
          console.log('[Canvas] Cleared internal clipboard');
        }

        const file = item.getAsFile();
        if (!file) continue;

        // Convert the file to base64
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          if (!result) return;

          try {
            // Get the image plugin's default schema
            const imagePlugin = pluginsRegistry.entries().find(([, plugin]) =>
              plugin.propPanel.defaultSchema &&
              typeof plugin.propPanel.defaultSchema === 'object' &&
              plugin.propPanel.defaultSchema !== null &&
              'type' in plugin.propPanel.defaultSchema &&
              plugin.propPanel.defaultSchema.type === 'image'
            );

            if (!imagePlugin || !imagePlugin[1].propPanel.defaultSchema) {
              console.warn('Image plugin not found');
              return;
            }

            const defaultSchema = imagePlugin[1].propPanel.defaultSchema as Schema;

            // Calculate position for the new image (center of the visible area)
            const canvasElement = ref as React.RefObject<HTMLDivElement>;
            let x = defaultSchema.position.x;
            let y = defaultSchema.position.y;

            // If we can access the canvas element, try to position based on scroll
            if (canvasElement?.current && pageSizes[pageCursor]) {
              const scrollTop = canvasElement.current.scrollTop;
              const scrollLeft = canvasElement.current.scrollLeft;
              const visibleHeight = canvasElement.current.clientHeight;
              const visibleWidth = canvasElement.current.clientWidth;

              // Convert scroll position to page coordinates
              const pageScrollY = scrollTop / (scale * ZOOM);
              const pageScrollX = scrollLeft / (scale * ZOOM);

              // Position in the center of the visible area
              x = Math.max(0, Math.min(pageSizes[pageCursor].width - defaultSchema.width,
                pageScrollX + (visibleWidth / (scale * ZOOM)) / 2 - defaultSchema.width / 2));
              y = Math.max(0, Math.min(pageSizes[pageCursor].height - defaultSchema.height,
                pageScrollY + (visibleHeight / (scale * ZOOM)) / 2 - defaultSchema.height / 2));
            }

            // Create the new image schema with the pasted image data
            const newImageSchema: Schema = {
              ...defaultSchema,
              content: result,
              position: { x, y }
            };

            // Use the provided addSchema function to properly add the schema
            addSchema(newImageSchema);

          } catch (error) {
            console.error('Error processing pasted image:', error);
          }
        };

        reader.onerror = () => {
          console.error('Error reading image file');
        };

        reader.readAsDataURL(file);
        break; // Only process the first image found
      }
    }
  }, [addSchema, pluginsRegistry, pageCursor, pageSizes, scale, ref]);

  const initEvents = useCallback(() => {
    window.addEventListener('keydown', onKeydown);
    window.addEventListener('keyup', onKeyup);
    window.addEventListener('paste', onPaste);
  }, [onPaste]);

  const destroyEvents = useCallback(() => {
    window.removeEventListener('keydown', onKeydown);
    window.removeEventListener('keyup', onKeyup);
    window.removeEventListener('paste', onPaste);
  }, [onPaste]);

  useEffect(() => {
    initEvents();

    return destroyEvents;
  }, [initEvents, destroyEvents]);

  useEffect(() => {
    moveable.current?.updateRect();
    if (!prevSchemas) {
      return;
    }

    const prevSchemaKeys = JSON.stringify(prevSchemas[pageCursor] || {});
    const schemaKeys = JSON.stringify(schemasList[pageCursor] || {});

    if (prevSchemaKeys === schemaKeys) {
      moveable.current?.updateRect();
    }
  }, [pageCursor, schemasList, prevSchemas]);

  const onDrag = ({ target, top, left }: OnDrag) => {
    const { width: _width, height: _height } = target.style;
    const targetWidth = fmt(_width);
    const targetHeight = fmt(_height);
    const actualTop = top / ZOOM;
    const actualLeft = left / ZOOM;
    const { width: pageWidth, height: pageHeight } = pageSizes[pageCursor];
    let topPadding = 0;
    let rightPadding = 0;
    let bottomPadding = 0;
    let leftPadding = 0;

    if (isBlankPdf(basePdf)) {
      const [t, r, b, l] = basePdf.padding;
      topPadding = t * ZOOM;
      rightPadding = r;
      bottomPadding = b;
      leftPadding = l * ZOOM;
    }

    if (actualTop + targetHeight > pageHeight - bottomPadding) {
      target.style.top = `${(pageHeight - targetHeight - bottomPadding) * ZOOM}px`;
    } else {
      target.style.top = `${top < topPadding ? topPadding : top}px`;
    }

    if (actualLeft + targetWidth > pageWidth - rightPadding) {
      target.style.left = `${(pageWidth - targetWidth - rightPadding) * ZOOM}px`;
    } else {
      target.style.left = `${left < leftPadding ? leftPadding : left}px`;
    }
  };

  const onDragEnd = ({ target }: { target: HTMLElement | SVGElement }) => {
    const { top, left } = target.style;
    changeSchemas([
      { key: 'position.y', value: fmt(top), schemaId: target.id },
      { key: 'position.x', value: fmt(left), schemaId: target.id },
    ]);
  };

  const onDragEnds = ({ targets }: { targets: (HTMLElement | SVGElement)[] }) => {
    const arg = targets.map(({ style: { top, left }, id }) => [
      { key: 'position.y', value: fmt(top), schemaId: id },
      { key: 'position.x', value: fmt(left), schemaId: id },
    ]);
    changeSchemas(flatten(arg));
  };

  const onRotate = ({ target, rotate }: OnRotate) => {
    target.style.transform = `rotate(${rotate}deg)`;
  };

  const onRotateEnd = ({ target }: { target: HTMLElement | SVGElement }) => {
    const { transform } = target.style;
    const rotate = Number(transform.replace('rotate(', '').replace('deg)', ''));
    const normalizedRotate = normalizeRotate(rotate);
    changeSchemas([{ key: 'rotate', value: normalizedRotate, schemaId: target.id }]);
  };

  const onRotateEnds = ({ targets }: { targets: (HTMLElement | SVGElement)[] }) => {
    const arg = targets.map(({ style: { transform }, id }) => {
      const rotate = Number(transform.replace('rotate(', '').replace('deg)', ''));
      const normalizedRotate = normalizeRotate(rotate);
      return [{ key: 'rotate', value: normalizedRotate, schemaId: id }];
    });
    changeSchemas(flatten(arg));
  };

  const onResizeEnd = ({ target }: { target: HTMLElement | SVGElement }) => {
    const { id, style } = target;
    const { width, height, top, left } = style;
    changeSchemas([
      { key: 'position.x', value: fmt(left), schemaId: id },
      { key: 'position.y', value: fmt(top), schemaId: id },
      { key: 'width', value: fmt(width), schemaId: id },
      { key: 'height', value: fmt(height), schemaId: id },
    ]);

    const targetSchema = schemasList[pageCursor].find((schema) => schema.id === id);

    if (!targetSchema) return;

    targetSchema.position.x = fmt(left);
    targetSchema.position.y = fmt(top);
    targetSchema.width = fmt(width);
    targetSchema.height = fmt(height);
  };

  const onResizeEnds = ({ targets }: { targets: (HTMLElement | SVGElement)[] }) => {
    const arg = targets.map(({ style: { width, height, top, left }, id }) => [
      { key: 'width', value: fmt(width), schemaId: id },
      { key: 'height', value: fmt(height), schemaId: id },
      { key: 'position.y', value: fmt(top), schemaId: id },
      { key: 'position.x', value: fmt(left), schemaId: id },
    ]);
    changeSchemas(flatten(arg));
  };

  const onResize = ({ target, width, height, direction }: OnResize) => {
    if (!target) return;
    let topPadding = 0;
    let rightPadding = 0;
    let bottomPadding = 0;
    let leftPadding = 0;

    if (isBlankPdf(basePdf)) {
      const [t, r, b, l] = basePdf.padding;
      topPadding = t * ZOOM;
      rightPadding = mm2px(r);
      bottomPadding = mm2px(b);
      leftPadding = l * ZOOM;
    }

    const pageWidth = mm2px(pageSizes[pageCursor].width);
    const pageHeight = mm2px(pageSizes[pageCursor].height);

    const obj: { top?: string; left?: string; width: string; height: string } = {
      width: `${width}px`,
      height: `${height}px`,
    };

    const s = target.style;
    let newLeft = fmt4Num(s.left) + (fmt4Num(s.width) - width);
    let newTop = fmt4Num(s.top) + (fmt4Num(s.height) - height);
    if (newLeft < leftPadding) {
      newLeft = leftPadding;
    }
    if (newTop < topPadding) {
      newTop = topPadding;
    }
    if (newLeft + width > pageWidth - rightPadding) {
      obj.width = `${pageWidth - rightPadding - newLeft}px`;
    }
    if (newTop + height > pageHeight - bottomPadding) {
      obj.height = `${pageHeight - bottomPadding - newTop}px`;
    }

    const d = direction.toString();
    if (isTopLeftResize(d)) {
      obj.top = `${newTop}px`;
      obj.left = `${newLeft}px`;
    } else if (d === '1,-1') {
      obj.top = `${newTop}px`;
    } else if (d === '-1,1') {
      obj.left = `${newLeft}px`;
    }
    Object.assign(s, obj);
  };


  const onClickMoveable = () => {
    // Just set editing to true without trying to access event properties
    setEditing(true);
  };

  const rotatable = useMemo(() => {
    const selectedSchemas = (schemasList[pageCursor] || []).filter((s) =>
      activeElements.map((ae) => ae.id).includes(s.id),
    );
    const schemaTypes = selectedSchemas.map((s) => s.type);
    const uniqueSchemaTypes = [...new Set(schemaTypes)];

    // Create a type-safe array of default schemas
    const defaultSchemas: Record<string, unknown>[] = [];

    pluginsRegistry.entries().forEach(([, plugin]) => {
      if (plugin.propPanel.defaultSchema) {
        defaultSchemas.push(plugin.propPanel.defaultSchema as Record<string, unknown>);
      }
    });

    // Check if all schema types have rotate property
    return uniqueSchemaTypes.every((type) => {
      const matchingSchema = defaultSchemas.find((ds) => ds && 'type' in ds && ds.type === type);
      return matchingSchema && 'rotate' in matchingSchema;
    });
  }, [activeElements, pageCursor, schemasList, pluginsRegistry]);

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'auto',
        marginRight: sidebarOpen ? RIGHT_SIDEBAR_WIDTH : 0,
        ...size,
      }}
      ref={ref}
    >
      <Selecto
        container={paperRefs.current[pageCursor]}
        continueSelect={isPressShiftKey}
        onDragStart={(e) => {
          // Use type assertion to safely access inputEvent properties
          const inputEvent = e.inputEvent as MouseEvent | TouchEvent;
          const target = inputEvent.target as Element | null;
          const isMoveableElement = moveable.current?.isMoveableElement(target as Element);

          if ((inputEvent.type === 'touchstart' && e.isTrusted) || isMoveableElement) {
            e.stop();
          }

          if (paperRefs.current[pageCursor] === target) {
            onEdit([]);
          }

          // Check if the target is an HTMLElement and has an id property
          const targetElement = target as HTMLElement | null;
          if (targetElement && targetElement.id === DELETE_BTN_ID) {
            removeSchemas(activeElements.map((ae) => ae.id));
          }
        }}
        onSelect={(e) => {
          // Use type assertions to safely access properties
          const inputEvent = e.inputEvent as MouseEvent | TouchEvent;
          const added = e.added as HTMLElement[];
          const removed = e.removed as HTMLElement[];
          const selected = e.selected as HTMLElement[];

          const isClick = inputEvent.type === 'mousedown';
          let newActiveElements: HTMLElement[] = isClick ? selected : [];

          if (!isClick && added.length > 0) {
            newActiveElements = activeElements.concat(added);
          }
          if (!isClick && removed.length > 0) {
            newActiveElements = activeElements.filter((ae) => !removed.includes(ae));
          }
          onEdit(newActiveElements);

          if (newActiveElements != activeElements) {
            setEditing(false);
          }

          // For MacOS CMD+SHIFT+3/4 screenshots where the keydown event is never received, check mouse too
          const mouseEvent = inputEvent as MouseEvent;
          if (mouseEvent && typeof mouseEvent.shiftKey === 'boolean' && !mouseEvent.shiftKey) {
            setIsPressShiftKey(false);
          }
        }}
      />
      <Paper
        paperRefs={paperRefs}
        scale={scale}
        size={size}
        schemasList={schemasList}
        pageSizes={pageSizes}
        backgrounds={backgrounds}
        hasRulers={false}
        renderPaper={({ index, paperSize }) => (
          <>
            {!editing && activeElements.length > 0 && pageCursor === index && (
              <DeleteButton 
                activeElements={activeElements} 
                pageSize={pageSizes[index]}
                scale={scale}
              />
            )}
            <Padding basePdf={basePdf} />
            <StaticSchema
              template={{ schemas: schemasList, basePdf }}
              input={Object.fromEntries(
                schemasList.flat().map(({ name, content = '' }) => [name, content]),
              )}
              scale={scale}
              totalPages={schemasList.length}
              currentPage={index + 1}
            />
            {pageCursor !== index ? (
              <Mask
                width={paperSize.width}
                height={paperSize.height}
              />
            ) : (
              !editing && (
                <Moveable
                  ref={moveable}
                  target={activeElements}
                  bounds={{ left: 0, top: 0, bottom: paperSize.height, right: paperSize.width }}
                  horizontalGuidelines={[]}
                  verticalGuidelines={[]}
                  keepRatio={isPressShiftKey}
                  rotatable={rotatable}
                  pageSize={pageSizes[index]}
                  scale={scale}
                  onDrag={onDrag}
                  onDragEnd={onDragEnd}
                  onDragGroupEnd={onDragEnds}
                  onRotate={onRotate}
                  onRotateEnd={onRotateEnd}
                  onRotateGroupEnd={onRotateEnds}
                  onResize={onResize}
                  onResizeEnd={onResizeEnd}
                  onResizeGroupEnd={onResizeEnds}
                  onClick={onClickMoveable}
                />
              )
            )}
          </>
        )}
        renderSchema={({ schema, index }) => {
          const mode =
            editing && activeElements.map((ae) => ae.id).includes(schema.id)
              ? 'designer'
              : 'viewer';

          const content = schema.content || '';
          let value = content;

          if (mode !== 'designer' && schema.readOnly) {
            const variables = {
              ...schemasList.flat().reduce(
                (acc, currSchema) => {
                  acc[currSchema.name] = currSchema.content || '';
                  return acc;
                },
                {} as Record<string, string>,
              ),
              totalPages: schemasList.length,
              currentPage: index + 1,
            };

            value = replacePlaceholders({ content, variables, schemas: schemasList });
          }

          return (
            <Renderer
              key={schema.id}
              schema={schema}
              basePdf={basePdf}
              value={value}
              onChangeHoveringSchemaId={onChangeHoveringSchemaId}
              mode={mode}
              onChange={
                (schemasList[pageCursor] || []).some((s) => s.id === schema.id)
                  ? (arg) => {
                    // Use type assertion to safely handle the argument
                    type ChangeArg = { key: string; value: unknown };
                    const args = Array.isArray(arg) ? (arg as ChangeArg[]) : [arg as ChangeArg];
                    changeSchemas(
                      args.map(({ key, value }) => ({ key, value, schemaId: schema.id })),
                    );
                  }
                  : undefined
              }
              stopEditing={() => setEditing(false)}
              outline={`1px ${hoveringSchemaId === schema.id ? 'solid' : 'dashed'} ${schema.readOnly && hoveringSchemaId !== schema.id
                  ? 'transparent'
                  : token.colorPrimary
                }`}
              scale={scale}
            />
          );
        }}
      />
    </div>
  );
};
export default forwardRef<HTMLDivElement, Props>(Canvas);
