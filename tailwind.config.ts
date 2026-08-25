import type { Config } from 'tailwindcss'
import { claramelColors, claramelRadius, claramelShadow } from './src/styles/theme.ts'

export default {
  theme: {
    extend: {
      colors: {
        primary: claramelColors.primary,
        secondary: claramelColors.secondary,
        yellow: claramelColors.yellow,
        sky: claramelColors.sky,
        orange: claramelColors.orange,
        background: claramelColors.background,
        surface: claramelColors.surface,
        pinkLight: claramelColors.pinkLight,
        lavender: claramelColors.lavender,
        grayLight: claramelColors.grayLight,
        grayMedium: claramelColors.grayMedium,
        text: claramelColors.text,
        textSecondary: claramelColors.textSecondary,
        textOnPrimary: claramelColors.textOnPrimary,
        title: claramelColors.title,
        success: claramelColors.success,
        error: claramelColors.error,
        warning: claramelColors.warning,
        info: claramelColors.info,
      },
      borderRadius: {
        button: `${claramelRadius.button}px`,
        card: `${claramelRadius.card}px`,
        input: `${claramelRadius.input}px`,
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        sans: ['Nunito', 'sans-serif'],
      },
      boxShadow: {
        card: claramelShadow.card,
      },
    },
  },
} satisfies Config
