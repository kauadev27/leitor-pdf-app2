# Leitura — Leitor de PDF pessoal

Leitor pessoal de PDFs offline-first, seguindo o design aprovado no Figma
(sidebar com Biblioteca / Progresso / Notas, tela de leitura em tela cheia,
cronômetro, marcador de página, destaques, citações e blocos de notas).

**Status atual:** o fluxo principal do leitor está funcional. A tela de Notas
foi refatorada para um sistema estilo Notion, com notas pessoais e notas
vinculadas a livros, cards de citações/reflexões, painel lateral de trechos
destacados e editor visual com títulos, listas, citações e negrito.

## Stack

- **React + TypeScript + Vite**
- **Tailwind CSS** — cores e tipografia do design já configuradas em `tailwind.config.js`
- **pdf.js** (`pdfjs-dist`) — renderização do PDF, 100% no navegador/dispositivo
- **Dexie.js** (IndexedDB) — armazenamento local dos livros, anotações, citações, notas e sessões de leitura (offline-first)
- **react-router-dom** — navegação entre telas
- **vite-plugin-pwa** — transforma o app num PWA instalável, com cache do "app shell" para abrir offline

## Como rodar

```bash
npm install
npm run dev
```

Abra http://localhost:5173 — clique no "+" da Biblioteca para importar um PDF do seu computador.

## Estrutura

```
src/
  components/
    Sidebar.tsx        # navegação lateral (Biblioteca / Progresso / Notas)
  pages/
    Biblioteca.tsx      # estante de livros, busca, filtros, importar PDF
    Leitura.tsx          # leitura: pdf.js, timer, zoom, tela cheia e navegação
    Progresso.tsx        # estatísticas e gráfico de minutos lidos por dia
    Notas.tsx            # notas pessoais/livros, editor visual e drawer de grifos
  lib/
    db.ts                # schema IndexedDB (Dexie) — livros, anotações, citações,
                         # marcadores, blocos, trechos vinculados e sessões
  styles/
    index.css            # Tailwind + classes utilitárias (card, btn-primary, nav-item...)
```

## O que já funciona atualmente

- Importar um PDF e ele aparecer na Biblioteca.
- Gerar automaticamente a capa a partir da primeira página do PDF.
- Enviar, editar/substituir e apagar manualmente a capa de um livro.
- Abrir o livro e navegar entre páginas (renderizado com pdf.js).
- Navegar por setas/teclas de página e rolar suavemente dentro da página,
  avançando apenas ao chegar ao início ou ao fim.
- Zoom ajustável, modo tela cheia e modo escuro na tela de leitura.
- Timer com iniciar/pausar e metas de leitura de 5, 10, 15, 25 e 45 minutos.
- "Você parou na página X — Continuar" ao reabrir um livro.
- Marcar página (bookmark) salvo no banco local.
- Decidir manualmente quando um livro foi concluído ou reabri-lo.
- Progresso calculado por página e estatísticas de sessões de leitura.
- Lixeira com retenção de 30 dias, restauração e exclusão permanente confirmada.
- Modo escuro (toggle na sidebar).
- Tudo funciona offline: os PDFs e os dados ficam salvos no IndexedDB do navegador.

## Histórico de atualizações / últimas alterações

- Refatoração completa da tela de Notas para layout de três áreas: lista de
  blocos, editor principal e drawer lateral de trechos do livro.
- Criação de notas pessoais independentes ou notas vinculadas a um livro.
- Seleção de livro no editor com capa, título e percentual de progresso.
- Cards de citação persistentes com página, texto original, reflexão editável
  e botão para abrir o leitor diretamente na página correspondente.
- Integração entre leitura e Notas: anotações e citações guardam livro, página,
  data e horário.
- Editor visual estilo Notion com H1, H2, H3, citação, listas, listas
  numeradas, negrito e comandos iniciados por `/`.
- Ações de editar e excluir blocos, notas pessoais e trechos vinculados.
- Migrações Dexie até a versão 3, incluindo a tabela `trechosNotas`.

## Próximos passos / roadmap

- [ ] Implementar a text layer do pdf.js para selecionar texto diretamente no
  documento e criar grifos/citações sem digitação manual.
- [ ] Permitir editar e excluir anotações e citações originais na tela de
  leitura, além dos cards já vinculados às notas.
- [ ] Renderizar o conteúdo HTML salvo no editor com visualização rica e
  sanitização antes de exibir conteúdo persistido.
- [ ] Adicionar drag and drop dos trechos do drawer para dentro do fluxo da
  nota.
- [ ] Criar busca global por livros, notas, citações e páginas.
- [ ] Adicionar capítulos/metadados do PDF aos cards de citação quando
  disponíveis.
- [ ] Criar metas persistentes por dia e histórico de sequência de leitura.
- [ ] Adicionar testes automatizados para migrações Dexie, lixeira, progresso,
  editor e integração entre leitura e notas.
- [ ] Empacotar para desktop com Tauri (ou Electron) para Windows, macOS e
  Linux.
- [ ] Adicionar `public/icon-192.png` e `public/icon-512.png` ao PWA.
