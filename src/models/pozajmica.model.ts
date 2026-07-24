export interface Pozajmica {
  id: number;
  knjigaId: number;
  clanId: number;
  datumPozajmljivanja: string;
  datumVracanja: string | null;
}
