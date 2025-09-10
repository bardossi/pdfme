import React, { useEffect, forwardRef, Ref, useRef } from 'react';
import MoveableComponent, {
  OnDrag,
  OnRotate,
  OnRotateEnd,
  OnClick,
  OnResize,
} from 'react-moveable';
import { uuid } from '../../../helper.js'
import { theme } from 'antd';
import { Size } from '@sunnystudiohu/common';
import './Moveable.css';

type Props = {
  target: HTMLElement[];
  bounds: { left: number; top: number; bottom: number; right: number };
  horizontalGuidelines: number[];
  verticalGuidelines: number[];
  keepRatio: boolean;
  rotatable: boolean;
  onDrag: ({ target, left, top }: OnDrag) => void;
  onDragEnd: ({ target }: { target: HTMLElement | SVGElement }) => void;
  onDragGroupEnd: ({ targets }: { targets: (HTMLElement | SVGElement)[] }) => void;
  onRotate: ({ target, rotate }: OnRotate) => void;
  onRotateEnd: ({ target }: OnRotateEnd) => void;
  onRotateGroupEnd: ({ targets }: { targets: (HTMLElement | SVGElement)[] }) => void;
  onResize: ({ target, width, height, direction }: OnResize) => void;
  onResizeEnd: ({ target }: { target: HTMLElement | SVGElement }) => void;
  onResizeGroupEnd: ({ targets }: { targets: (HTMLElement | SVGElement)[] }) => void;
  onClick: (e: OnClick) => void;
  pageSize?: Size;
  scale: number;
};

const baseClassName = 'pdfme-moveable';

const Moveable = (props: Props, ref: Ref<MoveableComponent>) => {
  const { token } = theme.useToken();
  const instanceId = useRef(uuid());
  const uniqueClassName = `${baseClassName}-${instanceId.current}`;

  // Calculate responsive control handle size based on canvas size and scale
  const calculateControlSize = () => {
    const { pageSize, scale } = props;
    if (!pageSize) return 8; // Default size
    
    const canvasArea = pageSize.width * pageSize.height * scale;
    const verySmallArea = 30 * 30; // Very small labels (30mm x 30mm)
    const smallArea = 80 * 80; // Small labels (80mm x 80mm)
    const maxArea = 210 * 297; // A4 size threshold
    
    if (canvasArea <= verySmallArea) {
      return 6; // Slightly bigger handles for tiny labels (was 4)
    } else if (canvasArea <= smallArea) {
      return 7; // Slightly bigger handles for small labels (was 5)
    } else if (canvasArea >= maxArea) {
      return 8; // Default size for A4 and larger
    } else {
      // Linear interpolation between small and max
      const ratio = (canvasArea - smallArea) / (maxArea - smallArea);
      return Math.round(7 + (1 * ratio)); // Scale from 7px to 8px
    }
  };

  useEffect(() => {
    // Small delay to ensure DOM elements are created
    const timeout = setTimeout(() => {
      const containerElement = document.querySelector(`.${uniqueClassName}`);
      const moveableLines = document.querySelectorAll(`.${uniqueClassName} .moveable-line`);
      const moveableControls = document.querySelectorAll(`.${uniqueClassName} .moveable-control`);
      
      if (containerElement instanceof HTMLElement) {
        containerElement.style.setProperty('--moveable-color', token.colorPrimary);
        moveableLines.forEach((e) => {
          if (e instanceof HTMLElement) {
            e.style.setProperty('--moveable-color', token.colorPrimary);
          }
        });
        
        // Apply responsive sizing to control handles
        const controlSize = calculateControlSize();
        moveableControls.forEach((control) => {
          if (control instanceof HTMLElement) {
            control.style.width = `${controlSize}px`;
            control.style.height = `${controlSize}px`;
            // Adjust margin to keep controls properly positioned
            control.style.margin = `${-controlSize / 2}px 0 0 ${-controlSize / 2}px`;
          }
        });
      }
    }, 50); // 50ms delay

    return () => clearTimeout(timeout);
  }, [props.target, props.pageSize, props.scale, token.colorPrimary, uniqueClassName]);

  return (
    <MoveableComponent
      className={uniqueClassName}
      rootContainer={document ? document.body : undefined}
      snappable
      draggable
      rotatable={props.rotatable}
      resizable
      throttleDrag={1}
      throttleRotate={1}
      throttleResize={1}
      ref={ref}
      target={props.target}
      bounds={props.bounds}
      horizontalGuidelines={props.horizontalGuidelines}
      verticalGuidelines={props.verticalGuidelines}
      keepRatio={props.keepRatio}
      onRotate={props.onRotate}
      onRotateEnd={props.onRotateEnd}
      onRotateGroup={({ events }: { events: OnRotate[] }) => {
        events.forEach(props.onRotate);
      }}
      onRotateGroupEnd={props.onRotateGroupEnd}
      onDrag={props.onDrag}
      onDragGroup={({ events }: { events: OnDrag[] }) => {
        events.forEach(props.onDrag);
      }}
      onDragEnd={props.onDragEnd}
      onDragGroupEnd={props.onDragGroupEnd}
      onResize={props.onResize}
      onResizeGroup={({ events }: { events: OnResize[] }) => {
        events.forEach(props.onResize);
      }}
      onResizeEnd={props.onResizeEnd}
      onResizeGroupEnd={props.onResizeGroupEnd}
      onClick={props.onClick}
    />
  );
};

export default forwardRef<MoveableComponent, Props>(Moveable);
