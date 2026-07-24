import { z } from "zod";

export const novaKnjigaSchema = z.object({
  naslov: z.string().min(1, "Naslov je obavezan"),
  autorId: z.number().int().positive("autorId mora biti pozitivan broj"),
  godinaIzdanja: z
    .number()
    .int()
    .min(0)
    .max(new Date().getFullYear(), "Godina izdanja ne može biti u budućnosti"),
  dostupna: z.boolean().optional(),
});

// Ista pravila kao gore, ali SVAKO polje postaje opciono - za PUT/izmjenu,
// gdje korisnik salje samo ono sto zeli da promijeni.
export const azurirajKnjiguSchema = novaKnjigaSchema.partial();

// TypeScript tip se automatski izvodi iz seme - ne pišemo ga ručno
export type NovaKnjiga = z.infer<typeof novaKnjigaSchema>;
export type AzurirajKnjigu = z.infer<typeof azurirajKnjiguSchema>;
