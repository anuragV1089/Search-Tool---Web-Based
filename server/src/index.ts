import express from "express";
import cors from "cors";
import { searchRouter } from "./routes/search_lcel";
import { env } from "./shared/env";

const app = express();

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN,
  }),
);
app.use(express.json());

app.use("/search", searchRouter);

const port = env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
