import { Pozajmica } from "../models/pozajmica.model";

let sljedeciId = 1;
export function generisiPozajmicaId(): number {
  return sljedeciId++;
}

export let pozajmice: Pozajmica[] = [];
