// Literal union tip - "status" smije biti SAMO jedna od ova tri tacne vrijednosti,
// nista drugo (ni bilo koji drugi string) nije dozvoljeno.
export type StatusRezervacije = "na_cekanju" | "realizovana" | "otkazana";

export interface Rezervacija {
  id: number;
  knjigaId: number;
  clanId: number;
  datumRezervacije: string;
  status: StatusRezervacije;
}
