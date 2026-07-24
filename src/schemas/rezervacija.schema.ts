import { z } from "zod";

export const novaRezervacijaSchema = z.object({
  knjigaId: z.number().int().positive("knjigaId je obavezan"),
  clanId: z.number().int().positive("clanId je obavezan"),
});

export type NovaRezervacija = z.infer<typeof novaRezervacijaSchema>;
