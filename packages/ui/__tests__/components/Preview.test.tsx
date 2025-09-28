/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Preview from '../../src/components/Preview';
import { I18nContext, FontContext, PluginsRegistry, OptionsContext } from '../../src/contexts';
import { i18n } from '../../src/i18n';
import { SELECTABLE_CLASSNAME } from '../../src/constants';
import { getDefaultFont, pluginRegistry } from '@sunnystudiohu/common';
import { setupUIMock, getSampleTemplate } from '../assets/helper';
import { text, image } from "@sunnystudiohu/schemas"

const plugins = pluginRegistry({ text, image, })


test('Preview(as Viewer) snapshot', async () => {
  setupUIMock();
  let container: HTMLElement = document.createElement('a');
  act(() => {
    const { container: c } = render(
      <I18nContext.Provider value={i18n}>
        <FontContext.Provider value={getDefaultFont()}>
          <PluginsRegistry.Provider value={plugins}>
            <Preview
              template={getSampleTemplate()}
              inputs={[{ field1: 'field1', field2: 'field2' }]}
              size={{ width: 1200, height: 1200 }}
            />
          </PluginsRegistry.Provider>
        </FontContext.Provider>
      </I18nContext.Provider>
    );
    container = c;
  });

  await waitFor(() => Boolean(container?.getElementsByClassName(SELECTABLE_CLASSNAME)));
  expect(container.firstChild).toMatchSnapshot();
});

test('Preview(as Form) snapshot', async () => {
  setupUIMock();
  let container: HTMLElement = document.createElement('a');
  act(() => {
    const { container: c } = render(
      <I18nContext.Provider value={i18n}>
        <FontContext.Provider value={getDefaultFont()}>
          <PluginsRegistry.Provider value={plugins}>
            <Preview
              template={getSampleTemplate()}
              inputs={[{ field1: 'field1', field2: 'field2' }]}
              size={{ width: 1200, height: 1200 }}
              onChangeInput={console.log}
            />
          </PluginsRegistry.Provider>
        </FontContext.Provider>
      </I18nContext.Provider>
    );
    container = c;
  });

  await waitFor(() => Boolean(container?.getElementsByClassName(SELECTABLE_CLASSNAME)));
  expect(container.firstChild).toMatchSnapshot();
});

test('Preview with hidden zoom controls and scrollbars', async () => {
  setupUIMock();
  let container: HTMLElement = document.createElement('a');
  const options = { hideZoomControls: true, hideScrollbars: true };

  act(() => {
    const { container: c } = render(
      <I18nContext.Provider value={i18n}>
        <FontContext.Provider value={getDefaultFont()}>
          <PluginsRegistry.Provider value={plugins}>
            <OptionsContext.Provider value={options}>
              <Preview
                template={getSampleTemplate()}
                inputs={[{ field1: 'field1', field2: 'field2' }]}
                size={{ width: 1200, height: 1200 }}
              />
            </OptionsContext.Provider>
          </PluginsRegistry.Provider>
        </FontContext.Provider>
      </I18nContext.Provider>
    );
    container = c;
  });

  await waitFor(() => Boolean(container?.getElementsByClassName(SELECTABLE_CLASSNAME)));

  // Check that CtlBar is not rendered (no elements with control bar classes)
  const ctlBarElements = container.querySelectorAll('[style*="position: absolute"]');
  expect(ctlBarElements).toHaveLength(0);

  // Check that the container has overflow: hidden instead of auto
  const scrollContainer = container.querySelector('[style*="overflow"]');
  expect(scrollContainer).toHaveStyle('overflow: hidden');
});
