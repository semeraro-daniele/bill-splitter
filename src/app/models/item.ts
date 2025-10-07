export interface Item {
  nome: string;
  iva: number;
  prezzo: number | null;
  quantita?: number;
  sconto?: number;
  prezzoFinale?: number;
  assignedTo?: string;
  assignments?: { person: string; quantity: number }[];
  showSplit?: boolean;
}
