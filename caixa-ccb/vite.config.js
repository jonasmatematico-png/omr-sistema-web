import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  base: 'https://jonasmatematico.com.br/caixa-ccb/', // <-- MUDE PARA URL COMPLETA
})
