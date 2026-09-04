import { amorcer } from "../src/lib/amorcage";

amorcer()
  .then((bilan) => { console.log("Amorçage terminé :", bilan); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); });
