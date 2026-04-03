import { Router } from "express";
import { SearchInputSchema } from "../utils/schema";
import { runSearch } from "../search_tool/search_chain";

export const searchRouter = Router();

searchRouter.post("/", async (req, res) => {
  try {
    const input = SearchInputSchema.parse(req.body);

    const result = await runSearch(input);

    return res.status(200).json(result);
  } catch (e) {
    const msg = (e as Error)?.message ?? "unknown error has occured";
    console.log(e);
    res.status(400).json({
      error: msg,
    });
  }
});
