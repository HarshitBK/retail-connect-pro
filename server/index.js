import "dotenv/config";
import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "20mb" }));

registerRoutes(app);

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`AI API running at http://localhost:${PORT}`);
});
