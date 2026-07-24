import { Rezervacija } from "../models/rezervacija.model";

let sljedeciId = 1;
export function generisiRezervacijaId(): number {
  return sljedeciId++;
}

export let rezervacije: Rezervacija[] = [];
