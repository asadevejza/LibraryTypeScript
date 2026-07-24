import { Clan } from "../models/clan.model";

let sljedeciId = 1;
export function generisiClanId(): number {
  return sljedeciId++;
}

export let clanovi: Clan[] = [
  { id: generisiClanId(), ime: "Asad Vejzović", email: "asad.vejzovic@edu.fit.ba", brojClanskeKarte: "A-001" },
  { id: generisiClanId(), ime: "Adna Šunje", email: "adna.sunje@edu.fit.ba", brojClanskeKarte: "b-001" },
];
