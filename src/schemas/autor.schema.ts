import { z } from "zod";

export const noviAutorSchema = z.object({
  ime: z.string().min(1, "Ime autora je obavezno"),
  godinaRodjenja: z
    .number()
    .int()
    .min(0)
    .max(new Date().getFullYear(), "Godina rođenja ne može biti u budućnosti"),
  drzava: z.string().min(1, "Država je obavezna"),
});

export const azurirajAutoraSchema = noviAutorSchema.partial();

export type NoviAutor = z.infer<typeof noviAutorSchema>;
export type AzurirajAutora = z.infer<typeof azurirajAutoraSchema>;
