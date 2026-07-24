import { Clan } from "../models/clan.model";
import { Router, Request, Response } from "express";
import { clanovi, generisiClanId } from "../data/clan.data";
import { NotFoundError, ConflictError } from "../errors/AppError";
import { validate } from "../middleware/validate";
import { noviClanSchema, azurirajClanaSchema, NoviClan } from "../schemas/clan.schema";
import { paginiraj, parsirajStranicenje } from "../utils/paginacija";

const router = Router();

// vrati clanove, uz opciono filtriranje/sortiranje/paginaciju
// /api/clanovi?ime=amina&sortiraj=ime&strana=1&limit=10
router.get("/", (req: Request, res: Response) => {
  let rezultat: Clan[] = [...clanovi];

  if (req.query.ime !== undefined) {
    const trazenoIme = (req.query.ime as string).toLowerCase();
    rezultat = rezultat.filter((c) => c.ime.toLowerCase().includes(trazenoIme));
  }

  if (req.query.email !== undefined) {
    const trazeniEmail = (req.query.email as string).toLowerCase();
    rezultat = rezultat.filter((c) => c.email.toLowerCase().includes(trazeniEmail));
  }

  if (req.query.sortiraj === "ime") {
    const smjer = req.query.redoslijed === "desc" ? -1 : 1;
    rezultat = rezultat.sort((a, b) => a.ime.localeCompare(b.ime) * smjer);
  }

  const { strana, limit } = parsirajStranicenje(req.query);
  res.json(paginiraj(rezultat, strana, limit));
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
