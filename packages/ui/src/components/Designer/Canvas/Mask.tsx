import React from 'react';
import { Size } from '@sunnystudiohu/common';
import { theme } from 'antd';

const Mask = ({ width, height }: Size) => (
  <div
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 100,
      width,
      height,
      background: theme.useToken().token.colorBgMask,
    }}
  />
);

export default Mask;
