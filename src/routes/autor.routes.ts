import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { Autor } from "../models/autor.model";
import { NotFoundError, ConflictError } from "../errors/AppError";
import { validate } from "../middleware/validate";
import { noviAutorSchema, azurirajAutoraSchema, NoviAutor } from "../schemas/autor.schema";
import { paginiraj, parsirajStranicenje } from "../utils/paginacija";

const router = Router();

// vrati autore, uz opciono filtriranje/sortiranje/paginaciju
// /api/autori?ime=orwell&drzava=Britanija&sortiraj=ime&strana=1&limit=10
router.get("/", async (req: Request, res: Response) => {
  const sviAutori = await prisma.autori.findMany();
  let rezultat: Autor[] = [...sviAutori];

  if (req.query.ime !== undefined) {
    const trazenoIme = (req.query.ime as string).toLowerCase();
    rezultat = rezultat.filter((a) => a.ime.toLowerCase().includes(trazenoIme));
  }

  if (req.query.drzava !== undefined) {
    const trazenaDrzava = (req.query.drzava as string).toLowerCase();
    rezultat = rezultat.filter((a) => a.drzava.toLowerCase().includes(trazenaDrzava));
  }

  const poljaZaSortiranje: (keyof Autor)[] = ["ime", "godinaRodjenja"];
  const trazenoPolje = req.query.sortiraj as string | undefined;

  if (trazenoPolje && poljaZaSortiranje.includes(trazenoPolje as keyof Autor)) {
    const polje = trazenoPolje as keyof Autor;
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

// vrati odredjenog autora sa tim id
router.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const autor = await prisma.autori.findUnique({ where: { id } });
  if (!autor) throw new NotFoundError("Autor nije pronađen");
  res.json(autor);
});

// vrati sve knjige od odredjenog autora
router.get("/:id/knjige", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const autor = await prisma.autori.findUnique({ where: { id } });
  if (!autor) throw new NotFoundError("Autor nije pronađen");

  const knjigeAutor = await prisma.knjige.findMany({ where: { autorId: id } });
  res.json(knjigeAutor);
});

// dodaj novog autora
router.post("/", validate(noviAutorSchema), async (req: Request, res: Response) => {
  const podaci: NoviAutor = req.body;

  const noviAutor = await prisma.autori.create({
    data: {
      ime: podaci.ime,
      godinaRodjenja: podaci.godinaRodjenja,
      drzava: podaci.drzava,
    },
  });

  res.status(201).json(noviAutor);
});

// izmjeni autora
router.put("/:id", validate(azurirajAutoraSchema), async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const postoji = await prisma.autori.findUnique({ where: { id } });
  if (!postoji) {
    throw new NotFoundError("Autor nije pronađen");
  }

  const azuriran = await prisma.autori.update({
    where: { id },
    data: req.body,
  });

  res.json(azuriran);
});

// brisanje
router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const postoji = await prisma.autori.findUnique({ where: { id } });
  if (!postoji) {
    throw new NotFoundError("Autor nije pronađen");
  }

  const imaKnjigu = await prisma.knjige.findFirst({ where: { autorId: id } });
  if (imaKnjigu) {
    throw new ConflictError("Ne može se obrisati autor koji ima knjigu u bazi");
  }

  await prisma.autori.delete({ where: { id } });
  res.status(204).send();
});

export default router;