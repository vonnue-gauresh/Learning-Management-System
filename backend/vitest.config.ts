import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/prisma/**',
        'src/**/*.d.ts',
        'src/server.ts',
        'src/**/*.types.ts',
      ],
    },
  },
})