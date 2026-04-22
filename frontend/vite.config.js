import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // On GitHub Pages the app is served at /<repo-name>/
  // Locally (or on a custom domain at root) GITHUB_REPOSITORY is not set, so base stays '/'
  base: process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/',
})
