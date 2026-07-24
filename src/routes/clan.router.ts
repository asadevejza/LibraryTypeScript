import { Clan } from "../models/clan.model";
import { Router, Request, Response } from "express";
import { clanovi, generisiClanId } from "../data/clan.data";
import { NotFoundError, ConflictError } from "../errors/AppError";
import { validate } from "../middleware/validate";
import { noviClanSchema, azurirajClanaSchema, NoviClan } from "../schemas/clan.schema";

const router = Router();

// vrati sve clanove
router.get("/", (req: Request, res: Response) => {
  res.json(clanovi);
});

// vrati odredjenog clana
router.get("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const clan = clanovi.find((c) => c.id === id);
  if (!clan) throw new NotFoundError("Clan nije pronađen");

  res.json(clan);
});

// dodaj clana
router.post("/", validate(noviClanSchema), (req: Request, res: Response) => {
  const podaci: NoviClan = req.body;

  const emailZauzet = clanovi.some((c) => c.email === podaci.email);
  if (emailZauzet) {
    throw new ConflictError("Clan sa tim email-om već postoji");
  }
  const noviClan: Clan = {
    id: generisiClanId(),
    ime: podaci.ime,
    email: podaci.email,
    brojClanskeKarte: podaci.brojClanskeKarte ?? "",
  };
  clanovi.push(noviClan);
  res.status(201).json(noviClan);
});

// izmjeni clana
router.put("/:id", validate(azurirajClanaSchema), (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = clanovi.findIndex((c) => c.id === id);

  if (index === -1) {
    throw new NotFoundError("Član nije pronađen");
  }

  clanovi[index] = { ...clanovi[index], ...req.body, id };
  res.json(clanovi[index]);
});

// brisanje
router.delete("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = clanovi.findIndex((c) => c.id === id);

  if (index === -1) {
    throw new NotFoundError("Član nije pronađen");
  }

  clanovi.splice(index, 1);
  res.status(204).send();
});

export default router;
