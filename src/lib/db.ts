import Dexie, { type Table } from "dexie";

// Estrutura de dados — ver documento de ideias iniciais do projeto.
// Tudo fica salvo localmente (IndexedDB), então o app funciona 100% offline.

export interface Livro {
  id?: number;
  titulo: string;
  autor?: string;
  arquivoPdf: Blob; // o PDF em si, salvo localmente
  capa?: string; // data URL da capa (gerada da 1ª página ou definida manualmente)
  paginaAtual: number;
  totalPaginas: number;
  tempoTotalLeituraSegundos: number;
  dataImportacao: Date;
  concluido: boolean;
  excluidoEm?: Date;
}

export interface Marcador {
  id?: number;
  livroId: number;
  pagina: number;
  nome?: string;
  dataCriacao: Date;
}

export type CorDestaque = "yellow" | "blue" | "pink" | "green";

export interface Anotacao {
  id?: number;
  livroId: number;
  pagina: number;
  trechoTexto?: string;
  cor: CorDestaque;
  comentario?: string;
  dataCriacao: Date;
}

export interface Citacao {
  id?: number;
  livroId: number;
  pagina: number;
  textoCitado: string;
  dataCriacao: Date;
}

export interface BlocoNotas {
  id?: number;
  livroId?: number;
  titulo: string;
  conteudo: string; // markdown livre
  dataAtualizacao: Date;
}

export interface TrechoNota {
  id?: number;
  blocoId: number;
  livroId: number;
  pagina: number;
  texto: string;
  comentario: string;
  dataCriacao: Date;
}

export interface SessaoLeitura {
  id?: number;
  livroId: number;
  inicio: Date;
  fim?: Date;
  duracaoSegundos: number;
}

class LeituraDB extends Dexie {
  livros!: Table<Livro, number>;
  marcadores!: Table<Marcador, number>;
  anotacoes!: Table<Anotacao, number>;
  citacoes!: Table<Citacao, number>;
  blocosNotas!: Table<BlocoNotas, number>;
  trechosNotas!: Table<TrechoNota, number>;
  sessoesLeitura!: Table<SessaoLeitura, number>;

  constructor() {
    super("leitura-db");
    this.version(1).stores({
      livros: "++id, titulo, concluido",
      marcadores: "++id, livroId, pagina",
      anotacoes: "++id, livroId, pagina",
      citacoes: "++id, livroId, pagina",
      blocosNotas: "++id, livroId",
      sessoesLeitura: "++id, livroId, inicio",
    });
    this.version(2).stores({
      livros: "++id, titulo, concluido, excluidoEm",
      marcadores: "++id, livroId, pagina",
      anotacoes: "++id, livroId, pagina",
      citacoes: "++id, livroId, pagina",
      blocosNotas: "++id, livroId",
      sessoesLeitura: "++id, livroId, inicio",
    });
    this.version(3).stores({
      livros: "++id, titulo, concluido, excluidoEm",
      marcadores: "++id, livroId, pagina",
      anotacoes: "++id, livroId, pagina",
      citacoes: "++id, livroId, pagina",
      blocosNotas: "++id, livroId",
      trechosNotas: "++id, blocoId, livroId, pagina",
      sessoesLeitura: "++id, livroId, inicio",
    });
  }
}

export const db = new LeituraDB();
