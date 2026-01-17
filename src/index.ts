import { XAPI, connect } from "jsxapi";
import { run } from "./macro";
require("dotenv").config();

// @ts-ignore
global.clientAuth = {
  "user_id": process.env.ROOMKIT_MATRIX_USER_ID,
  "device_id": process.env.ROOMKIT_MATRIX_DEVICE_ID,
  "access_token": process.env.ROOMKIT_MATRIX_ACCESS_TOKEN,
  "passwordlessUser": process.env.ROOMKIT_MATRIX_PASSWORDLESS_USER,
  "tempPassword": process.env.ROOMKIT_MATRIX_TEMP_PASSWORD
};

async function init() {
  const xapi = connect(process.env.ROOMKIT_URL!, {
    username: process.env.ROOMKIT_USER!,
    password: process.env.ROOMKIT_PASS!,
  });

  await run(xapi);
}

init().then(() => {});
