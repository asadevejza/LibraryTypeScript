import { Router, Request, Response } from "express";
import { Knjiga } from "../models/knjiga.model";
import { knjige, generisiId } from "../data/knjige.data";
import { autori } from "../data/autor.data";
import { NotFoundError, BadRequestError } from "../errors/AppError";
import { validate } from "../middleware/validate";
import { novaKnjigaSchema, azurirajKnjiguSchema, NovaKnjiga } from "../schemas/knjiga.schema";

const router = Router();

// GET /api/knjige - vrati sve knjige
router.get("/", (req: Request, res: Response) => {
  res.json(knjige);
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
