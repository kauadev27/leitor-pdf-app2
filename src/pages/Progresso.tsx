import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function formatarHoras(segundos: number) {
  const h = Math.floor(segundos / 3600);
  const m = Math.round((segundos % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m} min`;
}

export default function Progresso() {
  const livros = useLiveQuery(() => db.livros.filter((livro) => !livro.excluidoEm).toArray(), []) ?? [];
  const sessoes = useLiveQuery(() => db.sessoesLeitura.toArray(), []) ?? [];

  const tempoTotal = sessoes.reduce((acc, s) => acc + s.duracaoSegundos, 0);
  const livrosLidos = livros.filter((l) => l.concluido).length;

  // Minutos lidos por dia da semana (últimos registros)
  const minutosPorDia = DIAS.map((_, idx) => {
    const total = sessoes
      .filter((s) => (new Date(s.inicio).getDay() + 6) % 7 === idx)
      .reduce((acc, s) => acc + s.duracaoSegundos, 0);
    return Math.round(total / 60);
  });
  const maxMinutos = Math.max(1, ...minutosPorDia);

  const emAndamento = livros.filter((l) => !l.concluido && l.paginaAtual > 1);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Progresso de Leitura</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-3xl font-bold text-terracota">{livrosLidos}</p>
          <p className="text-sm font-medium mt-1">Livros lidos</p>
          <p className="text-xs text-muted">este mês</p>
        </div>
        <div className="card p-5">
          <p className="text-3xl font-bold text-terracota">{formatarHoras(tempoTotal)}</p>
          <p className="text-sm font-medium mt-1">Tempo total</p>
          <p className="text-xs text-muted">este mês</p>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <p className="text-sm font-medium mb-4">Minutos lidos por dia</p>
        <div className="flex items-end justify-between gap-3 h-40">
          {DIAS.map((dia, idx) => {
            const minutos = minutosPorDia[idx];
            const alturaPct = (minutos / maxMinutos) * 100;
            const ehMaisAlto = minutos === maxMinutos && minutos > 0;
            return (
              <div key={dia} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[11px] text-muted">{minutos}m</span>
                <div className="w-full h-28 flex items-end">
                  <div
                    className={`w-full rounded-t-md ${ehMaisAlto ? "bg-terracota" : "bg-terracota/20"}`}
                    style={{ height: `${Math.max(alturaPct, 4)}%` }}
                  />
                </div>
                <span className="text-xs text-muted">{dia}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-5">
        <p className="text-sm font-medium mb-3">Em andamento</p>
        <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
          {emAndamento.map((livro) => {
            const pct =
              livro.concluido ? 100 : livro.totalPaginas > 1
                ? Math.min(100, Math.round(((livro.paginaAtual - 1) / (livro.totalPaginas - 1)) * 100))
                : 0;
            return (
              <div key={livro.id} className="flex items-center gap-3 py-3">
                <div className="w-10 h-14 rounded bg-black/5 dark:bg-white/10 overflow-hidden shrink-0">
                  {livro.capa && <img src={livro.capa} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{livro.titulo}</p>
                  {livro.autor && <p className="text-xs text-muted truncate">{livro.autor}</p>}
                  <div className="mt-1.5 h-1 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <div className="h-full bg-terracota" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-sm text-muted shrink-0">{pct}%</span>
              </div>
            );
          })}
          {emAndamento.length === 0 && (
            <p className="text-sm text-muted py-3">Nenhum livro em andamento ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
