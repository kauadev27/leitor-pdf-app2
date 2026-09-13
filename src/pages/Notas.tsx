import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, BookOpen, ChevronDown, ExternalLink, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Plus, PanelRightClose, PanelRightOpen, Bold, Sparkles, Trash2, Pencil,
} from "lucide-react";
import { db, type Anotacao, type Citacao, type Livro, type TrechoNota } from "@/lib/db";

type Fonte = (Anotacao & { tipo: "anotacao"; texto: string }) | (Citacao & { tipo: "citacao"; texto: string });

const comandos = [
  { nome: "Título 1", prefixo: "# ", icone: Heading1 },
  { nome: "Título 2", prefixo: "## ", icone: Heading2 },
  { nome: "Título 3", prefixo: "### ", icone: Heading3 },
  { nome: "Citação", prefixo: "> ", icone: Quote },
  { nome: "Lista", prefixo: "- ", icone: List },
  { nome: "Lista numerada", prefixo: "1. ", icone: ListOrdered },
  { nome: "Negrito", prefixo: "**", sufixo: "**", icone: Bold },
];

function progresso(livro: Livro) {
  if (livro.concluido) return 100;
  if (livro.totalPaginas <= 1) return 0;
  return Math.min(100, Math.round(((livro.paginaAtual - 1) / (livro.totalPaginas - 1)) * 100));
}

function horario(data: Date) {
  return new Date(data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function CapaLivro({ livro }: { livro: Livro }) {
  return livro.capa ? <img src={livro.capa} alt="" className="w-9 h-12 rounded object-cover" /> : <div className="w-9 h-12 rounded bg-terracota/15 flex items-center justify-center"><BookOpen size={16} className="text-terracota" /></div>;
}

function QuoteCard({ trecho, onComentario, onIrParaPagina, onDelete }: { trecho: TrechoNota; onComentario: (valor: string) => void; onIrParaPagina: () => void; onDelete: () => void }) {
  return (
    <article className="rounded-xl border border-terracota/25 bg-[#fff5f2] dark:bg-[#332625] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-terracota/15">
        <span className="text-[11px] uppercase tracking-wide font-semibold text-terracota">Trecho destacado · pág. {trecho.pagina}</span>
        <div className="flex items-center gap-2"><button onClick={onDelete} title="Excluir trecho da nota" className="text-muted hover:text-red-600"><Trash2 size={13} /></button><button onClick={onIrParaPagina} className="btn-ghost px-2 py-1 text-xs flex items-center gap-1"><ExternalLink size={12} /> Ir para a página</button></div>
      </div>
      <blockquote className="px-5 py-4 border-l-4 border-terracota/40 ml-4 my-4 font-reading italic text-[15px] leading-relaxed text-ink dark:text-ink-dark">
        “{trecho.texto}”
      </blockquote>
      <div className="mx-4 mb-4 rounded-lg border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/10">
        <p className="px-3 py-2 text-[10px] uppercase tracking-wide font-semibold text-muted border-b border-black/5 dark:border-white/5">Minha reflexão</p>
        <textarea value={trecho.comentario} onChange={(e) => onComentario(e.target.value)} placeholder="Escreva sua reflexão sobre este trecho..." className="w-full min-h-20 resize-y bg-transparent px-3 py-2 text-sm outline-none" />
      </div>
    </article>
  );
}

export default function Notas() {
  const navigate = useNavigate();
  const livros = useLiveQuery(() => db.livros.filter((livro) => !livro.excluidoEm).toArray(), []) ?? [];
  const blocos = useLiveQuery(() => db.blocosNotas.toArray(), []) ?? [];
  const anotacoes = useLiveQuery(() => db.anotacoes.toArray(), []) ?? [];
  const citacoes = useLiveQuery(() => db.citacoes.toArray(), []) ?? [];
  const trechos = useLiveQuery(() => db.trechosNotas.toArray(), []) ?? [];
  const [livroId, setLivroId] = useState<number | null>(null);
  const [blocoId, setBlocoId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [menuComandos, setMenuComandos] = useState(false);
  const [filtroLivro, setFiltroLivro] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const livro = livros.find((item) => item.id === livroId);
  const bloco = blocos.find((item) => item.id === blocoId);
  const blocosVisiveis = blocos.filter((item) => item.livroId === livroId || (!livroId && !item.livroId));
  const fontes: Fonte[] = useMemo(() => [
    ...anotacoes.filter((item) => item.livroId === livroId).map((item) => ({ ...item, tipo: "anotacao" as const, texto: item.trechoTexto || item.comentario || "Anotação sem trecho" })),
    ...citacoes.filter((item) => item.livroId === livroId).map((item) => ({ ...item, tipo: "citacao" as const, texto: item.textoCitado })),
  ].sort((a, b) => a.pagina - b.pagina), [anotacoes, citacoes, livroId]);
  const fontesFiltradas = fontes.filter((item) => item.texto.toLowerCase().includes(filtroLivro.toLowerCase()));
  const trechosDoBloco = trechos.filter((item) => item.blocoId === blocoId);

  useEffect(() => {
    if (bloco) {
      setTitulo(bloco.titulo);
      setConteudo(bloco.conteudo);
      if (editorRef.current && editorRef.current.innerHTML !== bloco.conteudo) {
        editorRef.current.innerHTML = bloco.conteudo;
      }
    }
  }, [bloco?.id]);

  async function criarBloco(vinculo?: number) {
    const novoId = await db.blocosNotas.add({ livroId: vinculo, titulo: vinculo ? "Nova nota do livro" : "Nova nota", conteudo: "", dataAtualizacao: new Date() });
    setLivroId(vinculo ?? null);
    setBlocoId(novoId);
  }

  async function salvarBloco(campo: "titulo" | "conteudo", valor: string) {
    if (blocoId) await db.blocosNotas.update(blocoId, { [campo]: valor, dataAtualizacao: new Date() });
  }

  async function excluirBloco(id: number) {
    if (!window.confirm("Excluir este bloco de notas e seus trechos vinculados?")) return;
    await db.trechosNotas.where("blocoId").equals(id).delete();
    await db.blocosNotas.delete(id);
    setBlocoId(null);
    setTitulo("");
    setConteudo("");
  }

  async function inserirTrecho(fonte: Fonte) {
    if (!blocoId || !livroId) return;
    if (trechosDoBloco.some((item) => item.pagina === fonte.pagina && item.texto === fonte.texto)) return;
    await db.trechosNotas.add({ blocoId, livroId, pagina: fonte.pagina, texto: fonte.texto, comentario: "", dataCriacao: new Date() });
  }

  async function atualizarTrecho(id: number, comentario: string) {
    await db.trechosNotas.update(id, { comentario });
  }

  async function excluirTrecho(id: number) {
    if (!window.confirm("Remover este trecho da nota?")) return;
    await db.trechosNotas.delete(id);
  }

  function aplicarComando(nome: string) {
    const editor = document.querySelector<HTMLElement>("[data-notes-editor]");
    editor?.focus();
    if (nome === "h1" || nome === "h2" || nome === "h3") document.execCommand("formatBlock", false, nome.toUpperCase());
    if (nome === "quote") document.execCommand("formatBlock", false, "BLOCKQUOTE");
    if (nome === "ul") document.execCommand("insertUnorderedList");
    if (nome === "ol") document.execCommand("insertOrderedList");
    if (nome === "bold") document.execCommand("bold");
    salvarEditor(editor);
    setMenuComandos(false);
  }

  async function salvarEditor(editor: HTMLElement | null) {
    if (!editor) return;
    const html = editor.innerHTML;
    setConteudo(html);
    await salvarBloco("conteudo", html);
  }

  function alterarConteudo(editor: HTMLElement) {
    const texto = editor.innerText;
    const linha = texto.split("\n").pop()?.trim().toLowerCase() ?? "";
    const comandoSlash = linha.match(/^\/(h1|h2|h3|quote|ul|ol|bold)$/);
    if (comandoSlash) {
      const nome = comandoSlash[1];
      const selecao = window.getSelection();
      const range = document.createRange();
      const ultimoTexto = editor.lastChild;
      if (ultimoTexto?.nodeType === Node.TEXT_NODE) {
        range.setStart(ultimoTexto, Math.max(0, ultimoTexto.textContent!.length - linha.length));
        range.setEnd(ultimoTexto, ultimoTexto.textContent!.length);
        selecao?.removeAllRanges();
        selecao?.addRange(range);
      }
      document.execCommand("delete");
      aplicarComando(nome);
      return;
    }
    void salvarEditor(editor);
    setMenuComandos(linha.startsWith("/") && linha.length < 20);
  }

  if (!livroId && !blocoId) {
    return (
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold">Notas dos livros</h1><p className="text-sm text-muted mt-1">Anotações, citações e blocos pessoais em um só lugar.</p></div><button onClick={() => void criarBloco()} className="btn-primary flex items-center gap-2"><Plus size={16} /> Criar nova nota</button></header>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {livros.map((item) => <button key={item.id} onClick={() => { setLivroId(item.id!); setDrawerAberto(true); }} className="card p-4 text-left hover:border-terracota/40"><div className="flex gap-3"><CapaLivro livro={item} /><div className="min-w-0 flex-1"><p className="font-semibold truncate">{item.titulo}</p><div className="mt-2 h-1 rounded bg-black/5 dark:bg-white/10"><div className="h-full bg-terracota rounded" style={{ width: `${progresso(item)}%` }} /></div><p className="text-xs text-muted mt-1">{progresso(item)}% · {item.totalPaginas || "?"} páginas</p></div></div></button>)}
        </div>
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div><h2 className="text-lg font-bold">Minhas notas</h2><p className="text-sm text-muted">Blocos pessoais e pensamentos livres.</p></div>
            <button onClick={() => void criarBloco()} className="btn-ghost flex items-center gap-2"><Plus size={15} /> Nova nota</button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {blocos.filter((item) => !item.livroId).map((item) => <div key={item.id} className="card p-4 flex items-start gap-3"><button onClick={() => { setBlocoId(item.id!); setLivroId(null); }} className="text-left min-w-0 flex-1"><p className="font-semibold truncate">{item.titulo || "Sem título"}</p><p className="text-xs text-muted mt-1">{new Date(item.dataAtualizacao).toLocaleDateString("pt-BR")}</p><p className="text-sm text-muted mt-3 line-clamp-2">{item.conteudo.replace(/<[^>]+>/g, " ").trim() || "Nota vazia"}</p></button><button onClick={() => void excluirBloco(item.id!)} title="Excluir nota" className="text-muted hover:text-red-600 p-1"><Trash2 size={15} /></button></div>)}
            {blocos.filter((item) => !item.livroId).length === 0 && <p className="text-sm text-muted">Nenhuma nota pessoal criada ainda.</p>}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex h-full -m-8 bg-cream dark:bg-charcoal">
      <aside className="w-60 shrink-0 border-r border-black/5 dark:border-white/5 p-5 overflow-y-auto">
        <button onClick={() => { setLivroId(null); setBlocoId(null); }} className="flex items-center gap-1 text-sm text-muted hover:text-terracota mb-6"><ArrowLeft size={15} /> Notas dos livros</button>
        <p className="text-xs font-semibold tracking-wide text-muted mb-3">{livro?.titulo || "NOTA PESSOAL"}</p>
        {blocosVisiveis.map((item) => <div key={item.id} className={`flex items-center gap-1 rounded-lg mb-1 ${item.id === blocoId ? "bg-terracota/10 text-terracota" : "hover:bg-black/5 dark:hover:bg-white/5"}`}><button onClick={() => setBlocoId(item.id!)} className="min-w-0 flex-1 text-left px-3 py-2"><p className="text-sm truncate">{item.titulo}</p><p className="text-xs text-muted">{item.livroId ? "Nota do livro" : "Nota pessoal"}</p></button><button onClick={() => void excluirBloco(item.id!)} title="Excluir bloco" className="p-2 text-muted hover:text-red-600"><Trash2 size={14} /></button></div>)}
        <button onClick={() => void criarBloco(livroId ?? undefined)} className="text-left text-sm text-terracota px-3 py-2"><Plus size={14} className="inline" /> Novo bloco</button>
      </aside>
      <main className="flex-1 min-w-0 overflow-y-auto">
        <header className="border-b border-black/5 dark:border-white/5 px-8 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1"><div className="relative max-w-sm"><select value={livroId ?? ""} onChange={(e) => { const id = Number(e.target.value) || null; setLivroId(id); setBlocoId(null); }} className="appearance-none w-full rounded-lg border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 pl-3 pr-8 py-2 text-sm"><option value="">Nota pessoal</option>{livros.map((item) => <option key={item.id} value={item.id}>{item.titulo} · {progresso(item)}%</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" /></div><p className="text-xs text-muted mt-2">{livro ? `${livro.titulo} · ${progresso(livro)}% lido` : "Bloco livre para metas e pensamentos"}</p></div>
          <button onClick={() => setDrawerAberto((aberto) => !aberto)} className="btn-ghost flex items-center gap-2 shrink-0">{drawerAberto ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />} Trechos do livro</button>
        </header>
        {bloco ? <><section className="px-8 py-5 border-b border-black/5 dark:border-white/5"><div className="flex items-center gap-2"><input value={titulo} onChange={(e) => setTitulo(e.target.value)} onBlur={() => void salvarBloco("titulo", titulo)} className="text-xl font-bold bg-transparent outline-none w-full" /><button onClick={() => void excluirBloco(bloco.id!)} title="Excluir nota" className="btn-ghost p-2 text-red-600"><Trash2 size={15} /></button></div><p className="text-xs text-muted mt-1">{livro?.titulo || "Nota pessoal"} · Editado agora</p></section><section className="max-w-3xl px-8 py-6 space-y-5"><div className="flex flex-wrap gap-1">{comandos.map((comando) => { const Icone = comando.icone; return <button key={comando.nome} onClick={() => aplicarComando(comando.nome === "Título 1" ? "h1" : comando.nome === "Título 2" ? "h2" : comando.nome === "Título 3" ? "h3" : comando.nome === "Citação" ? "quote" : comando.nome === "Lista" ? "ul" : comando.nome === "Lista numerada" ? "ol" : "bold")} title={comando.nome} className="btn-ghost p-2"><Icone size={15} /></button>; })}</div><div className="relative"><div ref={editorRef} data-notes-editor contentEditable suppressContentEditableWarning onInput={(e) => alterarConteudo(e.currentTarget)} data-placeholder="Escreva ou digite /h1, /h2, /lista..." className="notes-editor w-full min-h-44 bg-transparent outline-none font-reading text-[15px] leading-relaxed resize-y" />{menuComandos && <div className="absolute top-10 left-0 z-20 card w-60 p-2 shadow-lg">{comandos.map((comando) => { const Icone = comando.icone; const nome = comando.nome === "Título 1" ? "h1" : comando.nome === "Título 2" ? "h2" : comando.nome === "Título 3" ? "h3" : comando.nome === "Citação" ? "quote" : comando.nome === "Lista" ? "ul" : comando.nome === "Lista numerada" ? "ol" : "bold"; return <button key={comando.nome} onClick={() => aplicarComando(nome)} className="flex items-center gap-2 w-full text-left px-3 py-2 rounded hover:bg-terracota/10 text-sm"><Icone size={15} /> {comando.nome}</button>; })}</div>}</div>{trechosDoBloco.map((trecho) => <QuoteCard key={trecho.id} trecho={trecho} onComentario={(valor) => void atualizarTrecho(trecho.id!, valor)} onDelete={() => void excluirTrecho(trecho.id!)} onIrParaPagina={() => navigate(`/livro/${trecho.livroId}?pagina=${trecho.pagina}`)} />)}</section></> : <div className="p-8 text-sm text-muted">Crie ou selecione um bloco para começar.</div>}
      </main>
      {drawerAberto && livro && <aside className="w-80 shrink-0 border-l border-black/5 dark:border-white/5 bg-[#fbf7f1] dark:bg-[#242220] p-4 overflow-y-auto"><div className="flex items-center justify-between mb-4"><div><p className="font-semibold text-sm">Trechos destacados</p><p className="text-xs text-muted">{livro.titulo}</p></div><Sparkles size={16} className="text-terracota" /></div><input value={filtroLivro} onChange={(e) => setFiltroLivro(e.target.value)} placeholder="Buscar trecho..." className="w-full mb-3 rounded-lg border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-2 text-xs outline-none" />{fontesFiltradas.length === 0 && <p className="text-sm text-muted py-5">Nenhum grifo ou citação deste livro ainda.</p>}{fontesFiltradas.map((fonte) => { const inserido = trechosDoBloco.some((item) => item.pagina === fonte.pagina && item.texto === fonte.texto); return <div key={`${fonte.tipo}-${fonte.id}`} className="rounded-lg border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3 mb-3"><p className="text-[10px] uppercase tracking-wide text-muted mb-2">Pág. {fonte.pagina}</p><p className="font-reading text-sm leading-relaxed line-clamp-4">{fonte.texto}</p><button disabled={inserido || !blocoId} onClick={() => void inserirTrecho(fonte)} className="w-full mt-3 btn-ghost text-xs disabled:opacity-50">{inserido ? "✓ Inserido" : "+ Inserir na nota"}</button></div>; })}</aside>}
    </div>
  );
}
