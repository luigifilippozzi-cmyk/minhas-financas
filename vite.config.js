import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index:        resolve(__dirname, 'src/index.html'),
        login:        resolve(__dirname, 'src/login.html'),
        dashboard:    resolve(__dirname, 'src/dashboard.html'),
        despesas:     resolve(__dirname, 'src/despesas.html'),
        receitas:     resolve(__dirname, 'src/receitas.html'),
        categorias:   resolve(__dirname, 'src/categorias.html'),
        orcamentos:   resolve(__dirname, 'src/orcamentos.html'),
        fatura:       resolve(__dirname, 'src/fatura.html'),
        'fluxo-caixa': resolve(__dirname, 'src/fluxo-caixa.html'),
        importar:     resolve(__dirname, 'src/importar.html'),
        'base-dados': resolve(__dirname, 'src/base-dados.html'),
        grupo:        resolve(__dirname, 'src/grupo.html'),
        planejamento: resolve(__dirname, 'src/planejamento.html'),
      },
    },
  },
  server: {
    open: '/index.html',
  },
});
