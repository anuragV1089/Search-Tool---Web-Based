import express from "express";
import cors from "cors";
import { searchRouter } from "./routes/search_lcel";
import { env } from "./shared/env";
import { kbRouter } from "./routes/light_rag_kb";

const app = express();

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN,
  }),
);
app.use(express.json());

app.use("/search", searchRouter);
app.use("/kb", kbRouter);

const port = Number(env.PORT) || 5000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
