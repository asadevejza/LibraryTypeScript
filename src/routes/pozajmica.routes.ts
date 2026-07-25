import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { NotFoundError, ConflictError } from "../errors/AppError";
import { validate } from "../middleware/validate";
import { novaPozajmicaSchema, NovaPozajmica } from "../schemas/pozajmica.schema";
import { paginiraj, parsirajStranicenje } from "../utils/paginacija";

const router = Router();

// GET /api/pozajmice - vrati pozajmice, uz opciono filtriranje/sortiranje/paginaciju
// /api/pozajmice?clanId=1&vraceno=false&sortiraj=datumPozajmljivanja&strana=1&limit=10
router.get("/", async (req: Request, res: Response) => {
  const svePozajmice = await prisma.pozajmice.findMany();
  let rezultat = [...svePozajmice];

  if (req.query.clanId !== undefined) {
    const clanId = Number(req.query.clanId);
    rezultat = rezultat.filter((p) => p.clanId === clanId);
  }

  if (req.query.knjigaId !== undefined) {
    const knjigaId = Number(req.query.knjigaId);
    rezultat = rezultat.filter((p) => p.knjigaId === knjigaId);
  }

  if (req.query.vraceno !== undefined) {
    const vraceno = req.query.vraceno === "true";
    rezultat = rezultat.filter((p) => (p.datumVracanja !== null) === vraceno);
  }

  if (req.query.sortiraj === "datumPozajmljivanja") {
    const smjer = req.query.redoslijed === "desc" ? -1 : 1;
    rezultat = rezultat.sort(
      (a, b) => (a.datumPozajmljivanja.getTime() - b.datumPozajmljivanja.getTime()) * smjer
    );
  }

  const { strana, limit } = parsirajStranicenje(req.query);
  res.json(paginiraj(rezultat, strana, limit));
});

// GET /api/pozajmice/aktivne - vrati samo knjige koje trenutno nisu vracene
// (mora biti PRIJE /:id rute, inace bi express "aktivne" protumacio kao id)
router.get("/aktivne", async (req: Request, res: Response) => {
  const aktivne = await prisma.pozajmice.findMany({ where: { datumVracanja: null } });
  res.json(aktivne);
});

// GET /api/pozajmice/:id - vrati jednu pozajmicu
router.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const pozajmica = await prisma.pozajmice.findUnique({ where: { id } });

  if (!pozajmica) {
    throw new NotFoundError("Pozajmica nije pronađena");
  }

  res.json(pozajmica);
});

// POST /api/pozajmice - pozajmi knjigu
router.post("/", validate(novaPozajmicaSchema), async (req: Request, res: Response) => {
  const podaci: NovaPozajmica = req.body;

  const novaPozajmica = await prisma.$transaction(async (tx) => {
    const knjiga = await tx.knjige.findUnique({ where: { id: podaci.knjigaId } });
    if (!knjiga) {
      throw new NotFoundError("Knjiga nije pronađena");
    }

    const clan = await tx.clanovi.findUnique({ where: { id: podaci.clanId } });
    if (!clan) {
      throw new NotFoundError("Član nije pronađen");
    }

    if (!knjiga.dostupna) {
      throw new ConflictError("Knjiga trenutno nije dostupna");
    }

    const pozajmica = await tx.pozajmice.create({
      data: {
        knjigaId: podaci.knjigaId,
        clanId: podaci.clanId,
        datumPozajmljivanja: new Date(),
        datumVracanja: null,
      },
    });

    await tx.knjige.update({
      where: { id: podaci.knjigaId },
      data: { dostupna: false },
    });

    return pozajmica;
  });

  res.status(201).json(novaPozajmica);
});

// PUT /api/pozajmice/:id/vrati - vrati knjigu
router.put("/:id/vrati", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const rezultat = await prisma.$transaction(async (tx) => {
    const pozajmica = await tx.pozajmice.findUnique({ where: { id } });
    if (!pozajmica) {
      throw new NotFoundError("Pozajmica nije pronađena");
    }

    if (pozajmica.datumVracanja !== null) {
      throw new ConflictError("Knjiga je već vraćena");
    }

    const vracenaPozajmica = await tx.pozajmice.update({
      where: { id },
      data: { datumVracanja: new Date() },
    });

    // red cekanja za tu knjigu - najstarija rezervacija koja jos ceka
    const sljedeciURedu = await tx.rezervacije.findFirst({
      where: { knjigaId: pozajmica.knjigaId, status: "na_cekanju" },
      orderBy: { id: "asc" },
    });

    if (!sljedeciURedu) {
      await tx.knjige.update({
        where: { id: pozajmica.knjigaId },
        data: { dostupna: true },
      });
      return { vracenaPozajmica };
    }

    await tx.rezervacije.update({
      where: { id: sljedeciURedu.id },
      data: { status: "realizovana" },
    });

    const novaPozajmicaIzReda = await tx.pozajmice.create({
      data: {
        knjigaId: pozajmica.knjigaId,
        clanId: sljedeciURedu.clanId,
        datumPozajmljivanja: new Date(),
        datumVracanja: null,
      },
    });

    return {
      vracenaPozajmica,
      novaPozajmicaIzReda,
      poruka: `Knjiga automatski dodijeljena članu iz reda čekanja (clanId: ${sljedeciURedu.clanId})`,
    };
  });

  res.json(rezultat);
});

export default router;