-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "status_rezervacije" AS ENUM ('na_cekanju', 'realizovana', 'otkazana');

-- CreateTable
CREATE TABLE "knjige" (
    "id" SERIAL NOT NULL,
    "naslov" VARCHAR(255) NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "godina_izdanja" INTEGER NOT NULL,
    "dostupna" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "knjige_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autori" (
    "id" SERIAL NOT NULL,
    "ime" VARCHAR(255) NOT NULL,
    "godina_rodjenja" INTEGER NOT NULL,
    "drzava" VARCHAR(255) NOT NULL,

    CONSTRAINT "autori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clanovi" (
    "id" SERIAL NOT NULL,
    "ime" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "broj_clanske_karte" VARCHAR(50) NOT NULL,

    CONSTRAINT "clanovi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pozajmice" (
    "id" SERIAL NOT NULL,
    "knjiga_id" INTEGER NOT NULL,
    "clan_id" INTEGER NOT NULL,
    "datum_pozajmljivanja" DATE NOT NULL,
    "datum_vracanja" DATE,

    CONSTRAINT "pozajmice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rezervacije" (
    "id" SERIAL NOT NULL,
    "knjiga_id" INTEGER NOT NULL,
    "clan_id" INTEGER NOT NULL,
    "datum_rezervacije" DATE NOT NULL,
    "status" "status_rezervacije" NOT NULL DEFAULT 'na_cekanju',

    CONSTRAINT "rezervacije_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clanovi_email_key" ON "clanovi"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clanovi_broj_clanske_karte_key" ON "clanovi"("broj_clanske_karte");

-- AddForeignKey
ALTER TABLE "knjige" ADD CONSTRAINT "fk_knjige_autor" FOREIGN KEY ("autor_id") REFERENCES "autori"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pozajmice" ADD CONSTRAINT "fk_pozajmice_clan" FOREIGN KEY ("clan_id") REFERENCES "clanovi"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pozajmice" ADD CONSTRAINT "fk_pozajmice_knjiga" FOREIGN KEY ("knjiga_id") REFERENCES "knjige"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rezervacije" ADD CONSTRAINT "fk_rezervacije_clan" FOREIGN KEY ("clan_id") REFERENCES "clanovi"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rezervacije" ADD CONSTRAINT "fk_rezervacije_knjiga" FOREIGN KEY ("knjiga_id") REFERENCES "knjige"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

