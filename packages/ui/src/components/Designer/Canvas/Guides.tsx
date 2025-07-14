import React, { Ref } from 'react';
import GuidesComponent from '@scena/react-guides';
import { ZOOM, Size } from '@sunnystudiohu/common';
import { RULER_HEIGHT } from '../../../constants.js';

const guideStyle = (
  top: number,
  left: number,
  height: number,
  width: number,
): React.CSSProperties => ({
  position: 'absolute',
  top,
  left,
  height,
  width,
  background: '#333333',
});

const _Guides = ({
  paperSize,
  horizontalRef,
  verticalRef,
  rulerHeight = RULER_HEIGHT,
}: {
  paperSize: Size;
  horizontalRef: Ref<GuidesComponent> | undefined;
  verticalRef: Ref<GuidesComponent> | undefined;
  rulerHeight?: number;
}) => {
  // Calculate appropriate text size and spacing based on ruler height
  const textSize = Math.max(8, Math.min(12, rulerHeight * 0.4));
  const lineHeight = Math.max(10, rulerHeight * 0.6);
  
  // Calculate appropriate text interval based on paper size
  // For small labels, show numbers every 10mm; for larger documents, adjust accordingly
  const getTextInterval = (size: number): number => {
    if (size <= 100) return 10; // Every 10mm for small labels
    if (size <= 200) return 20; // Every 20mm for medium labels
    return 50; // Every 50mm for large documents
  };
  
  const horizontalTextInterval = getTextInterval(paperSize.width);
  const verticalTextInterval = getTextInterval(paperSize.height);
  
  // Convert mm to pixels for ruler sizing
  const renderedWidth = paperSize.width * ZOOM;
  const renderedHeight = paperSize.height * ZOOM;
  
  // Debug: log the intervals
  console.log(`Paper size: ${paperSize.width}x${paperSize.height}mm`);
  console.log(`Rendered size: ${renderedWidth}x${renderedHeight}px`);
  console.log(`Intervals: horizontal=${horizontalTextInterval}mm, vertical=${verticalTextInterval}mm`);
  
  return (
    <>
      <style>{`
        .ruler-guides-horizontal .ruler-guides-text,
        .ruler-guides-vertical .ruler-guides-text {
          font-size: ${textSize}px !important;
          line-height: ${lineHeight}px !important;
        }
      `}</style>
      <div
        className="ruler-container"
        style={guideStyle(-rulerHeight, -rulerHeight, rulerHeight, rulerHeight)}
      />
      <GuidesComponent
        zoom={ZOOM}
        style={guideStyle(-rulerHeight, 0, rulerHeight, renderedWidth)}
        type="horizontal"
        ref={horizontalRef}
        unit={horizontalTextInterval}
        segment={1}
        className="ruler-guides-horizontal"
        textOffset={[0, rulerHeight * 0.7]}
      />
      <GuidesComponent
        zoom={ZOOM}
        style={guideStyle(0, -rulerHeight, renderedHeight, rulerHeight)}
        type="vertical"
        ref={verticalRef}
        unit={verticalTextInterval}
        segment={1}
        className="ruler-guides-vertical"
        textOffset={[rulerHeight * 0.7, 0]}
      />
    </>
  );
};

export default _Guides;
