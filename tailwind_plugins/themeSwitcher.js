import plugin from 'tailwindcss/plugin';
import { getThemeAsCustomProps, resolveThemeConfig } from './utils';

const defaultOptions = {
    themes: [],
}

const themeSwitch = (options = defaultOptions) => ({ addBase }) => {
    const { themes } = options

    themes.forEach(themeConfig => {
        const { theme, mediaQuery, selectors = [] } = themeConfig

        if (selectors.length > 0) {
            addBase({
                [selectors.join(', ')]: getThemeAsCustomProps(theme)
            })
        }

        if (mediaQuery) {
            addBase({
                [mediaQuery]: {
                    ':root': getThemeAsCustomProps(theme),
                }
            })
        }
    })
}

const themeSwitchPlugin = plugin.withOptions(themeSwitch,
    (options = defaultOptions) => {
        const baseTheme = options
            .themes
            .find(theme => theme.name === 'base')

        return {
            theme: {
                extend: baseTheme && baseTheme.theme
                    ? resolveThemeConfig(baseTheme.theme)
                    : {}
            }
        }
    }
)

export { themeSwitchPlugin as themeSwitch }