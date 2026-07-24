export interface PaginacijaMeta {
  ukupno: number;
  strana: number;
  limit: number;
  ukupnoStranica: number;
}

export interface PaginiraniRezultat<T> {
  podaci: T[];
  meta: PaginacijaMeta;
}

// Generic funkcija - radi za niz bilo kog tipa (Knjiga[], Autor[], Clan[]...).
// <T> ovdje znaci "koji god tip niza mi das, isti taj tip vracam nazad".
export function paginiraj<T>(
  niz: T[],
  strana: number,
  limit: number
): PaginiraniRezultat<T> {
  const ukupno = niz.length;
  const ukupnoStranica = Math.max(1, Math.ceil(ukupno / limit));
  const pocetniIndex = (strana - 1) * limit;
  const podaci = niz.slice(pocetniIndex, pocetniIndex + limit);

  return {
    podaci,
    meta: { ukupno, strana, limit, ukupnoStranica },
  };
}

// Cita ?strana i ?limit iz query stringa, sa sigurnim podrazumijevanim vrijednostima
export function parsirajStranicenje(query: Record<string, unknown>) {
  const strana = Math.max(1, Number(query.strana) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  return { strana, limit };
}
