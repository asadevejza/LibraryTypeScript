import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

// Express prepoznaje ovo kao "error middleware" isključivo zato što ima
// 4 parametra (err, req, res, next) - ne 3 kao obični middleware/rute.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Type guard: provjeri da li je err zaista instanca AppError
  // (ili neke od klasa koje je nasljeđuju, poput NotFoundError).
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ poruka: err.message });
  }

  // Bilo šta drugo je neočekivana greška (bug u kodu, npr.) -
  // ne želimo korisniku otkriti detalje, samo generičku 500 poruku.
  console.error(err);
  res.status(500).json({ poruka: "Interna greška servera" });
}
