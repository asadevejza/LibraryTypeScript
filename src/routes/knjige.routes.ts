import { Router, Request, Response } from "express";
import { Knjiga } from "../models/knjiga.model";
import { knjige, generisiId } from "../data/knjige.data";
import { autori } from "../data/autor.data";
import { NotFoundError, BadRequestError } from "../errors/AppError";
import { validate } from "../middleware/validate";
import { novaKnjigaSchema, azurirajKnjiguSchema, NovaKnjiga } from "../schemas/knjiga.schema";
import { paginiraj, parsirajStranicenje } from "../utils/paginacija";

const router = Router();

// GET /api/knjige - vrati knjige, uz opciono filtriranje/sortiranje/paginaciju
// Primjeri:
//   /api/knjige?autorId=1
//   /api/knjige?dostupna=true
//   /api/knjige?godinaOd=1900&godinaDo=2000
//   /api/knjige?sortiraj=godinaIzdanja&redoslijed=desc
//   /api/knjige?strana=2&limit=5
router.get("/", (req: Request, res: Response) => {
  let rezultat: Knjiga[] = [...knjige];

  // --- FILTRIRANJE ---

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

  // --- SORTIRANJE ---

  const poljaZaSortiranje: (keyof Knjiga)[] = ["naslov", "godinaIzdanja"];
  const trazenoPolje = req.query.sortiraj as string | undefined;

  if (trazenoPolje && poljaZaSortiranje.includes(trazenoPolje as keyof Knjiga)) {
    const polje = trazenoPolje as keyof Knjiga;
    const smjer = req.query.redoslijed === "desc" ? -1 : 1;

    rezultat = rezultat.sort((a, b) => {
      if (a[polje] < b[polje]) return -1 * smjer;
      if (a[polje] > b[polje]) return 1 * smjer;
      return 0;
    });
  }

  // --- PAGINACIJA ---

  const { strana, limit } = parsirajStranicenje(req.query);
  res.json(paginiraj(rezultat, strana, limit));
});

// GET /api/knjige/:id - vrati odredjenu knjigu
router.get("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const knjiga = knjige.find((k) => k.id === id);

  if (!knjiga) {
    throw new NotFoundError("Knjiga nije pronađena");
  }

  res.json(knjiga);
});

// POST /api/knjige - dodaj novu knjigu
router.post("/", validate(novaKnjigaSchema), (req: Request, res: Response) => {
  const podaci: NovaKnjiga = req.body;

  const autorPostoji = autori.some((a) => a.id === podaci.autorId);
  if (!autorPostoji) {
    throw new BadRequestError("Autor sa tim ID-jem ne postoji");
  }

  const novaKnjiga: Knjiga = {
    id: generisiId(),
    naslov: podaci.naslov,
    autorId: podaci.autorId,
    godinaIzdanja: podaci.godinaIzdanja,
    dostupna: podaci.dostupna ?? true,
  };
  knjige.push(novaKnjiga);
  res.status(201).json(novaKnjiga);
});

// PUT /api/knjige/:id - izmijeni knjigu
router.put("/:id", validate(azurirajKnjiguSchema), (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = knjige.findIndex((k) => k.id === id);

  if (index === -1) {
    throw new NotFoundError("Knjiga nije pronađena");
  }

  knjige[index] = { ...knjige[index], ...req.body, id };
  res.json(knjige[index]);
});

// DELETE /api/knjige/:id - obrisi knjigu
router.delete("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = knjige.findIndex((k) => k.id === id);

  if (index === -1) {
    throw new NotFoundError("Knjiga nije pronađena");
  }

  knjige.splice(index, 1);
  res.status(204).send();
});

export default router;
