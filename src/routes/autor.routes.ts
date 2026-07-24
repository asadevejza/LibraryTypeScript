import { Router, Request, Response } from "express";
import { autori, generisiAutorId } from "../data/autor.data";
import { knjige } from "../data/knjige.data";
import { Autor } from "../models/autor.model";
import { NotFoundError, ConflictError } from "../errors/AppError";
import { validate } from "../middleware/validate";
import { noviAutorSchema, azurirajAutoraSchema, NoviAutor } from "../schemas/autor.schema";

const router = Router();

// vrati sve autore
router.get("/", (req: Request, res: Response) => {
  res.json(autori);
});

// vrati odredjenog autora sa tim id
router.get("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const autor = autori.find((a) => a.id === id);
  if (!autor) throw new NotFoundError("Autor nije pronađen");
  res.json(autor);
});

// vrati sve knjige od odredjenog autora
router.get("/:id/knjige", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const autor = autori.find((k) => k.id === id);
  if (!autor) throw new NotFoundError("Autor nije pronađen");
  const knjigeAutor = knjige.filter((k) => k.autorId === id);
  res.json(knjigeAutor);
});

// dodaj novog autora
router.post("/", validate(noviAutorSchema), (req: Request, res: Response) => {
  const podaci: NoviAutor = req.body;
  const noviAutor: Autor = {
    id: generisiAutorId(),
    ime: podaci.ime,
    godinaRodjenja: podaci.godinaRodjenja,
    drzava: podaci.drzava,
  };
  autori.push(noviAutor);
  res.status(201).json(noviAutor);
});

// izmjeni autora
router.put("/:id", validate(azurirajAutoraSchema), (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = autori.findIndex((a) => a.id === id);

  if (index === -1) {
    throw new NotFoundError("Autor nije pronađen");
  }

  autori[index] = { ...autori[index], ...req.body, id };
  res.json(autori[index]);
});

// brisanje
router.delete("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = autori.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new NotFoundError("Autor nije pronađen");
  }
  const imaKnjigu = knjige.some((k) => k.autorId === id);
  if (imaKnjigu) {
    throw new ConflictError("Ne može se obrisati autor koji ima knjigu u bazi");
  }
  autori.splice(index, 1);
  res.status(204).send();
});

export default router;
