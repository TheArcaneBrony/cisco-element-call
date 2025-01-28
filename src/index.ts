import { XAPI, connect } from "jsxapi";
import { run } from "./macro";
require("dotenv").config();

async function init() {
  const xapi = connect(process.env.ROOMKIT_URL!, {
    username: process.env.ROOMKIT_USER!,
    password: process.env.ROOMKIT_PASS!,
  });

  await run(xapi);
}

init().then(() => {});
