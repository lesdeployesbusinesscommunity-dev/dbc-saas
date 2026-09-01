// Import Dependencies
import { Tooltip } from "react-tooltip";

// Local Import
import {
  injectStyles,
  insertStylesToHead,
  makeStyleTag,
} from "utils/dom/injectStylesToHead";

// ----------------------------------------------------------------------

const css = `
:root {
  --rt-color-white: #fff;
  --rt-color-dark: rgb(var(--colors-gray-800)) !important;
  --rt-color-success: rgb(var(--colors-success-darker)) !important;
  --rt-color-error:rgb(var(--colors-error-darker)) !important;
  --rt-color-warning: rgb(var(--colors-warning-darker)) !important;
  --rt-color-info: rgb(var(--colors-info-darker)) !important;
  --rt-opacity: 1;
  --rt-transition-show-delay: 0.15s;
  --rt-transition-closing-delay: 0.15s;
}

:root.dark {
  --rt-color-white: rgb(var(--colors-dark-50)) !important;
  --rt-color-dark: rgb(var(--colors-dark-500)) !important;
}`;

const sheet = makeStyleTag();

injectStyles(sheet, css);
insertStylesToHead(sheet);

export { Tooltip };
