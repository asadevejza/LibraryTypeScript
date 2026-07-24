import { Router, Request, Response } from "express";
import { rezervacije, generisiRezervacijaId } from "../data/rezervacija.data";
import { knjige } from "../data/knjige.data";
import { clanovi } from "../data/clan.data";
import { Rezervacija } from "../models/rezervacija.model";
import { NotFoundError, ConflictError } from "../errors/AppError";
import { validate } from "../middleware/validate";
import { novaRezervacijaSchema, NovaRezervacija } from "../schemas/rezervacija.schema";

const router = Router();

// GET /api/rezervacije - vrati sve rezervacije
router.get("/", (req: Request, res: Response) => {
  res.json(rezervacije);
});

// GET /api/rezervacije/knjiga/:knjigaId - red cekanja za odredjenu knjigu
router.get("/knjiga/:knjigaId", (req: Request, res: Response) => {
  const knjigaId = Number(req.params.knjigaId);
  const red = rezervacije.filter((r) => r.knjigaId === knjigaId);
  res.json(red);
});

// GET /api/rezervacije/:id - vrati jednu rezervaciju
router.get("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const rezervacija = rezervacije.find((r) => r.id === id);

  if (!rezervacija) {
    throw new NotFoundError("Rezervacija nije pronađena");
  }

  res.json(rezervacija);
});

// POST /api/rezervacije - rezervisi knjigu
router.post("/", validate(novaRezervacijaSchema), (req: Request, res: Response) => {
  const podaci: NovaRezervacija = req.body;

  const knjiga = knjige.find((k) => k.id === podaci.knjigaId);
  if (!knjiga) {
    throw new NotFoundError("Knjiga nije pronađena");
  }

  const clan = clanovi.find((c) => c.id === podaci.clanId);
  if (!clan) {
    throw new NotFoundError("Član nije pronađen");
  }

  if (knjiga.dostupna) {
    throw new ConflictError("Knjiga je trenutno dostupna, pozajmite je umjesto da je rezervišete");
  }

  const vecRezervisao = rezervacije.some(
    (r) => r.knjigaId === podaci.knjigaId && r.clanId === podaci.clanId
  );
  if (vecRezervisao) {
    throw new ConflictError("Već ste rezervisali ovu knjigu");
  }

  const novaRezervacija: Rezervacija = {
    id: generisiRezervacijaId(),
    knjigaId: podaci.knjigaId,
    clanId: podaci.clanId,
    datumRezervacije: new Date().toISOString(),
  };

  rezervacije.push(novaRezervacija);
  res.status(201).json(novaRezervacija);
});

// DELETE /api/rezervacije/:id - otkazi rezervaciju
router.delete("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = rezervacije.findIndex((r) => r.id === id);

  if (index === -1) {
    throw new NotFoundError("Rezervacija nije pronađena");
  }

  rezervacije.splice(index, 1);
  res.status(204).send();
});

export default router;
