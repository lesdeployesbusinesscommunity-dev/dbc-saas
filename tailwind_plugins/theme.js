import { colors } from '../src/constants/colors.constant'
import { themeSwitch } from "./themeSwitcher";

const theme = themeSwitch({
    themes: [
        // The only required theme is `base`. Every property used in
        // other themes must exist in here.
        {
            name: "base",
            selectors: [":root"],
            theme: {
                colors: {
                    gray: colors.slate,
                    dark: colors.navy,
                    primary: colors.indigo,
                    ...colors.variants,
                },
            },
        },
        {
            name: "theme-light:slate",
            selectors: ["[data-theme-light=slate]"],
            theme: {
                colors: {
                    gray: colors.slate,
                },
            },
        },
        {
            name: "theme-light:gray",
            selectors: ["[data-theme-light=gray]"],
            theme: {
                colors: {
                    gray: colors.gray,
                },
            },
        },
        {
            name: "theme-light:neutral",
            selectors: ["[data-theme-light=neutral]"],
            theme: {
                colors: {
                    gray: colors.neutral,
                },
            },
        },
        {
            name: "theme-dark:navy",
            selectors: ["[data-theme-dark=navy]"],
            theme: {
                colors: {
                    dark: colors.navy,
                },
            },
        },
        {
            name: "theme-dark:mirage",
            selectors: ["[data-theme-dark=mirage]"],
            theme: {
                colors: {
                    dark: colors.mirage,
                },
            },
        },
        {
            name: "theme-dark:mint",
            selectors: ["[data-theme-dark=mint]"],
            theme: {
                colors: {
                    dark: colors.mint,
                },
            },
        },
        {
            name: "theme-dark:black",
            selectors: ["[data-theme-dark=black]"],
            theme: {
                colors: {
                    dark: colors.black,
                },
            },
        },
        {
            name: "theme-dark:cinder",
            selectors: ["[data-theme-dark=cinder]"],
            theme: {
                colors: {
                    dark: colors.cinder,
                },
            },
        },
        {
            name: "theme-primary-indigo",
            selectors: ["[data-theme-primary=indigo]"],
            theme: {
                colors: {
                    primary: colors.indigo,
                },
            },
        },
        {
            name: "theme-primary-blue",
            selectors: ["[data-theme-primary=blue]"],
            theme: {
                colors: {
                    primary: colors.blue,
                },
            },
        },
        {
            name: "theme-primary-green",
            selectors: ["[data-theme-primary=green]"],
            theme: {
                colors: {
                    primary: colors.green,
                },
            },
        },
        {
            name: "theme-primary-amber",
            selectors: ["[data-theme-primary=amber]"],
            theme: {
                colors: {
                    primary: colors.amber,
                },
            },
        },
        {
            name: "theme-primary-purple",
            selectors: ["[data-theme-primary=purple]"],
            theme: {
                colors: {
                    primary: colors.purple,
                },
            },
        },
        {
            name: "theme-primary-rose",
            selectors: ["[data-theme-primary=rose]"],
            theme: {
                colors: {
                    primary: colors.rose,
                },
            },
        },
    ],
})

export { theme }