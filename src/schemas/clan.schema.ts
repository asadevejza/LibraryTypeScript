import { z } from "zod";

export const noviClanSchema = z.object({
  ime: z.string().min(1, "Ime je obavezno"),
  email: z.string().email("Email nije u ispravnom formatu"),
  brojClanskeKarte: z.string().optional(),
});

export const azurirajClanaSchema = noviClanSchema.partial();

export type NoviClan = z.infer<typeof noviClanSchema>;
export type AzurirajClana = z.infer<typeof azurirajClanaSchema>;
