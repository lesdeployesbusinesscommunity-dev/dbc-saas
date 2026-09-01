import { colors } from "constants/colors.constant";

const DEFAULT_DARK_COLOR = "cinder";
const DEFAULT_LIGHT_COLOR = "slate";
const DEFAULT_PRIMARY_COLOR = "blue";

export const defaultTheme = {
    themeMode: "system",
    isMonochrome: false,
    themeLayout: "main-layout",
    cardSkin: 'bordered',
    darkColorScheme: {
        name: DEFAULT_DARK_COLOR,
        ...colors[DEFAULT_DARK_COLOR]
    },
    lightColorScheme: {
        name: DEFAULT_LIGHT_COLOR,
        ...colors[DEFAULT_LIGHT_COLOR]
    },
    primaryColorScheme: {
        name: DEFAULT_PRIMARY_COLOR,
        ...colors[DEFAULT_PRIMARY_COLOR]
    },
    defaultLang: "en",
    fallbackLang: "en",
    notification: {
        isExpanded: false,
        position: 'bottom-right',
        visibleToasts: 4
    }
};
