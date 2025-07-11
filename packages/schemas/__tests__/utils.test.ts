import { Schema, mm2pt, pt2mm } from '@sunnystudiohu/common';
import { convertForPdfLayoutProps, rotatePoint, hex2RgbColor, createSvgStr } from '../src/utils.js';
import { SquareCheck, IconNode } from 'lucide';

describe('hex2RgbColor', () => {
  it('should convert hex to rgb', () => {
    const hex = '#000000';
    const rgbValue = hex2RgbColor(hex);
    expect(rgbValue).toEqual({ red: 0, green: 0, blue: 0, type: 'RGB' });
  });

  it('should convert hex to rgb with a short hex', () => {
    const hex = '#fff';
    const rgbValue = hex2RgbColor(hex);
    expect(rgbValue).toEqual({ red: 1, green: 1, blue: 1, type: 'RGB' });
  });

  it('should convert hex to rgb for non-trivial color', () => {
    const hex = '#33af5a';
    const rgbValue = hex2RgbColor(hex);
    expect(rgbValue).toEqual({
      red: 0.2,
      green: 0.6862745098039216,
      blue: 0.35294117647058826,
      type: 'RGB',
    });
  });

  it('should throw an error if hex is invalid', () => {
    const hex = '#fffee';
    expect(() => hex2RgbColor(hex)).toThrowError('Invalid hex color value #ff');
  });
});

describe('rotatePoint', () => {
  it('should rotate one point round another by 90 degrees', () => {
    const point = { x: 5, y: 5 };
    const pivot = { x: 0, y: 0 };
    const angle = 90;

    const { x, y } = rotatePoint(point, pivot, angle);
    expect(x).toEqual(-5);
    expect(y).toEqual(5);
  });

  it('should rotate one point round another by 180 degrees', () => {
    const point = { x: 5, y: 5 };
    const pivot = { x: 0, y: 0 };
    const angle = 180;

    const { x, y } = rotatePoint(point, pivot, angle);
    expect(x).toBeCloseTo(-5);
    expect(y).toBeCloseTo(-5);
  });

  it('should not rotate if pivot and point are the same', () => {
    const point = { x: 10, y: 10 };
    const pivot = { x: 10, y: 10 };
    const angle = 221;

    const { x, y } = rotatePoint(point, pivot, angle);
    expect(x).toEqual(10);
    expect(y).toEqual(10);
  });

  it('should rotate one point round another by 45 degrees', () => {
    const point = { x: 10, y: 10 };
    const pivot = { x: 5, y: 5 };
    const angle = 45;

    const { x, y } = rotatePoint(point, pivot, angle);
    expect(x).toBeCloseTo(5);
    expect(y).toBeCloseTo(12.07);
  });
});

describe('convertForPdfLayoutProps', () => {
  it('should return correct value without rotation', () => {
    const schema: Schema = {
      name: 'test',
      type: 'image',
      content: '',
      width: 100,
      height: 100,
      position: { x: 100, y: 100 },
      rotate: 0,
      opacity: 1,
    };
    const pageHeight = 1000;

    const {
      position: { x, y },
      height,
      width,
      rotate,
      opacity,
    } = convertForPdfLayoutProps({ schema, pageHeight });

    expect(opacity).toEqual(schema.opacity);
    expect(height).toEqual(mm2pt(schema.height));
    expect(width).toEqual(mm2pt(schema.width));
    expect(x).toEqual(mm2pt(schema.position.x));
    expect(y).toEqual(pageHeight - mm2pt(schema.position.y) - mm2pt(schema.height));
    expect(rotate).toEqual({ angle: 0, type: 'degrees' });
  });

  it('should return correct value with rotation', () => {
    const schema: Schema = {
      name: 'test',
      type: 'image',
      content: '',
      width: 50,
      height: 120,
      position: { x: 100, y: 100 },
      rotate: 90,
      opacity: 1,
    };
    const pageHeight = 1000;

    const {
      position: { x, y },
      height,
      width,
      rotate,
      opacity,
    } = convertForPdfLayoutProps({ schema, pageHeight });

    expect(opacity).toBeCloseTo(1);
    expect(pt2mm(width)).toBeCloseTo(50);
    expect(pt2mm(height)).toBeCloseTo(120.005);
    expect(pt2mm(x)).toBeCloseTo(65.003);
    expect(pt2mm(y)).toBeCloseTo(217.793);
    expect(rotate).toEqual({ angle: -90, type: 'degrees' });
  });

  it('should not rotate if asked not to', () => {
    const schema: Schema = {
      name: 'test',
      type: 'text',
      content: '',
      width: 50,
      height: 120,
      position: { x: 100, y: 100 },
      rotate: 90,
      opacity: 1,
    };
    const pageHeight = 1000;

    const {
      position: { x, y },
      height,
      width,
      rotate,
      opacity,
    } = convertForPdfLayoutProps({ schema, pageHeight, applyRotateTranslate: false });

    expect(opacity).toBeCloseTo(1);
    expect(pt2mm(width)).toBeCloseTo(50);
    expect(pt2mm(height)).toBeCloseTo(120.005);
    expect(pt2mm(x)).toBeCloseTo(100);
    expect(Math.round(pt2mm(y))).toEqual(Math.round(pt2mm(1000) - 100 - 120));
    expect(rotate).toEqual({ angle: -90, type: 'degrees' });
  });
});

describe('createSvgStr', () => {
  it('should convert a Lucide icon to SVG string', () => {
    const icon = createSvgStr(SquareCheck, { stroke: 'currentColor' });
    expect(icon).toBeTruthy();
    expect(icon).toContain('<svg');
    expect(icon).toContain('stroke="currentColor"');
    expect(icon).toContain('</svg>');
  });

  it('should merge custom attributes with SVG element', () => {
    const icon = createSvgStr(SquareCheck, { 
      stroke: 'red', 
      fill: 'blue',
      width: '24',
      height: '24'
    });
    expect(icon).toContain('stroke="red"');
    expect(icon).toContain('fill="blue"');
    expect(icon).toContain('width="24"');
    expect(icon).toContain('height="24"');
  });

  it('should handle custom attributes overriding default ones', () => {
    // SquareCheck likely has default stroke attribute
    const defaultIcon = createSvgStr(SquareCheck);
    const customIcon = createSvgStr(SquareCheck, { stroke: 'purple' });
    
    expect(customIcon).toContain('stroke="purple"');
    // The custom stroke should replace the default one
    expect(customIcon).not.toBe(defaultIcon);
  });

  it('should handle different icons', () => {
    // Test with a different icon from lucide
    const icon1 = createSvgStr(SquareCheck);
    
    expect(icon1).toBeTruthy();
    expect(icon1).toContain('<svg');
    expect(icon1).toContain('</svg>');
  });

  it('should produce valid SVG output', () => {
    const svgStr = createSvgStr(SquareCheck);
    
    // Check that the output is a valid SVG string
    expect(svgStr).toContain('<svg');
    expect(svgStr).toContain('</svg>');
    
    // Check that attributes are properly formatted
    expect(svgStr.includes('="')).toBeTruthy();
    
    // Check that tags are properly closed
    const openTags = svgStr.match(/<[^/][^>]*>/g) || [];
    const closeTags = svgStr.match(/<\/[^>]+>/g) || [];
    expect(openTags.length).toBeGreaterThan(0);
    expect(closeTags.length).toBeGreaterThan(0);
  });

  it('should handle multiple custom attributes', () => {
    const customAttrs = {
      width: '48',
      height: '48',
      fill: 'none',
      stroke: 'blue',
      'stroke-width': '1.5',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    };
    
    const svgStr = createSvgStr(SquareCheck, customAttrs);
    
    // Check that all custom attributes are included
    Object.entries(customAttrs).forEach(([key, value]) => {
      expect(svgStr).toContain(`${key}="${value}"`);
    });
  });
});
