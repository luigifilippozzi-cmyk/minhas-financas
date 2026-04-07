import { defineConfig } from 'vitest/config';

// Configuração exclusiva para testes de integração com Firebase Emulator.
// Requer que o emulador esteja rodando na porta 8080.
// Use: npm run test:integration  (inicia o emulador automaticamente)
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.js'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // forks = processos isolados; singleFork = um processo para todos os testes
    // garante que o testEnv do Vitest não concorra com o emulador
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
