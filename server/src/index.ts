import "dotenv/config";
import { createApp } from "./app";

const port = Number(process.env.PORT ?? 4000);

createApp().listen(port, () => {
  console.log(`TPID IPH API ready on http://localhost:${port}`);
});