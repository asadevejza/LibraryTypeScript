import express from "express";
import cors from "cors";
import knjigeRoutes from "./routes/knjige.routes";
import autoriRoutes from "./routes/autor.routes";
import clanoviRoutes from "./routes/clan.router";
import pozajmiceRoutes from "./routes/pozajmica.routes";
import rezervacijeRoutes from "./routes/rezervacija.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use("/api/knjige", knjigeRoutes);
app.use("/api/autori", autoriRoutes);
app.use("/api/clanovi", clanoviRoutes);
app.use("/api/pozajmice", pozajmiceRoutes);
app.use("/api/rezervacije", rezervacijeRoutes);

// MORA biti poslednji app.use() - hvata greske iz svih ruta iznad
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server radi na http://localhost:${PORT}`);
});
