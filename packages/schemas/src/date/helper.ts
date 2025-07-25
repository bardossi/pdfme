import type * as CSS from 'csstype';

import AirDatepicker from 'air-datepicker';
import type { AirDatepickerLocale, AirDatepickerButton, AirDatepickerDate } from 'air-datepicker';
import localeAr from 'air-datepicker/locale/ar';
import localeBg from 'air-datepicker/locale/bg';
import localeCa from 'air-datepicker/locale/ca';
import localeCs from 'air-datepicker/locale/cs';
import localeDa from 'air-datepicker/locale/da';
import localeDe from 'air-datepicker/locale/de';
import localeEl from 'air-datepicker/locale/el';
import localeEn from 'air-datepicker/locale/en';
import localeEs from 'air-datepicker/locale/es';
import localeEu from 'air-datepicker/locale/eu';
import localeFi from 'air-datepicker/locale/fi';
import localeFr from 'air-datepicker/locale/fr';
import localeHr from 'air-datepicker/locale/hr';
import localeHu from 'air-datepicker/locale/hu';
import localeId from 'air-datepicker/locale/id';
import localeIt from 'air-datepicker/locale/it';
import localeJa from 'air-datepicker/locale/ja';
import localeKo from 'air-datepicker/locale/ko';
import localeNb from 'air-datepicker/locale/nb';
import localeNl from 'air-datepicker/locale/nl';
import localeTh from 'air-datepicker/locale/th';
import localePl from 'air-datepicker/locale/pl';
import localePtBR from 'air-datepicker/locale/pt-BR';
import localePt from 'air-datepicker/locale/pt';
import localeRo from 'air-datepicker/locale/ro';
import localeRu from 'air-datepicker/locale/ru';
import localeSi from 'air-datepicker/locale/si';
import localeSk from 'air-datepicker/locale/sk';
import localeSl from 'air-datepicker/locale/sl';
import localeSv from 'air-datepicker/locale/sv';
import localeTr from 'air-datepicker/locale/tr';
import localeUk from 'air-datepicker/locale/uk';
import localeZh from 'air-datepicker/locale/zh';

import * as dateFns from 'date-fns/locale';
import { format } from 'date-fns';

import { Plugin, getFallbackFontName, DEFAULT_FONT_NAME, PropPanelSchema } from '@sunnystudiohu/common';
import text from '../text/index.js';
import { DEFAULT_OPACITY, HEX_COLOR_PATTERN } from '../constants.js';
import { mapVerticalAlignToFlex } from '../text/uiRender.js';
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_ALIGNMENT,
  VERTICAL_ALIGN_MIDDLE,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_CHARACTER_SPACING,
  DEFAULT_FONT_COLOR,
} from '../text/constants.js';
import { DateSchema } from './types.js';
import { getExtraFormatterSchema, Formatter } from '../text/extraFormatter.js';
import { isEditable } from '../utils.js';

interface AirDatepickerInstance {
  selectedDates: Date[];
  hide: () => void;
  destroy: () => void;
  show: () => void;
}

type PickerType = 'date' | 'time' | 'dateTime';

interface Locale {
  label: string;
  adLocale: AirDatepickerLocale;
  formatLocale: dateFns.Locale;
}

const LOCALE_MAP: Record<string, Locale> = {
  ar: { label: 'Arabic', adLocale: localeAr, formatLocale: dateFns.ar },
  bg: { label: 'Bulgarian', adLocale: localeBg, formatLocale: dateFns.bg },
  ca: { label: 'Catalan', adLocale: localeCa, formatLocale: dateFns.ca },
  cs: { label: 'Czech', adLocale: localeCs, formatLocale: dateFns.cs },
  da: { label: 'Danish', adLocale: localeDa, formatLocale: dateFns.da },
  de: { label: 'German', adLocale: localeDe, formatLocale: dateFns.de },
  el: { label: 'Greek', adLocale: localeEl, formatLocale: dateFns.el },
  en: { label: 'English', adLocale: localeEn, formatLocale: dateFns.enUS },
  es: { label: 'Spanish', adLocale: localeEs, formatLocale: dateFns.es },
  eu: { label: 'Basque', adLocale: localeEu, formatLocale: dateFns.eu },
  fi: { label: 'Finnish', adLocale: localeFi, formatLocale: dateFns.fi },
  fr: { label: 'French', adLocale: localeFr, formatLocale: dateFns.fr },
  hr: { label: 'Croatian', adLocale: localeHr, formatLocale: dateFns.hr },
  hu: { label: 'Hungarian', adLocale: localeHu, formatLocale: dateFns.hu },
  id: { label: 'Indonesian', adLocale: localeId, formatLocale: dateFns.id },
  it: { label: 'Italian', adLocale: localeIt, formatLocale: dateFns.it },
  ja: { label: 'Japanese', adLocale: localeJa, formatLocale: dateFns.ja },
  ko: { label: 'Korean', adLocale: localeKo, formatLocale: dateFns.ko },
  nb: { label: 'Norwegian Bokmål', adLocale: localeNb, formatLocale: dateFns.nb },
  nl: { label: 'Dutch', adLocale: localeNl, formatLocale: dateFns.nl },
  pl: { label: 'Polish', adLocale: localePl, formatLocale: dateFns.pl },
  'pt-Br': { label: 'Portuguese', adLocale: localePtBR, formatLocale: dateFns.ptBR },
  pt: { label: 'Portuguese', adLocale: localePt, formatLocale: dateFns.pt },
  ro: { label: 'Romanian', adLocale: localeRo, formatLocale: dateFns.ro },
  ru: { label: 'Russian', adLocale: localeRu, formatLocale: dateFns.ru },
  si: { label: 'Sinhala', adLocale: localeSi, formatLocale: dateFns.enUS },
  sk: { label: 'Slovak', adLocale: localeSk, formatLocale: dateFns.sk },
  sl: { label: 'Slovenian', adLocale: localeSl, formatLocale: dateFns.sl },
  sv: { label: 'Swedish', adLocale: localeSv, formatLocale: dateFns.sv },
  th: { label: 'Thai', adLocale: localeTh, formatLocale: dateFns.th },
  tr: { label: 'Turkish', adLocale: localeTr, formatLocale: dateFns.tr },
  uk: { label: 'Ukrainian', adLocale: localeUk, formatLocale: dateFns.uk },
  zh: { label: 'Chinese', adLocale: localeZh, formatLocale: dateFns.zhCN },
};

const getAirDatepickerLocale = (locale: string) => {
  const data = LOCALE_MAP[locale];
  if (!data) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  return data;
};

const airDatepickerCss = `.air-datepicker-cell.-year-.-other-decade-,.air-datepicker-cell.-day-.-other-month-{color:var(--adp-color-other-month)}.air-datepicker-cell.-year-.-other-decade-:hover,.air-datepicker-cell.-day-.-other-month-:hover{color:var(--adp-color-other-month-hover)}.-disabled-.-focus-.air-datepicker-cell.-year-.-other-decade-,.-disabled-.-focus-.air-datepicker-cell.-day-.-other-month-{color:var(--adp-color-other-month)}.-selected-.air-datepicker-cell.-year-.-other-decade-,.-selected-.air-datepicker-cell.-day-.-other-month-{color:#fff;background:var(--adp-background-color-selected-other-month)}.-selected-.-focus-.air-datepicker-cell.-year-.-other-decade-,.-selected-.-focus-.air-datepicker-cell.-day-.-other-month-{background:var(--adp-background-color-selected-other-month-focused)}.-in-range-.air-datepicker-cell.-year-.-other-decade-,.-in-range-.air-datepicker-cell.-day-.-other-month-{background-color:var(--adp-background-color-in-range);color:var(--adp-color)}.-in-range-.-focus-.air-datepicker-cell.-year-.-other-decade-,.-in-range-.-focus-.air-datepicker-cell.-day-.-other-month-{background-color:var(--adp-background-color-in-range-focused)}.air-datepicker-cell.-year-.-other-decade-:empty,.air-datepicker-cell.-day-.-other-month-:empty{background:none;border:none}.air-datepicker-cell{border-radius:var(--adp-cell-border-radius);box-sizing:border-box;cursor:pointer;display:flex;position:relative;align-items:center;justify-content:center;z-index:1}.air-datepicker-cell.-focus-{background:var(--adp-cell-background-color-hover)}.air-datepicker-cell.-current-{color:var(--adp-color-current-date)}.air-datepicker-cell.-current-.-focus-{color:var(--adp-color)}.air-datepicker-cell.-current-.-in-range-{color:var(--adp-color-current-date)}.air-datepicker-cell.-disabled-{cursor:default;color:var(--adp-color-disabled)}.air-datepicker-cell.-disabled-.-focus-{color:var(--adp-color-disabled)}.air-datepicker-cell.-disabled-.-in-range-{color:var(--adp-color-disabled-in-range)}.air-datepicker-cell.-disabled-.-current-.-focus-{color:var(--adp-color-disabled)}.air-datepicker-cell.-in-range-{background:var(--adp-cell-background-color-in-range);border-radius:0}.air-datepicker-cell.-in-range-:hover,.air-datepicker-cell.-in-range-.-focus-{background:var(--adp-cell-background-color-in-range-hover)}.air-datepicker-cell.-range-from-{border:1px solid var(--adp-cell-border-color-in-range);background-color:var(--adp-cell-background-color-in-range);border-radius:var(--adp-cell-border-radius) 0 0 var(--adp-cell-border-radius)}.air-datepicker-cell.-range-to-{border:1px solid var(--adp-cell-border-color-in-range);background-color:var(--adp-cell-background-color-in-range);border-radius:0 var(--adp-cell-border-radius) var(--adp-cell-border-radius) 0}.air-datepicker-cell.-range-to-.-range-from-{border-radius:var(--adp-cell-border-radius)}.air-datepicker-cell.-selected-{color:#fff;border:none;background:var(--adp-cell-background-color-selected)}.air-datepicker-cell.-selected-.-current-{color:#fff;background:var(--adp-cell-background-color-selected)}.air-datepicker-cell.-selected-.-focus-{background:var(--adp-cell-background-color-selected-hover)}
.air-datepicker-body{transition:all var(--adp-transition-duration) var(--adp-transition-ease)}.air-datepicker-body.-hidden-{display:none}.air-datepicker-body--day-names{display:grid;grid-template-columns:repeat(7, var(--adp-day-cell-width));margin:8px 0 3px}.air-datepicker-body--day-name{color:var(--adp-day-name-color);display:flex;align-items:center;justify-content:center;flex:1;text-align:center;text-transform:uppercase;font-size:.8em}.air-datepicker-body--day-name.-clickable-{cursor:pointer}.air-datepicker-body--day-name.-clickable-:hover{color:var(--adp-day-name-color-hover)}.air-datepicker-body--cells{display:grid}.air-datepicker-body--cells.-days-{grid-template-columns:repeat(7, var(--adp-day-cell-width));grid-auto-rows:var(--adp-day-cell-height)}.air-datepicker-body--cells.-months-{grid-template-columns:repeat(3, 1fr);grid-auto-rows:var(--adp-month-cell-height)}.air-datepicker-body--cells.-years-{grid-template-columns:repeat(4, 1fr);grid-auto-rows:var(--adp-year-cell-height)}
.air-datepicker-nav{display:flex;justify-content:space-between;border-bottom:1px solid var(--adp-border-color-inner);min-height:var(--adp-nav-height);padding:var(--adp-padding);box-sizing:content-box}.-only-timepicker- .air-datepicker-nav{display:none}.air-datepicker-nav--title,.air-datepicker-nav--action{display:flex;cursor:pointer;align-items:center;justify-content:center}.air-datepicker-nav--action{width:var(--adp-nav-action-size);border-radius:var(--adp-border-radius);-webkit-user-select:none;-moz-user-select:none;user-select:none}.air-datepicker-nav--action:hover{background:var(--adp-background-color-hover)}.air-datepicker-nav--action:active{background:var(--adp-background-color-active)}.air-datepicker-nav--action.-disabled-{visibility:hidden}.air-datepicker-nav--action svg{width:32px;height:32px}.air-datepicker-nav--action path{fill:none;stroke:var(--adp-nav-arrow-color);stroke-width:2px}.air-datepicker-nav--title{border-radius:var(--adp-border-radius);padding:0 8px}.air-datepicker-nav--title i{font-style:normal;color:var(--adp-nav-color-secondary);margin-left:.3em}.air-datepicker-nav--title:hover{background:var(--adp-background-color-hover)}.air-datepicker-nav--title:active{background:var(--adp-background-color-active)}.air-datepicker-nav--title.-disabled-{cursor:default;background:none}
.air-datepicker-buttons{display:grid;grid-auto-columns:1fr;grid-auto-flow:column}.air-datepicker-button{display:inline-flex;color:var(--adp-btn-color);border-radius:var(--adp-btn-border-radius);cursor:pointer;height:var(--adp-btn-height);border:none;background:rgba(255,255,255,0)}.air-datepicker-button:hover{color:var(--adp-btn-color-hover);background:var(--adp-btn-background-color-hover)}.air-datepicker-button:focus{color:var(--adp-btn-color-hover);background:var(--adp-btn-background-color-hover);outline:none}.air-datepicker-button:active{background:var(--adp-btn-background-color-active)}.air-datepicker-button span{outline:none;display:flex;align-items:center;justify-content:center;width:100%;height:100%}
.air-datepicker-time{display:grid;grid-template-columns:max-content 1fr;grid-column-gap:12px;align-items:center;position:relative;padding:0 var(--adp-time-padding-inner)}.-only-timepicker- .air-datepicker-time{border-top:none}.air-datepicker-time--current{display:flex;align-items:center;flex:1;font-size:14px;text-align:center}.air-datepicker-time--current-colon{margin:0 2px 3px;line-height:1}.air-datepicker-time--current-hours,.air-datepicker-time--current-minutes{line-height:1;font-size:19px;font-family:"Century Gothic",CenturyGothic,AppleGothic,sans-serif;position:relative;z-index:1}.air-datepicker-time--current-hours:after,.air-datepicker-time--current-minutes:after{content:"";background:var(--adp-background-color-hover);border-radius:var(--adp-border-radius);position:absolute;left:-2px;top:-3px;right:-2px;bottom:-2px;z-index:-1;opacity:0}.air-datepicker-time--current-hours.-focus-:after,.air-datepicker-time--current-minutes.-focus-:after{opacity:1}.air-datepicker-time--current-ampm{text-transform:uppercase;align-self:flex-end;color:var(--adp-time-day-period-color);margin-left:6px;font-size:11px;margin-bottom:1px}.air-datepicker-time--row{display:flex;align-items:center;font-size:11px;height:17px;background:linear-gradient(to right, var(--adp-time-track-color), var(--adp-time-track-color)) left 50%/100% var(--adp-time-track-height) no-repeat}.air-datepicker-time--row:first-child{margin-bottom:4px}.air-datepicker-time--row input[type=range]{background:none;cursor:pointer;flex:1;height:100%;width:100%;padding:0;margin:0;-webkit-appearance:none}.air-datepicker-time--row input[type=range]::-webkit-slider-thumb{-webkit-appearance:none}.air-datepicker-time--row input[type=range]::-ms-tooltip{display:none}.air-datepicker-time--row input[type=range]:hover::-webkit-slider-thumb{border-color:var(--adp-time-track-color-hover)}.air-datepicker-time--row input[type=range]:hover::-moz-range-thumb{border-color:var(--adp-time-track-color-hover)}.air-datepicker-time--row input[type=range]:hover::-ms-thumb{border-color:var(--adp-time-track-color-hover)}.air-datepicker-time--row input[type=range]:focus{outline:none}.air-datepicker-time--row input[type=range]:focus::-webkit-slider-thumb{background:var(--adp-cell-background-color-selected);border-color:var(--adp-cell-background-color-selected)}.air-datepicker-time--row input[type=range]:focus::-moz-range-thumb{background:var(--adp-cell-background-color-selected);border-color:var(--adp-cell-background-color-selected)}.air-datepicker-time--row input[type=range]:focus::-ms-thumb{background:var(--adp-cell-background-color-selected);border-color:var(--adp-cell-background-color-selected)}.air-datepicker-time--row input[type=range]::-webkit-slider-thumb{box-sizing:border-box;height:12px;width:12px;border-radius:3px;border:1px solid var(--adp-time-track-color);background:#fff;cursor:pointer;-webkit-transition:background var(--adp-transition-duration);transition:background var(--adp-transition-duration)}.air-datepicker-time--row input[type=range]::-moz-range-thumb{box-sizing:border-box;height:12px;width:12px;border-radius:3px;border:1px solid var(--adp-time-track-color);background:#fff;cursor:pointer;-moz-transition:background var(--adp-transition-duration);transition:background var(--adp-transition-duration)}.air-datepicker-time--row input[type=range]::-ms-thumb{box-sizing:border-box;height:12px;width:12px;border-radius:3px;border:1px solid var(--adp-time-track-color);background:#fff;cursor:pointer;-ms-transition:background var(--adp-transition-duration);transition:background var(--adp-transition-duration)}.air-datepicker-time--row input[type=range]::-webkit-slider-thumb{margin-top:calc(var(--adp-time-thumb-size)/2*-1)}.air-datepicker-time--row input[type=range]::-webkit-slider-runnable-track{border:none;height:var(--adp-time-track-height);cursor:pointer;color:rgba(0,0,0,0);background:rgba(0,0,0,0)}.air-datepicker-time--row input[type=range]::-moz-range-track{border:none;height:var(--adp-time-track-height);cursor:pointer;color:rgba(0,0,0,0);background:rgba(0,0,0,0)}.air-datepicker-time--row input[type=range]::-ms-track{border:none;height:var(--adp-time-track-height);cursor:pointer;color:rgba(0,0,0,0);background:rgba(0,0,0,0)}.air-datepicker-time--row input[type=range]::-ms-fill-lower{background:rgba(0,0,0,0)}.air-datepicker-time--row input[type=range]::-ms-fill-upper{background:rgba(0,0,0,0)}
.air-datepicker{--adp-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";--adp-font-size: 14px;--adp-width: 246px;--adp-z-index: 100;--adp-padding: 4px;--adp-grid-areas: "nav" "body" "timepicker" "buttons";--adp-transition-duration: .3s;--adp-transition-ease: ease-out;--adp-transition-offset: 8px;--adp-background-color: #fff;--adp-background-color-hover: #f0f0f0;--adp-background-color-active: #eaeaea;--adp-background-color-in-range: rgba(92, 196, 239, .1);--adp-background-color-in-range-focused: rgba(92, 196, 239, .2);--adp-background-color-selected-other-month-focused: #8ad5f4;--adp-background-color-selected-other-month: #a2ddf6;--adp-color: #4a4a4a;--adp-color-secondary: #9c9c9c;--adp-accent-color: #4eb5e6;--adp-color-current-date: var(--adp-accent-color);--adp-color-other-month: #dedede;--adp-color-disabled: #aeaeae;--adp-color-disabled-in-range: #939393;--adp-color-other-month-hover: #c5c5c5;--adp-border-color: #dbdbdb;--adp-border-color-inner: #efefef;--adp-border-radius: 4px;--adp-border-color-inline: #d7d7d7;--adp-nav-height: 32px;--adp-nav-arrow-color: var(--adp-color-secondary);--adp-nav-action-size: 32px;--adp-nav-color-secondary: var(--adp-color-secondary);--adp-day-name-color: #ff9a19;--adp-day-name-color-hover: #8ad5f4;--adp-day-cell-width: 1fr;--adp-day-cell-height: 32px;--adp-month-cell-height: 42px;--adp-year-cell-height: 56px;--adp-pointer-size: 10px;--adp-poiner-border-radius: 2px;--adp-pointer-offset: 14px;--adp-cell-border-radius: 4px;--adp-cell-background-color-hover: var(--adp-background-color-hover);--adp-cell-background-color-selected: #5cc4ef;--adp-cell-background-color-selected-hover: #45bced;--adp-cell-background-color-in-range: rgba(92, 196, 239, 0.1);--adp-cell-background-color-in-range-hover: rgba(92, 196, 239, 0.2);--adp-cell-border-color-in-range: var(--adp-cell-background-color-selected);--adp-btn-height: 32px;--adp-btn-color: var(--adp-accent-color);--adp-btn-color-hover: var(--adp-color);--adp-btn-border-radius: var(--adp-border-radius);--adp-btn-background-color-hover: var(--adp-background-color-hover);--adp-btn-background-color-active: var(--adp-background-color-active);--adp-time-track-height: 1px;--adp-time-track-color: #dedede;--adp-time-track-color-hover: #b1b1b1;--adp-time-thumb-size: 12px;--adp-time-padding-inner: 10px;--adp-time-day-period-color: var(--adp-color-secondary);--adp-mobile-font-size: 16px;--adp-mobile-nav-height: 40px;--adp-mobile-width: 320px;--adp-mobile-day-cell-height: 38px;--adp-mobile-month-cell-height: 48px;--adp-mobile-year-cell-height: 64px}.air-datepicker-overlay{--adp-overlay-background-color: rgba(0, 0, 0, .3);--adp-overlay-transition-duration: .3s;--adp-overlay-transition-ease: ease-out;--adp-overlay-z-index: 99}
.air-datepicker{background:var(--adp-background-color);border:1px solid var(--adp-border-color);box-shadow:0 4px 12px rgba(0,0,0,.15);border-radius:var(--adp-border-radius);box-sizing:content-box;display:grid;grid-template-columns:1fr;grid-template-rows:repeat(4, max-content);grid-template-areas:var(--adp-grid-areas);font-family:var(--adp-font-family),sans-serif;font-size:var(--adp-font-size);color:var(--adp-color);width:var(--adp-width);position:absolute;transition:opacity var(--adp-transition-duration) var(--adp-transition-ease),transform var(--adp-transition-duration) var(--adp-transition-ease);z-index:var(--adp-z-index)}.air-datepicker:not(.-custom-position-){opacity:0}.air-datepicker.-from-top-{transform:translateY(calc(var(--adp-transition-offset) * -1))}.air-datepicker.-from-right-{transform:translateX(var(--adp-transition-offset))}.air-datepicker.-from-bottom-{transform:translateY(var(--adp-transition-offset))}.air-datepicker.-from-left-{transform:translateX(calc(var(--adp-transition-offset) * -1))}.air-datepicker.-active-:not(.-custom-position-){transform:translate(0, 0);opacity:1}.air-datepicker.-active-.-custom-position-{transition:none}.air-datepicker.-inline-{border-color:var(--adp-border-color-inline);box-shadow:none;position:static;left:auto;right:auto;opacity:1;transform:none}.air-datepicker.-inline- .air-datepicker--pointer{display:none}.air-datepicker.-is-mobile-{--adp-font-size: var(--adp-mobile-font-size);--adp-day-cell-height: var(--adp-mobile-day-cell-height);--adp-month-cell-height: var(--adp-mobile-month-cell-height);--adp-year-cell-height: var(--adp-mobile-year-cell-height);--adp-nav-height: var(--adp-mobile-nav-height);--adp-nav-action-size: var(--adp-mobile-nav-height);position:fixed;width:var(--adp-mobile-width);border:none}.air-datepicker.-is-mobile- *{-webkit-tap-highlight-color:rgba(0,0,0,0)}.air-datepicker.-is-mobile- .air-datepicker--pointer{display:none}.air-datepicker.-is-mobile-:not(.-custom-position-){transform:translate(-50%, calc(-50% + var(--adp-transition-offset)))}.air-datepicker.-is-mobile-.-active-:not(.-custom-position-){transform:translate(-50%, -50%)}.air-datepicker.-custom-position-{transition:none}.air-datepicker-global-container{position:absolute;left:0;top:0}.air-datepicker--pointer{--pointer-half-size: calc(var(--adp-pointer-size) / 2);position:absolute;width:var(--adp-pointer-size);height:var(--adp-pointer-size);z-index:-1}.air-datepicker--pointer:after{content:"";position:absolute;background:#fff;border-top:1px solid var(--adp-border-color-inline);border-right:1px solid var(--adp-border-color-inline);border-top-right-radius:var(--adp-poiner-border-radius);width:var(--adp-pointer-size);height:var(--adp-pointer-size);box-sizing:border-box}.-top-left- .air-datepicker--pointer,.-top-center- .air-datepicker--pointer,.-top-right- .air-datepicker--pointer,[data-popper-placement^=top] .air-datepicker--pointer{top:calc(100% - var(--pointer-half-size) + 1px)}.-top-left- .air-datepicker--pointer:after,.-top-center- .air-datepicker--pointer:after,.-top-right- .air-datepicker--pointer:after,[data-popper-placement^=top] .air-datepicker--pointer:after{transform:rotate(135deg)}.-right-top- .air-datepicker--pointer,.-right-center- .air-datepicker--pointer,.-right-bottom- .air-datepicker--pointer,[data-popper-placement^=right] .air-datepicker--pointer{right:calc(100% - var(--pointer-half-size) + 1px)}.-right-top- .air-datepicker--pointer:after,.-right-center- .air-datepicker--pointer:after,.-right-bottom- .air-datepicker--pointer:after,[data-popper-placement^=right] .air-datepicker--pointer:after{transform:rotate(225deg)}.-bottom-left- .air-datepicker--pointer,.-bottom-center- .air-datepicker--pointer,.-bottom-right- .air-datepicker--pointer,[data-popper-placement^=bottom] .air-datepicker--pointer{bottom:calc(100% - var(--pointer-half-size) + 1px)}.-bottom-left- .air-datepicker--pointer:after,.-bottom-center- .air-datepicker--pointer:after,.-bottom-right- .air-datepicker--pointer:after,[data-popper-placement^=bottom] .air-datepicker--pointer:after{transform:rotate(315deg)}.-left-top- .air-datepicker--pointer,.-left-center- .air-datepicker--pointer,.-left-bottom- .air-datepicker--pointer,[data-popper-placement^=left] .air-datepicker--pointer{left:calc(100% - var(--pointer-half-size) + 1px)}.-left-top- .air-datepicker--pointer:after,.-left-center- .air-datepicker--pointer:after,.-left-bottom- .air-datepicker--pointer:after,[data-popper-placement^=left] .air-datepicker--pointer:after{transform:rotate(45deg)}.-top-left- .air-datepicker--pointer,.-bottom-left- .air-datepicker--pointer{left:var(--adp-pointer-offset)}.-top-right- .air-datepicker--pointer,.-bottom-right- .air-datepicker--pointer{right:var(--adp-pointer-offset)}.-top-center- .air-datepicker--pointer,.-bottom-center- .air-datepicker--pointer{left:calc(50% - var(--adp-pointer-size)/2)}.-left-top- .air-datepicker--pointer,.-right-top- .air-datepicker--pointer{top:var(--adp-pointer-offset)}.-left-bottom- .air-datepicker--pointer,.-right-bottom- .air-datepicker--pointer{bottom:var(--adp-pointer-offset)}.-left-center- .air-datepicker--pointer,.-right-center- .air-datepicker--pointer{top:calc(50% - var(--adp-pointer-size)/2)}.air-datepicker--navigation{grid-area:nav}.air-datepicker--content{box-sizing:content-box;padding:var(--adp-padding);grid-area:body}.-only-timepicker- .air-datepicker--content{display:none}.air-datepicker--time{grid-area:timepicker}.air-datepicker--buttons{grid-area:buttons}.air-datepicker--buttons,.air-datepicker--time{padding:var(--adp-padding);border-top:1px solid var(--adp-border-color-inner)}.air-datepicker-overlay{position:fixed;background:var(--adp-overlay-background-color);left:0;top:0;width:0;height:0;opacity:0;transition:opacity var(--adp-overlay-transition-duration) var(--adp-overlay-transition-ease),left 0s,height 0s,width 0s;transition-delay:0s,var(--adp-overlay-transition-duration),var(--adp-overlay-transition-duration),var(--adp-overlay-transition-duration);z-index:var(--adp-overlay-z-index)}.air-datepicker-overlay.-active-{opacity:1;width:100%;height:100%;transition:opacity var(--adp-overlay-transition-duration) var(--adp-overlay-transition-ease),height 0s,width 0s}`;

const injectStyles = (css: string) => {
  if (typeof document !== 'undefined') {
    const styleElementId = 'pdfme-air-datepicker-styles';
    if (!document.getElementById(styleElementId)) {
      const style = document.createElement('style');
      style.id = styleElementId;
      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));
      document.head.appendChild(style);
    }
  }
};

const strDateToDate = (strDate: string, type: PickerType): Date => {
  if (!strDate.trim()) {
    return new Date();
  }

  if (type === 'time') {
    const dateTimePattern = /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/;
    if (dateTimePattern.test(strDate)) {
      return new Date(strDate.replace(/\//g, '-').replace(' ', 'T'));
    }
    return new Date(`2021-01-01T${strDate}`);
  }

  return new Date(strDate);
};

const getFormat = (type: PickerType, locale: Locale): string => {
  switch (type) {
    case 'date': {
      return locale.adLocale.dateFormat;
    }
    case 'time': {
      return 'HH:mm';
    }
    case 'dateTime': {
      return `${locale.adLocale.dateFormat} ${locale.adLocale.timeFormat}`;
    }
  }
};

const getFmtValue = (
  value: string,
  type: PickerType,
  schema: DateSchema,
  locale: Locale,
): string => {
  return value
    ? format(strDateToDate(value, type), schema.format, {
        locale: locale.formatLocale,
      })
    : '';
};

const getFmtContent = (date: Date | null, type: PickerType) => {
  const fmt = (() => {
    switch (type) {
      case 'date': {
        return 'yyyy/MM/dd';
      }
      case 'time': {
        return 'HH:mm';
      }
      case 'dateTime': {
        return 'yyyy/MM/dd HH:mm';
      }
    }
  })();
  return date ? format(date, fmt) : '';
};

export const getPlugin = ({ type, icon }: { type: PickerType; icon: string }) => {
  const defaultLocale = 'en';
  const defaultFormat = getFormat(type, getAirDatepickerLocale(defaultLocale));

  const plugin: Plugin<DateSchema> = {
    ui: async (arg) => {
      const { schema, value, onChange, rootElement, mode, options, i18n } = arg;

      const locale = getAirDatepickerLocale(schema.locale || options.lang || defaultLocale);

      const textElement = document.createElement('div');
      const textElementStyle: CSS.Properties = {
        width: `${schema.width}mm`,
        height: `${schema.height}mm`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: mapVerticalAlignToFlex(VERTICAL_ALIGN_MIDDLE),
      };
      Object.assign(textElement.style, textElementStyle);

      await text.ui({
        ...arg,
        rootElement: textElement,
        mode: 'viewer',
        value: getFmtValue(value, type, schema, locale),
        schema: {
          ...schema,
          verticalAlignment: VERTICAL_ALIGN_MIDDLE,
          lineHeight: DEFAULT_LINE_HEIGHT,
        },
      });

      injectStyles(airDatepickerCss);

      const beforeRemoveEvent = new Event('beforeRemove');
      rootElement.dispatchEvent(beforeRemoveEvent);

      const input = document.createElement('input');
      Object.assign(input.style, { visibility: 'hidden', position: 'absolute' });

      const commitChange = (date: Date | null) => {
        if (onChange) {
          onChange({ key: 'content', value: getFmtContent(date, type) });
        }
      };

      const adButtons: AirDatepickerButton[] = [
        {
          content: i18n('cancel'),
          onClick: (datepicker) => {
            datepicker.hide();
          },
        },
        {
          content: i18n('clear'),
          onClick: (datepicker) => {
            datepicker.hide();
            commitChange(null);
          },
        },
      ];
      if (type !== 'date') {
        adButtons.push({
          content: i18n('set'),
          onClick: (datepicker) => {
            datepicker.hide();
            const date = datepicker.selectedDates.length ? datepicker.selectedDates[0] : null;
            commitChange(date);
          },
        });
      }
      const airDatepicker = new AirDatepicker(input, {
        locale: locale.adLocale,
        selectedDates: [strDateToDate(value, type)],
        dateFormat: (date: AirDatepickerDate) =>
          format(date, schema.format, { locale: locale.formatLocale }),
        timepicker: type !== 'date',
        onlyTimepicker: type === 'time',
        isMobile: window.innerWidth < 768,
        buttons: adButtons,
        onSelect: ({ datepicker }: { datepicker: AirDatepickerInstance }) => {
          if (type === 'date') {
            commitChange(datepicker.selectedDates.length ? datepicker.selectedDates[0] : null);
            datepicker.hide();
          }
        },
      });

      rootElement.addEventListener('beforeRemove', () => {
        if (isEditable(mode, schema)) {
          airDatepicker.destroy();
        }
      });
      textElement.addEventListener('click', () => {
        if (isEditable(mode, schema)) {
          airDatepicker.show();
        }
      });

      rootElement.appendChild(input);
      rootElement.appendChild(textElement);
    },
    pdf: (arg) => {
      const { schema, value, options } = arg;
      if (!value) return void 0;
      const locale = getAirDatepickerLocale(schema.locale || options.lang || defaultLocale);
      return text.pdf({
        ...arg,
        value: getFmtValue(value, type, schema, locale),
        schema: {
          ...schema,
          verticalAlignment: VERTICAL_ALIGN_MIDDLE,
          lineHeight: DEFAULT_LINE_HEIGHT,
        },
      });
    },
    propPanel: {
      schema: ({ options, i18n, activeSchema, changeSchemas }) => {
        const font = options.font || { [DEFAULT_FONT_NAME]: { data: '', fallback: true } };
        const fontNames = Object.keys(font);
        const fallbackFontName = getFallbackFontName(font);

        const locale = getAirDatepickerLocale(
          (activeSchema as { locale?: string }).locale || options.lang || defaultLocale,
        );

        if (
          (activeSchema as { locale?: string }).locale === undefined &&
          (activeSchema as { locale?: string }).locale !== options.lang
        ) {
          changeSchemas([
            { schemaId: activeSchema.id, key: 'locale', value: options.lang },
            { schemaId: activeSchema.id, key: 'format', value: getFormat(type, locale) },
          ]);
        }

        const formatter = getExtraFormatterSchema(i18n);
        formatter.buttons = formatter.buttons.filter(
          (button) => button.key === Formatter.ALIGNMENT,
        );

        const validateDateTimeFormat = (_rule: unknown, formatString: string): boolean => {
          try {
            format('Thu Jan 01 1970 00:00:00 GMT+0000', formatString, {
              locale: locale.formatLocale,
            });
            return true;
          } catch {
            return false;
          }
        };

        const localeOptions = Object.keys(LOCALE_MAP).map((lc) => ({
          label: `${lc} (${LOCALE_MAP[lc].label})`,
          value: lc,
        }));

        const dateSchema: Record<string, PropPanelSchema> = {
          format: {
            title: i18n('schemas.date.format'),
            type: 'string',
            default: getFormat(type, locale),
            placeholder: getFormat(type, locale),
            rules: [
              {
                validator: validateDateTimeFormat,
                message: i18n('validation.dateTimeFormat'),
              },
            ],
            span: 24,
          },
          fontName: {
            title: i18n('schemas.text.fontName'),
            type: 'string',
            widget: 'select',
            default: fallbackFontName,
            placeholder: fallbackFontName,
            props: { options: fontNames.map((name) => ({ label: name, value: name })) },
            span: 12,
          },
          fontSize: {
            title: i18n('schemas.text.size'),
            type: 'number',
            widget: 'inputNumber',
            span: 6,
            props: { min: 0 },
          },
          characterSpacing: {
            title: i18n('schemas.text.spacing'),
            type: 'number',
            widget: 'inputNumber',
            span: 6,
            props: { min: 0 },
          },
          formatter,
          fontColor: {
            title: i18n('schemas.textColor'),
            type: 'string',
            widget: 'color',
            props: {
              disabledAlpha: true,
            },
            rules: [
              {
                pattern: HEX_COLOR_PATTERN,
                message: i18n('validation.hexColor'),
              },
            ],
          },
          backgroundColor: {
            title: i18n('schemas.bgColor'),
            type: 'string',
            widget: 'color',
            props: {
              disabledAlpha: true,
            },
            rules: [
              {
                pattern: HEX_COLOR_PATTERN,
                message: i18n('validation.hexColor'),
              },
            ],
          },
          locale: {
            title: i18n('schemas.date.locale'),
            type: 'string',
            widget: 'select',
            props: {
              options: localeOptions,
            },
            span: 16,
          },
        };

        return dateSchema;
      },
      defaultSchema: {
        name: '',
        format: defaultFormat,
        type,
        content: getFmtContent(new Date(), type),
        position: { x: 0, y: 0 },
        width: 50,
        height: 10,
        rotate: 0,
        alignment: DEFAULT_ALIGNMENT,
        fontSize: DEFAULT_FONT_SIZE,
        characterSpacing: DEFAULT_CHARACTER_SPACING,
        fontColor: DEFAULT_FONT_COLOR,
        fontName: undefined,
        backgroundColor: '',
        locale: undefined,
        opacity: DEFAULT_OPACITY,
      } as DateSchema,
    },
    icon,
  };

  return plugin;
};
