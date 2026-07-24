import { z } from "zod";

export const novaPozajmicaSchema = z.object({
  knjigaId: z.number().int().positive("knjigaId je obavezan"),
  clanId: z.number().int().positive("clanId je obavezan"),
});

export type NovaPozajmica = z.infer<typeof novaPozajmicaSchema>;
