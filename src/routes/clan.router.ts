import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { Clan } from "../models/clan.model";
import { NotFoundError, ConflictError } from "../errors/AppError";
import { validate } from "../middleware/validate";
import { noviClanSchema, azurirajClanaSchema, NoviClan } from "../schemas/clan.schema";
import { paginiraj, parsirajStranicenje } from "../utils/paginacija";

const router = Router();

// vrati clanove, uz opciono filtriranje/sortiranje/paginaciju
// /api/clanovi?ime=amina&sortiraj=ime&strana=1&limit=10
router.get("/", async (req: Request, res: Response) => {
  const sviClanovi = await prisma.clanovi.findMany();
  let rezultat: Clan[] = [...sviClanovi];

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
router.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const clan = await prisma.clanovi.findUnique({ where: { id } });
  if (!clan) throw new NotFoundError("Clan nije pronađen");

  res.json(clan);
});

// dodaj clana
router.post("/", validate(noviClanSchema), async (req: Request, res: Response) => {
  const podaci: NoviClan = req.body;

  const emailZauzet = await prisma.clanovi.findFirst({ where: { email: podaci.email } });
  if (emailZauzet) {
    throw new ConflictError("Clan sa tim email-om već postoji");
  }

  const noviClan = await prisma.clanovi.create({
    data: {
      ime: podaci.ime,
      email: podaci.email,
      brojClanskeKarte: podaci.brojClanskeKarte ?? "",
    },
  });

  res.status(201).json(noviClan);
});

// izmjeni clana
router.put("/:id", validate(azurirajClanaSchema), async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const postoji = await prisma.clanovi.findUnique({ where: { id } });
  if (!postoji) {
    throw new NotFoundError("Član nije pronađen");
  }

  const azuriran = await prisma.clanovi.update({
    where: { id },
    data: req.body,
  });

  res.json(azuriran);
});

// brisanje
router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const postoji = await prisma.clanovi.findUnique({ where: { id } });
  if (!postoji) {
    throw new NotFoundError("Član nije pronađen");
  }

  await prisma.clanovi.delete({ where: { id } });
  res.status(204).send();
});

export default router;