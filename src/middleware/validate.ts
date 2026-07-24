import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { BadRequestError } from "../errors/AppError";

// Generic middleware - radi za BILO KOJU zod semu, ne samo za knjige.
// <T> znaci da funkcija "prima" tip kao parametar, isto kao sto funkcija
// prima obicne argumente - samo sto ovo T utice na TIPOVE, ne na vrijednosti.
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const rezultat = schema.safeParse(req.body);

    if (!rezultat.success) {
      const poruke = rezultat.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      throw new BadRequestError(poruke);
    }

    // Prepisujemo req.body procisceni, validirani objekat
    // (Zod moze npr. ukloniti visak polja koja nisu u semi)
    req.body = rezultat.data;
    next();
  };
}
