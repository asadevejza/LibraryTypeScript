import { Router, Request, Response } from "express";
import { rezervacije, generisiRezervacijaId } from "../data/rezervacija.data";
import { knjige } from "../data/knjige.data";
import { clanovi } from "../data/clan.data";
import { Rezervacija, StatusRezervacije } from "../models/rezervacija.model";
import { NotFoundError, ConflictError } from "../errors/AppError";
import { validate } from "../middleware/validate";
import { novaRezervacijaSchema, NovaRezervacija } from "../schemas/rezervacija.schema";
import { paginiraj, parsirajStranicenje } from "../utils/paginacija";

const router = Router();

// Lista svih dozvoljenih statusa - koristimo je za validaciju ?status= filtera.
// TypeScript ne provjerava ovo automatski u obicnom nizu, ali barem znamo
// da svaka vrijednost ovdje mora biti tacno StatusRezervacije, jer smo
// eksplicitno napisali tip niza.
const SVI_STATUSI: StatusRezervacije[] = ["na_cekanju", "realizovana", "otkazana"];

// GET /api/rezervacije - vrati rezervacije, uz opciono filtriranje/sortiranje/paginaciju
// /api/rezervacije?clanId=1&status=na_cekanju&sortiraj=datumRezervacije&strana=1&limit=10
router.get("/", (req: Request, res: Response) => {
  let rezultat: Rezervacija[] = [...rezervacije];

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
      (a, b) => a.datumRezervacije.localeCompare(b.datumRezervacije) * smjer
    );
  }

  const { strana, limit } = parsirajStranicenje(req.query);
  res.json(paginiraj(rezultat, strana, limit));
});

// GET /api/rezervacije/knjiga/:knjigaId - red cekanja za odredjenu knjigu
// (samo one koje su jos "na_cekanju" - realizovane/otkazane vise ne cekaju)
router.get("/knjiga/:knjigaId", (req: Request, res: Response) => {
  const knjigaId = Number(req.params.knjigaId);
  const red = rezervacije.filter(
    (r) => r.knjigaId === knjigaId && r.status === "na_cekanju"
  );
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

  // provjeravamo samo AKTIVNE rezervacije - ako je clan ranije rezervisao istu
  // knjigu, ali je ta rezervacija vec realizovana ili otkazana, smije opet
  const vecRezervisao = rezervacije.some(
    (r) => r.knjigaId === podaci.knjigaId && r.clanId === podaci.clanId && r.status === "na_cekanju"
  );
  if (vecRezervisao) {
    throw new ConflictError("Već imate aktivnu rezervaciju za ovu knjigu");
  }

  const novaRezervacija: Rezervacija = {
    id: generisiRezervacijaId(),
    knjigaId: podaci.knjigaId,
    clanId: podaci.clanId,
    datumRezervacije: new Date().toISOString(),
    status: "na_cekanju",
  };

  rezervacije.push(novaRezervacija);
  res.status(201).json(novaRezervacija);
});

// DELETE /api/rezervacije/:id - otkazi rezervaciju
// (ne brisemo je fizicki - samo joj mijenjamo status, da sacuvamo istoriju)
router.delete("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const rezervacija = rezervacije.find((r) => r.id === id);

  if (!rezervacija) {
    throw new NotFoundError("Rezervacija nije pronađena");
  }

  if (rezervacija.status !== "na_cekanju") {
    throw new ConflictError("Samo rezervacija koja čeka u redu se može otkazati");
  }

  rezervacija.status = "otkazana";
  res.status(204).send();
});

export default router;
