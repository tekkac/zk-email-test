import * as path from "path";
// @ts-ignore
import { generateCircuitInputs } from "./lib/generate_inputs";
import { packedNBytesToString } from "@zk-email/helpers";
import * as fs from "fs";

const wasm_tester = require("circom_tester").wasm;
const externalInputs = {};
// Either download the .eml file or click "show original" in your email client and copy the entire raw email (together with the headers)

const emailFile = "email.eml";
const rawEmail = Buffer.from(fs.readFileSync(emailFile, "utf8"));

try {
  (async () => {
    if (!rawEmail || !rawEmail.includes("DKIM-Signature:")) {
      console.error(
        "raw email is missing, update index.ts to paste the entire email (header + body)"
      );
      process.exit(1);
    }
    let inputs = await generateCircuitInputs(rawEmail, externalInputs);
    console.log(inputs);

    const cir = await wasm_tester(
      path.join(__dirname, "./circuit/footprint.circom"),
      {
        include: path.join(__dirname, "./node_modules"),
        output: path.join(__dirname, "./build/test_footprint"),
        recompile: true,
        verbose: true,
      }
    );

    const witness = await cir.calculateWitness(inputs, true);
    await cir.checkConstraints(witness);

    let currentIndex = 2;

    {
      const packedLength = 1;
      const packedValue = witness.slice(
        currentIndex,
        currentIndex + packedLength
      );
      const unpackedValue = packedNBytesToString(packedValue);
      console.log("tonnes: ", unpackedValue);
      currentIndex += packedLength;
    }
  })();
} catch (e) {
  console.error("caught error: ", e);
}
