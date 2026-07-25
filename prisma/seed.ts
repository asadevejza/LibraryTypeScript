import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Brisanje u obrnutom redoslijedu od zavisnosti (FK) - da ne pukne
  // ovo cini skriptu "idempotentnom": mozes je pokretati vise puta
  // bez da dobijes duplikate ili gresku zbog vec postojecih podataka.
  await prisma.rezervacije.deleteMany();
  await prisma.pozajmice.deleteMany();
  await prisma.knjige.deleteMany();
  await prisma.clanovi.deleteMany();
  await prisma.autori.deleteMany();

  const andric = await prisma.autori.create({
    data: { ime: "Ivo Andrić", godinaRodjenja: 1892, drzava: "Bosna i Hercegovina" },
  });

  const selimovic = await prisma.autori.create({
    data: { ime: "Meša Selimović", godinaRodjenja: 1910, drzava: "Bosna i Hercegovina" },
  });

  const kulenovic = await prisma.autori.create({
    data: { ime: "Skender Kulenović", godinaRodjenja: 1910, drzava: "Bosna i Hercegovina" },
  });

  const knjiga1 = await prisma.knjige.create({
    data: { naslov: "Na Drini ćuprija", autorId: andric.id, godinaIzdanja: 1945, dostupna: true },
  });

  const knjiga2 = await prisma.knjige.create({
    data: { naslov: "Derviš i smrt", autorId: selimovic.id, godinaIzdanja: 1966, dostupna: false },
  });

  await prisma.knjige.create({
    data: { naslov: "Prokleta avlija", autorId: andric.id, godinaIzdanja: 1954, dostupna: true },
  });

  const clan1 = await prisma.clanovi.create({
    data: { ime: "Asad Vejzović", email: "asad.vejzovic@edu.fit.ba", brojClanskeKarte: "A-001" },
  });

  const clan2 = await prisma.clanovi.create({
    data: { ime: "Adna Šunje", email: "adna.sunje@edu.fit.ba", brojClanskeKarte: "B-001" },
  });

  // primjer aktivne pozajmice (knjiga2 je zato dostupna: false gore)
  await prisma.pozajmice.create({
    data: {
      knjigaId: knjiga2.id,
      clanId: clan1.id,
      datumPozajmljivanja: new Date("2026-06-01"),
      datumVracanja: null,
    },
  });

  // primjer zavrsene pozajmice
  await prisma.pozajmice.create({
    data: {
      knjigaId: knjiga1.id,
      clanId: clan2.id,
      datumPozajmljivanja: new Date("2026-05-01"),
      datumVracanja: new Date("2026-05-15"),
    },
  });

  // primjer rezervacije (za nedostupnu knjigu2)
  await prisma.rezervacije.create({
    data: {
      knjigaId: knjiga2.id,
      clanId: clan2.id,
      datumRezervacije: new Date("2026-06-05"),
      status: "na_cekanju",
    },
  });

  console.log("Seed završen.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });