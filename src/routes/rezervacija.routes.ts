import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { StatusRezervacije } from "@prisma/client";
import { NotFoundError, ConflictError } from "../errors/AppError";
import { validate } from "../middleware/validate";
import { novaRezervacijaSchema, NovaRezervacija } from "../schemas/rezervacija.schema";
import { paginiraj, parsirajStranicenje } from "../utils/paginacija";

const router = Router();

const SVI_STATUSI: StatusRezervacije[] = ["na_cekanju", "realizovana", "otkazana"];

// GET /api/rezervacije - vrati rezervacije, uz opciono filtriranje/sortiranje/paginaciju
// /api/rezervacije?clanId=1&status=na_cekanju&sortiraj=datumRezervacije&strana=1&limit=10
router.get("/", async (req: Request, res: Response) => {
  const sveRezervacije = await prisma.rezervacije.findMany();
  let rezultat = [...sveRezervacije];

  if (req.query.clanId !== undefined) {
    const clanId = Number(req.query.clanId);
    rezultat = rezultat.filter((r) => r.clanId === clanId);
  }

  if (req.query.knjigaId !== undefined) {
    const knjigaId = Number(req.query.knjigaId);
    rezultat = rezultat.filter((r) => r.knjigaId === knjigaId);
  }

  const trazeniStatus = req.query.status as string | undefined;
  if (trazeniStatus && SVI_STATUSI.includes(trazeniStatus as StatusRezervacije)) {
    const status = trazeniStatus as StatusRezervacije;
    rezultat = rezultat.filter((r) => r.status === status);
  }

  if (req.query.sortiraj === "datumRezervacije") {
    const smjer = req.query.redoslijed === "desc" ? -1 : 1;
    rezultat = rezultat.sort(
      (a, b) => (a.datumRezervacije.getTime() - b.datumRezervacije.getTime()) * smjer
    );
  }

  const { strana, limit } = parsirajStranicenje(req.query);
  res.json(paginiraj(rezultat, strana, limit));
});

// GET /api/rezervacije/knjiga/:knjigaId - red cekanja za odredjenu knjigu
// (samo one koje su jos "na_cekanju")
router.get("/knjiga/:knjigaId", async (req: Request, res: Response) => {
  const knjigaId = Number(req.params.knjigaId);
  const red = await prisma.rezervacije.findMany({
    where: { knjigaId, status: "na_cekanju" },
    orderBy: { id: "asc" },
  });
  res.json(red);
});

// GET /api/rezervacije/:id - vrati jednu rezervaciju
router.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const rezervacija = await prisma.rezervacije.findUnique({ where: { id } });

  if (!rezervacija) {
    throw new NotFoundError("Rezervacija nije pronađena");
  }

  res.json(rezervacija);
});

// POST /api/rezervacije - rezervisi knjigu
router.post("/", validate(novaRezervacijaSchema), async (req: Request, res: Response) => {
  const podaci: NovaRezervacija = req.body;

  const knjiga = await prisma.knjige.findUnique({ where: { id: podaci.knjigaId } });
  if (!knjiga) {
    throw new NotFoundError("Knjiga nije pronađena");
  }

  const clan = await prisma.clanovi.findUnique({ where: { id: podaci.clanId } });
  if (!clan) {
    throw new NotFoundError("Član nije pronađen");
  }

  if (knjiga.dostupna) {
    throw new ConflictError("Knjiga je trenutno dostupna, pozajmite je umjesto da je rezervišete");
  }

  const vecRezervisao = await prisma.rezervacije.findFirst({
    where: { knjigaId: podaci.knjigaId, clanId: podaci.clanId, status: "na_cekanju" },
  });
  if (vecRezervisao) {
    throw new ConflictError("Već imate aktivnu rezervaciju za ovu knjigu");
  }

  const novaRezervacija = await prisma.rezervacije.create({
    data: {
      knjigaId: podaci.knjigaId,
      clanId: podaci.clanId,
      datumRezervacije: new Date(),
      status: "na_cekanju",
    },
  });

  res.status(201).json(novaRezervacija);
});

// DELETE /api/rezervacije/:id - otkazi rezervaciju
// (ne brisemo je fizicki - samo joj mijenjamo status, da sacuvamo istoriju)
router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const rezervacija = await prisma.rezervacije.findUnique({ where: { id } });
  if (!rezervacija) {
    throw new NotFoundError("Rezervacija nije pronađena");
  }

  if (rezervacija.status !== "na_cekanju") {
    throw new ConflictError("Samo rezervacija koja čeka u redu se može otkazati");
  }

  await prisma.rezervacije.update({
    where: { id },
    data: { status: "otkazana" },
  });

  res.status(204).send();
});

export default router;