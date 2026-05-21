import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/main.tsx',
        'src/main.appinit.tsx',
        'src/vite-env.d.ts',
        'src/components/ui/**',
        '**/*.d.ts',
        '**/*.config.{ts,js}',
      ],
      thresholds: {
        lines: 30,
        functions: 28,
        branches: 30,
        statements: 30,
      },
    },
  },
})

