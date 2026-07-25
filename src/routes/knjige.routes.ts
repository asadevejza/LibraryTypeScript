import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { NotFoundError, BadRequestError } from "../errors/AppError";
import { validate } from "../middleware/validate";
import { novaKnjigaSchema, azurirajKnjiguSchema, NovaKnjiga } from "../schemas/knjiga.schema";
import { paginiraj, parsirajStranicenje } from "../utils/paginacija";

const router = Router();

// GET /api/knjige
router.get("/", async (req: Request, res: Response) => {
  const sveKnjige = await prisma.knjige.findMany();
  let rezultat = [...sveKnjige];

  if (req.query.autorId !== undefined) {
    const autorId = Number(req.query.autorId);
    rezultat = rezultat.filter((k) => k.autorId === autorId);
  }

  if (req.query.dostupna !== undefined) {
    const dostupna = req.query.dostupna === "true";
    rezultat = rezultat.filter((k) => k.dostupna === dostupna);
  }

  if (req.query.godinaOd !== undefined) {
    const godinaOd = Number(req.query.godinaOd);
    rezultat = rezultat.filter((k) => k.godinaIzdanja >= godinaOd);
  }

  if (req.query.godinaDo !== undefined) {
    const godinaDo = Number(req.query.godinaDo);
    rezultat = rezultat.filter((k) => k.godinaIzdanja <= godinaDo);
  }

  const poljaZaSortiranje = ["naslov", "godinaIzdanja"] as const;
  const trazenoPolje = req.query.sortiraj as string | undefined;

  if (trazenoPolje && poljaZaSortiranje.includes(trazenoPolje as any)) {
    const polje = trazenoPolje as "naslov" | "godinaIzdanja";
    const smjer = req.query.redoslijed === "desc" ? -1 : 1;

    rezultat = rezultat.sort((a, b) => {
      if (a[polje] < b[polje]) return -1 * smjer;
      if (a[polje] > b[polje]) return 1 * smjer;
      return 0;
    });
  }

  const { strana, limit } = parsirajStranicenje(req.query);
  res.json(paginiraj(rezultat, strana, limit));
});

// GET /api/knjige/:id
router.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const knjiga = await prisma.knjige.findUnique({ where: { id } });

  if (!knjiga) {
    throw new NotFoundError("Knjiga nije pronađena");
  }

  res.json(knjiga);
});

// POST /api/knjige
router.post("/", validate(novaKnjigaSchema), async (req: Request, res: Response) => {
  const podaci: NovaKnjiga = req.body;

  const autorPostoji = await prisma.autori.findUnique({ where: { id: podaci.autorId } });
  if (!autorPostoji) {
    throw new BadRequestError("Autor sa tim ID-jem ne postoji");
  }

  const novaKnjiga = await prisma.knjige.create({
    data: {
      naslov: podaci.naslov,
      autorId: podaci.autorId,
      godinaIzdanja: podaci.godinaIzdanja,
      dostupna: podaci.dostupna ?? true,
    },
  });

  res.status(201).json(novaKnjiga);
});

// PUT /api/knjige/:id
router.put("/:id", validate(azurirajKnjiguSchema), async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const postoji = await prisma.knjige.findUnique({ where: { id } });
  if (!postoji) {
    throw new NotFoundError("Knjiga nije pronađena");
  }

  const azurirana = await prisma.knjige.update({
    where: { id },
    data: req.body,
  });

  res.json(azurirana);
});

// DELETE /api/knjige/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const postoji = await prisma.knjige.findUnique({ where: { id } });
  if (!postoji) {
    throw new NotFoundError("Knjiga nije pronađena");
  }

  await prisma.knjige.delete({ where: { id } });
  res.status(204).send();
});

export default router;