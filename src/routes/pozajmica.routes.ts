import { Router, Request, Response } from "express";
import { pozajmice, generisiPozajmicaId } from "../data/pozajmica.data";
import { knjige } from "../data/knjige.data";
import { clanovi } from "../data/clan.data";
import { rezervacije } from "../data/rezervacija.data";
import { Pozajmica } from "../models/pozajmica.model";
import { NotFoundError, ConflictError } from "../errors/AppError";
import { validate } from "../middleware/validate";
import { novaPozajmicaSchema, NovaPozajmica } from "../schemas/pozajmica.schema";
import { paginiraj, parsirajStranicenje } from "../utils/paginacija";

const router = Router();

// GET /api/pozajmice - vrati pozajmice, uz opciono filtriranje/sortiranje/paginaciju
// /api/pozajmice?clanId=1&vraceno=false&sortiraj=datumPozajmljivanja&strana=1&limit=10
router.get("/", (req: Request, res: Response) => {
  let rezultat: Pozajmica[] = [...pozajmice];

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
      (a, b) => a.datumPozajmljivanja.localeCompare(b.datumPozajmljivanja) * smjer
    );
  }

  const { strana, limit } = parsirajStranicenje(req.query);
  res.json(paginiraj(rezultat, strana, limit));
});

// GET /api/pozajmice/aktivne - vrati samo knjige koje trenutno nisu vracene
router.get("/aktivne", (req: Request, res: Response) => {
  const aktivne = pozajmice.filter((p) => p.datumVracanja === null);
  res.json(aktivne);
});

// GET /api/pozajmice/:id - vrati jednu pozajmicu
router.get("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const pozajmica = pozajmice.find((p) => p.id === id);

  if (!pozajmica) {
    throw new NotFoundError("Pozajmica nije pronađena");
  }

  res.json(pozajmica);
});

// POST /api/pozajmice - pozajmi knjigu
router.post("/", validate(novaPozajmicaSchema), (req: Request, res: Response) => {
  const podaci: NovaPozajmica = req.body;

  const knjiga = knjige.find((k) => k.id === podaci.knjigaId);
  if (!knjiga) {
    throw new NotFoundError("Knjiga nije pronađena");
  }

  const clan = clanovi.find((c) => c.id === podaci.clanId);
  if (!clan) {
    throw new NotFoundError("Član nije pronađen");
  }

  if (!knjiga.dostupna) {
    throw new ConflictError("Knjiga trenutno nije dostupna");
  }

  const novaPozajmica: Pozajmica = {
    id: generisiPozajmicaId(),
    knjigaId: podaci.knjigaId,
    clanId: podaci.clanId,
    datumPozajmljivanja: new Date().toISOString(),
    datumVracanja: null,
  };

  pozajmice.push(novaPozajmica);
  knjiga.dostupna = false;

  res.status(201).json(novaPozajmica);
});

// PUT /api/pozajmice/:id/vrati - vrati knjigu
router.put("/:id/vrati", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const pozajmica = pozajmice.find((p) => p.id === id);

  if (!pozajmica) {
    throw new NotFoundError("Pozajmica nije pronađena");
  }

  if (pozajmica.datumVracanja !== null) {
    throw new ConflictError("Knjiga je već vraćena");
  }

  pozajmica.datumVracanja = new Date().toISOString();

  const knjiga = knjige.find((k) => k.id === pozajmica.knjigaId);
  if (!knjiga) {
    return res.json(pozajmica);
  }

  const redZaKnjigu = rezervacije.filter(
    (r) => r.knjigaId === knjiga.id && r.status === "na_cekanju"
  );

  if (redZaKnjigu.length === 0) {
    knjiga.dostupna = true;
    return res.json(pozajmica);
  }

  const sljedeciURedu = redZaKnjigu[0];
  sljedeciURedu.status = "realizovana";

  const novaPozajmica: Pozajmica = {
    id: generisiPozajmicaId(),
    knjigaId: knjiga.id,
    clanId: sljedeciURedu.clanId,
    datumPozajmljivanja: new Date().toISOString(),
    datumVracanja: null,
  };
  pozajmice.push(novaPozajmica);

  res.json({
    vracenaPozajmica: pozajmica,
    novaPozajmicaIzReda: novaPozajmica,
    poruka: `Knjiga automatski dodijeljena članu iz reda čekanja (clanId: ${sljedeciURedu.clanId})`,
  });
});

export default router;
