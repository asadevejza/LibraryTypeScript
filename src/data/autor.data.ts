import { Autor } from "../models/autor.model";

let sljedeciId = 1;
export function generisiAutorId(): number {
  return sljedeciId++;
}

export let autori: Autor[] = [
  { id: generisiAutorId(), ime: "George Orwell", godinaRodjenja: 1903, drzava: "Velika Britanija" },
  { id: generisiAutorId(), ime: "Ivo Andrić", godinaRodjenja: 1892, drzava: "Bosna i Hercegovina" },
];
