import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.test.{ts,tsx}'],
      setupFiles: ['./tests/setup.ts'],
      css: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.d.ts', 'src/main.tsx'],
      },
    },
  }),
)