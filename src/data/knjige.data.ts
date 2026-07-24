import { Knjiga } from "../models/knjiga.model";

let sljedeciId = 1;
export function generisiId(): number {
  return sljedeciId++;
}

export let knjige: Knjiga[] = [
  { id: generisiId(), naslov: "1984", autorId: 1, godinaIzdanja: 1949, dostupna: true },
  { id: generisiId(), naslov: "Na Drini ćuprija", autorId: 2, godinaIzdanja: 1945, dostupna: true },
];
