import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Check, Trash2, RotateCcw, Upload, Pencil, X } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { db } from "@/lib/db";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

type Filtro = "todos" | "lendo" | "concluidos" | "lixeira";
const TRINTA_DIAS = 30 * 24 * 60 * 60 * 1000;

async function gerarCapa(arquivo: Blob): Promise<string> {
  const doc = await pdfjsLib.getDocument({ data: await arquivo.arrayBuffer() }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 0.45 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.82);
}

export default function Biblioteca() {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [abrirLixeira, setAbrirLixeira] = useState(false);
  const [confirmacao, setConfirmacao] = useState<"livro" | "lixeira" | null>(null);
  const [livroParaExcluir, setLivroParaExcluir] = useState<number | null>(null);
  const coverInputs = useRef<Record<number, HTMLInputElement | null>>({});
  const navigate = useNavigate();
  const livros = useLiveQuery(() => db.livros.toArray(), []) ?? [];

  useEffect(() => {
    const limite = Date.now() - TRINTA_DIAS;
    db.livros.where("excluidoEm").below(new Date(limite)).delete();
  }, []);

  useEffect(() => {
    const livrosSemCapa = livros.filter((livro) => !livro.excluidoEm && !livro.capa);
    livrosSemCapa.forEach((livro) => {
      gerarCapa(livro.arquivoPdf)
        .then((capa) => db.livros.update(livro.id!, { capa }))
        .catch((error) => console.error("Não foi possível gerar a capa do livro.", error));
    });
  }, [livros]);

  const ativos = livros.filter((l) => !l.excluidoEm);
  const lixeira = livros.filter((l) => l.excluidoEm);
  const livrosFiltrados = (filtro === "lixeira" ? lixeira : ativos)
    .filter((l) => l.titulo.toLowerCase().includes(busca.toLowerCase()))
    .filter((l) => {
      if (filtro === "lendo") return !l.concluido;
      if (filtro === "concluidos") return l.concluido;
      return true;
    });

  async function importarPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = await db.livros.add({
      titulo: file.name.replace(/\.pdf$/i, ""),
      arquivoPdf: file,
      paginaAtual: 1,
      totalPaginas: 0,
      tempoTotalLeituraSegundos: 0,
      dataImportacao: new Date(),
      concluido: false,
    });
    try {
      const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      await db.livros.update(id, { totalPaginas: doc.numPages, capa: await gerarCapa(file) });
    } catch (error) {
      console.error("Não foi possível gerar a capa do PDF.", error);
    }
    e.target.value = "";
  }

  async function alterarCapa(livroId: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const capa = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    await db.livros.update(livroId, { capa });
    e.target.value = "";
  }

  async function removerCapa(livroId: number) {
    await db.livros.update(livroId, { capa: undefined });
  }

  async function moverParaLixeira(id: number) {
    await db.livros.update(id, { excluidoEm: new Date() });
  }

  async function restaurar(id: number) {
    await db.livros.update(id, { excluidoEm: undefined });
  }

  async function esvaziarLixeira() {
    await Promise.all(lixeira.map((livro) => db.livros.delete(livro.id!)));
    setConfirmacao(null);
  }

  async function excluirPermanentemente() {
    if (livroParaExcluir === null) return;
    await db.livros.delete(livroParaExcluir);
    setLivroParaExcluir(null);
    setConfirmacao(null);
  }

  const concluidosCount = ativos.filter((l) => l.concluido).length;

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Minha Biblioteca</h1>
          <p className="text-sm text-muted mt-1">{ativos.length} livros · {concluidosCount} concluídos</p>
        </div>
      </header>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por título ou autor..."
          className="w-full pl-9 pr-4 py-2.5 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-[#242220] text-sm outline-none focus:ring-2 focus:ring-terracota/40" />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          ["todos", "Todos"], ["lendo", "Lendo agora"], ["concluidos", "Concluídos"],
          ["lixeira", `Lixeira${lixeira.length ? ` (${lixeira.length})` : ""}`],
        ] as [Filtro, string][]).map(([valor, label]) => (
          <button key={valor} onClick={() => { setFiltro(valor); setAbrirLixeira(valor === "lixeira"); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filtro === valor ? "bg-terracota text-white" : "btn-ghost"}`}>
            {label}
          </button>
        ))}
      </div>

      {abrirLixeira && (
        <div className="card p-4 mb-4 flex items-center justify-between gap-4">
          <p className="text-sm text-muted">Os livros permanecem por 30 dias. Use o X para excluir um livro permanentemente.</p>
          {lixeira.length > 0 && <button onClick={() => setConfirmacao("lixeira")} className="btn-ghost text-red-600 shrink-0"><Trash2 size={15} /> Esvaziar lixeira</button>}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        {livrosFiltrados.map((livro) => {
          const progresso = livro.totalPaginas > 1
            ? Math.min(100, Math.round(((livro.paginaAtual - 1) / (livro.totalPaginas - 1)) * 100))
            : 0;
          return (
            <div key={livro.id} className="text-left group relative">
              <button onClick={() => !livro.excluidoEm && navigate(`/livro/${livro.id}`)} className="w-full text-left">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-white dark:bg-[#242220] shadow-sm border border-black/5 dark:border-white/5">
                  {livro.capa ? <img src={livro.capa} alt={`Capa de ${livro.titulo}`} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-muted text-xs p-3 text-center">{livro.titulo}</div>}
                  {livro.concluido && <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-sage text-white flex items-center justify-center"><Check size={12} /></span>}
                </div>
                {!livro.excluidoEm && <div className="mt-2 h-1 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden"><div className="h-full bg-terracota" style={{ width: `${livro.concluido ? 100 : progresso}%` }} /></div>}
                <p className="mt-1 text-xs text-muted truncate">{livro.excluidoEm ? `Na lixeira até ${new Date(livro.excluidoEm).toLocaleDateString("pt-BR")}` : livro.concluido ? "Concluído" : `${progresso}% · p. ${livro.paginaAtual}/${livro.totalPaginas || "?"}`}</p>
              </button>
              <div className="flex gap-1 mt-2">
                {livro.excluidoEm ? <><button onClick={() => restaurar(livro.id!)} className="btn-ghost p-1.5" title="Restaurar"><RotateCcw size={14} /></button><button onClick={() => { setLivroParaExcluir(livro.id!); setConfirmacao("livro"); }} className="btn-ghost p-1.5 text-red-600" title="Excluir permanentemente"><X size={14} /></button></> : <>
                  <button onClick={() => coverInputs.current[livro.id!]!.click()} className="btn-ghost p-1.5" title="Enviar capa"><Upload size={14} /></button>
                  <button onClick={() => coverInputs.current[livro.id!]!.click()} className="btn-ghost p-1.5" title="Editar capa"><Pencil size={14} /></button>
                  <input ref={(node) => { coverInputs.current[livro.id!] = node; }} type="file" accept="image/*" className="hidden" onChange={(e) => alterarCapa(livro.id!, e)} />
                  <button onClick={() => removerCapa(livro.id!)} className="btn-ghost p-1.5 text-muted" title="Apagar capa"><X size={14} /></button>
                  <button onClick={() => moverParaLixeira(livro.id!)} className="btn-ghost p-1.5 text-red-600" title="Mover para lixeira"><Trash2 size={14} /></button>
                </>}
              </div>
            </div>
          );
        })}
        {!abrirLixeira && <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-black/10 dark:border-white/10 flex items-center justify-center cursor-pointer hover:border-terracota/50 transition-colors"><input type="file" accept="application/pdf" className="hidden" onChange={importarPdf} /><Plus size={22} className="text-muted" /></label>}
      </div>
      <label className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-terracota text-white flex items-center justify-center shadow-lg cursor-pointer hover:bg-terracota-dark transition-colors"><input type="file" accept="application/pdf" className="hidden" onChange={importarPdf} /><Plus size={22} /></label>
      {confirmacao && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card max-w-sm w-full p-6">
            <h2 className="font-bold text-lg mb-2">{confirmacao === "lixeira" ? "Esvaziar lixeira?" : "Excluir livro permanentemente?"}</h2>
            <p className="text-sm text-muted mb-5">{confirmacao === "lixeira" ? "Todos os livros da lixeira serão apagados definitivamente. Essa ação não pode ser desfeita." : "Este livro e seus dados serão apagados definitivamente. Essa ação não pode ser desfeita."}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setConfirmacao(null); setLivroParaExcluir(null); }} className="btn-ghost">Cancelar</button>
              <button onClick={() => void (confirmacao === "lixeira" ? esvaziarLixeira() : excluirPermanentemente())} className="btn-primary bg-red-600 hover:bg-red-700">Confirmar exclusão</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
