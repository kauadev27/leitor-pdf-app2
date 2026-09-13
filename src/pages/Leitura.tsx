import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { ChevronLeft, Clock, Bookmark, Pencil, Quote, StickyNote, Maximize, Minimize, Moon, Sun, Timer, Play, Pause, CheckCircle, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { db } from "@/lib/db";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const METAS = [5, 10, 15, 25, 45];

export default function Leitura() {
  const { id } = useParams();
  const livroId = Number(id);
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const areaLeituraRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const sessaoIniciadaEm = useRef<Date>(new Date());
  const segundosRef = useRef(0);
  const [livroConcluido, setLivroConcluido] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [mostrarContinuar, setMostrarContinuar] = useState(false);
  const [paginaSalva, setPaginaSalva] = useState(1);
  const [segundosSessao, setSegundosSessao] = useState(0);
  const [metaMinutos, setMetaMinutos] = useState(10);
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [modoEscuro, setModoEscuro] = useState(() => localStorage.getItem("leitura-dark-mode") === "true");
  const [telaCheia, setTelaCheia] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const paginaInicial = Number(new URLSearchParams(window.location.search).get("pagina"));
    (async () => {
      const livro = await db.livros.get(livroId);
      if (!livro) return;
      setLivroConcluido(livro.concluido);
      if (livro.paginaAtual > 1 && !livro.concluido) {
        setPaginaSalva(livro.paginaAtual);
        setMostrarContinuar(true);
      }
      const doc = await pdfjsLib.getDocument({ data: await livro.arquivoPdf.arrayBuffer() }).promise;
      if (cancelado) return;
      pdfDocRef.current = doc;
      setTotalPaginas(doc.numPages);
      setPagina(paginaInicial > 0 ? paginaInicial : livro.paginaAtual || 1);
      if (!livro.totalPaginas) await db.livros.update(livroId, { totalPaginas: doc.numPages });
    })();
    return () => { cancelado = true; };
  }, [livroId]);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const doc = pdfDocRef.current;
      const canvas = canvasRef.current;
      if (!doc || !canvas) return;
      const page = await doc.getPage(pagina);
      const viewport = page.getViewport({ scale: (telaCheia ? 1.7 : 1.4) * zoom });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
      if (cancelado) return;
      await db.livros.update(livroId, { paginaAtual: pagina });
    })();
    return () => { cancelado = true; };
  }, [pagina, livroId, totalPaginas, telaCheia, zoom]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      if (!timerAtivo) return;
      setSegundosSessao((s) => {
        segundosRef.current = s + 1;
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(intervalo);
  }, [timerAtivo]);

  const salvarSessao = useCallback(async () => {
    if (segundosRef.current === 0) return;
    const duracao = segundosRef.current;
    segundosRef.current = 0;
    await db.sessoesLeitura.add({ livroId, inicio: sessaoIniciadaEm.current, fim: new Date(), duracaoSegundos: duracao });
    const livro = await db.livros.get(livroId);
    if (livro) await db.livros.update(livroId, { tempoTotalLeituraSegundos: livro.tempoTotalLeituraSegundos + duracao });
  }, [livroId]);

  useEffect(() => () => { void salvarSessao(); }, [salvarSessao]);

  useEffect(() => {
    function navegar(tecla: KeyboardEvent) {
      if (tecla.key === "ArrowRight" || tecla.key === "PageDown") setPagina((p) => Math.min(totalPaginas || p, p + 1));
      if (tecla.key === "ArrowLeft" || tecla.key === "PageUp") setPagina((p) => Math.max(1, p - 1));
      if (tecla.key === "Escape" && document.fullscreenElement) void document.exitFullscreen();
    }
    window.addEventListener("keydown", navegar);
    return () => window.removeEventListener("keydown", navegar);
  }, [totalPaginas]);

  function navegarScroll(e: React.WheelEvent<HTMLDivElement>) {
    const area = areaLeituraRef.current;
    if (!area || Math.abs(e.deltaY) < 8) return;
    const chegouAoFim = area.scrollTop + area.clientHeight >= area.scrollHeight - 4;
    const chegouAoInicio = area.scrollTop <= 4;
    if (e.deltaY > 0 && chegouAoFim && pagina < totalPaginas) {
      e.preventDefault();
      setPagina((p) => Math.min(totalPaginas, p + 1));
      requestAnimationFrame(() => { if (areaLeituraRef.current) areaLeituraRef.current.scrollTop = 0; });
    } else if (e.deltaY < 0 && chegouAoInicio && pagina > 1) {
      e.preventDefault();
      setPagina((p) => Math.max(1, p - 1));
      requestAnimationFrame(() => { if (areaLeituraRef.current) areaLeituraRef.current.scrollTop = areaLeituraRef.current.scrollHeight; });
    }
  }

  async function alternarTelaCheia() {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
    setTelaCheia(Boolean(document.fullscreenElement));
  }

  function alternarTema() {
    setModoEscuro((atual) => {
      const novo = !atual;
      document.documentElement.classList.toggle("dark", novo);
      localStorage.setItem("leitura-dark-mode", String(novo));
      return novo;
    });
  }

  function formatarTempo(s: number) {
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  }

  async function alternarConclusao() {
    const novoValor = !livroConcluido;
    await db.livros.update(livroId, { concluido: novoValor });
    setLivroConcluido(novoValor);
  }

  async function marcarPagina() {
    await db.marcadores.add({ livroId, pagina, dataCriacao: new Date() });
  }

  async function adicionarAnotacao() {
    const trechoTexto = window.prompt("Digite ou cole o trecho grifado desta página:");
    if (!trechoTexto?.trim()) return;
    const comentario = window.prompt("Escreva sua reflexão sobre este trecho:") || "";
    await db.anotacoes.add({ livroId, pagina, trechoTexto: trechoTexto.trim(), cor: "yellow", comentario: comentario.trim(), dataCriacao: new Date() });
  }

  async function adicionarCitacao() {
    const texto = window.prompt("Digite ou cole a citação desta página:");
    if (!texto?.trim()) return;
    await db.citacoes.add({ livroId, pagina, textoCitado: texto.trim(), dataCriacao: new Date() });
  }

  return (
    <div className={`h-screen flex flex-col ${modoEscuro ? "bg-charcoal" : "bg-cream"}`}>
      <header className="flex items-center justify-between px-5 py-3 border-b border-black/5 dark:border-white/5">
        <button onClick={() => { void salvarSessao(); navigate("/"); }} className="flex items-center gap-1 text-sm text-muted hover:text-ink dark:hover:text-ink-dark"><ChevronLeft size={16} /> Biblioteca</button>
        <span className="text-xs text-muted">p. {pagina} / {totalPaginas || "?"}</span>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1"><Clock size={13} /> {formatarTempo(segundosSessao)}</span>
          <button onClick={() => setTimerAtivo((ativo) => !ativo)} title={timerAtivo ? "Pausar timer" : "Começar timer"}>{timerAtivo ? <Pause size={15} /> : <Play size={15} />}</button>
          <span className="hidden sm:inline">Meta: {metaMinutos} min ({Math.min(100, Math.round((segundosSessao / (metaMinutos * 60)) * 100))}%)</span>
          <select value={metaMinutos} onChange={(e) => setMetaMinutos(Number(e.target.value))} className="bg-transparent text-xs outline-none"><option value={5}>5 min</option>{METAS.slice(1).map((meta) => <option key={meta} value={meta}>{meta} min</option>)}</select>
          <button onClick={() => setZoom((valor) => Math.min(2, Number((valor + 0.1).toFixed(1))))} title="Aumentar zoom"><ZoomIn size={15} /></button>
          <button onClick={() => setZoom((valor) => Math.max(0.7, Number((valor - 0.1).toFixed(1))))} title="Diminuir zoom"><ZoomOut size={15} /></button>
          <button onClick={() => setZoom(1)} title="Restaurar zoom"><RotateCcw size={14} /></button>
          <span className="text-[11px] w-8 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={alternarTema} title="Alternar modo escuro">{modoEscuro ? <Sun size={15} /> : <Moon size={15} />}</button>
          <button onClick={() => void alternarTelaCheia()} title="Tela cheia">{telaCheia ? <Minimize size={15} /> : <Maximize size={15} />}</button>
          <Bookmark size={15} />
        </div>
      </header>
      {mostrarContinuar && <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 card px-4 py-2 flex items-center gap-3"><span className="text-sm">Você parou na página {paginaSalva} —</span><button onClick={() => { setPagina(paginaSalva); setMostrarContinuar(false); }} className="btn-primary py-1 px-3">Continuar</button><button onClick={() => setMostrarContinuar(false)} className="text-muted text-sm">×</button></div>}
      <div ref={areaLeituraRef} onWheel={navegarScroll} className="flex-1 overflow-auto flex justify-center items-start py-6 scroll-smooth"><canvas ref={canvasRef} className="shadow-md bg-white max-w-[95vw] h-fit" /></div>
      <footer className="border-t border-black/5 dark:border-white/5 px-5 py-3">
        <div className="max-w-xl mx-auto mb-3"><p className="text-center text-xs text-muted mb-1">{pagina} de {totalPaginas || "?"}</p><input type="range" min={1} max={totalPaginas || 1} value={pagina} onChange={(e) => setPagina(Number(e.target.value))} className="w-full accent-terracota" /></div>
        <div className="flex items-center justify-center gap-8 text-xs text-muted"><button onClick={() => void adicionarAnotacao()} className="flex flex-col items-center gap-1 hover:text-terracota"><Pencil size={18} /> Anotar</button><button onClick={() => void adicionarCitacao()} className="flex flex-col items-center gap-1 hover:text-terracota"><Quote size={18} /> Citação</button><button onClick={() => void adicionarAnotacao()} className="flex flex-col items-center gap-1 hover:text-terracota"><StickyNote size={18} /> Nota</button><button onClick={marcarPagina} className="flex flex-col items-center gap-1 hover:text-terracota"><Bookmark size={18} /> Marcar</button><button onClick={() => void alternarConclusao()} className={`flex flex-col items-center gap-1 ${livroConcluido ? "text-sage" : "text-terracota"}`}><CheckCircle size={18} /> {livroConcluido ? "Reabrir livro" : "Terminei"}</button><span className="flex flex-col items-center gap-1 text-terracota"><Timer size={18} /> Meta ativa</span></div>
      </footer>
    </div>
  );
}
