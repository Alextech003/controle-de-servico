import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  // Removido base: "./" para evitar problemas de roteamento na Vercel
})