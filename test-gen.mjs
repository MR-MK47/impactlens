import { Generator } from '@tanstack/router-generator';
import { getConfig } from '@tanstack/router-generator';

async function test() {
  try {
    const config = await getConfig({}, process.cwd());
    const generator = new Generator({
      config,
      root: process.cwd(),
    });
    await generator.run();
    console.log("Success!");
  } catch (err) {
    console.error("GENERATOR ERROR:");
    console.error(err);
  }
}

test();
