#!/usr/bin/env node
/**
 * po-diagnostic.js — Minhas Finanças
 * Executado pelo PO Agent no início de cada sessão Cowork.
 * Gera .auto-memory/po-handoff.md para DM e PM Agent.
 * Uso: node scripts/po-diagnostic.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, '.auto-memory', 'po-handoff.md');
const REPO = 'luigifilippozzi-cmyk/minhas-financas';
function run(cmd, fallback = 'n/a') {
  try {
    return execSync(cmd, { encoding: 'utf8', cwd: ROOT, timeout: 15000 }).trim();
  } catch {
    return fallback;
  }
}
function section(title, content) {
  return `\n## ${title}\n\n${content}\n`;
}
// ── 1. Git status ──────────────────────────────────────────────────────────
const branch     = run('git rev-parse --abbrev-ref HEAD');
const lastCommit = run('git log -1 --format="%h %s (%ar)"');
const dirtyFiles = run('git status --short') || '(clean)';
// ── 2. GitHub Issues ───────────────────────────────────────────────────────
const openIssues = run(
  `gh api repos/${REPO}/issues --jq '[.[] | select(.state=="open") | "- #\\(.number) [\\(.labels | map(.name) | join(","))] \\(.title)"] | join("\\n")'`
);
const blockers = run(
  `gh api repos/${REPO}/issues --jq '[.[] | select(.state=="open" and (.labels | map(.name) | any(. == "blocker" or . == "p0"))) | "- #\\(.number) \\(.title)"] | join("\\n")'`
) || '(nenhum)';
// ── 3. Milestones ──────────────────────────────────────────────────────────
const milestones = run(
  `gh api repos/${REPO}/milestones --jq '[.[] | "- \\(.title): \\(.closed_issues)/\\(.closed_issues + .open_issues) fechadas"] | join("\\n")'`
) || '(nenhum)';
// ── 4. PRs abertos ─────────────────────────────────────────────────────────
const openPRs = run(
  `gh api repos/${REPO}/pulls --jq '[.[] | select(.state=="open") | "- #\\(.number) \\(.title)"] | join("\\n")'`
) || '(nenhum)';
// ── 5. Último deploy Firebase ──────────────────────────────────────────────
const lastDeploy = run(
  `gh api repos/${REPO}/actions/runs --jq '[.workflow_runs[] | select(.name | test("deploy|firebase";"i")) | "\\(.status) \\(.conclusion // "running") \\(.created_at[:16])"] | first'`
) || '(não encontrado)';
// ── 6. Auto-memory existente ───────────────────────────────────────────────
const prevStatus = fs.existsSync(path.join(ROOT, '.auto-memory', 'project_mf_status.md'))
  ? fs.readFileSync(path.join(ROOT, '.auto-memory', 'project_mf_status.md'), 'utf8').slice(0, 600) + '\n…'
  : '(ausente)';
// ── Montar handoff ─────────────────────────────────────────────────────────
const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
const handoff = `# PO Handoff — Minhas Finanças
Gerado: ${now} | Script: scripts/po-diagnostic.js
Destinatários: **Dev Manager (DM)** · **PM Agent**
${section('Git', `Branch: ${branch}\nÚltimo commit: ${lastCommit}\nAlterações staged/unstaged:\n${dirtyFiles}`)}
${section('Issues Abertas', openIssues || '(nenhuma)')}
${section('Blockers / P0', blockers)}
${section('Milestones', milestones)}
${section('Pull Requests Abertos', openPRs)}
${section('Último Deploy Firebase', lastDeploy)}
${section('Estado Anterior (.auto-memory)', prevStatus)}
---
> **DM:** priorize blockers e PRs pendentes antes de iniciar novas tasks.
> **PM:** use milestone % e último deploy como baseline do relatório diário.
`;
fs.mkdirSync(path.join(ROOT, '.auto-memory'), { recursive: true });
fs.writeFileSync(OUTPUT, handoff, 'utf8');
console.log(`✅ po-handoff.md gerado em .auto-memory/`);
console.log(`Branch:   ${branch}`);
console.log(`Commit:   ${lastCommit}`);
console.log(`Blockers: ${blockers === '(nenhum)' ? 0 : blockers.split('\n').length}`);
console.log(`PRs:      ${openPRs === '(nenhum)' ? 0 : openPRs.split('\n').length} aberto(s)`);
