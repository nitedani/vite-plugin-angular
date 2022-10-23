#!/usr/bin/env node
const colors = require("colors");
const prompts = require("prompts");
const { exec } = require("promisify-child-process");
const tiged = require("tiged");

(async () => {
  const { projectName } = await prompts({
    type: "text",
    name: "projectName",
    message: "Project name:",
    validate: (value) => (value.length < 1 ? `At least 1 character` : true),
  });

  if (!projectName) {
    return;
  }

  const { template } = await prompts({
    message: "Select a template: " + "ssr/".green + "no ssr".blue,
    type: "select",
    name: "template",
    choices: [
      { title: "vps-express".green, value: "vps-express" },
      { title: "vps-express-telefunc".green, value: "vps-express-telefunc" },
      { title: "vps".green, value: "vps" },
      { title: "universal".green, value: "universal" },
      { title: "simple".blue, value: "simple" },
      { title: "material".blue, value: "material" },
      { title: "routing-module".blue, value: "routing-module" },
    ],
  });

  if (!template) {
    return;
  }

  const emitter = tiged(
    `github:nitedani/vite-plugin-angular/examples/${template}`,
    {
      cache: false,
      force: false,
      verbose: true,
    }
  );

  console.log(
    "Copying example from github.com/nitedani/vite-plugin-angular..."
  );

  await emitter.clone(projectName);

  console.log("Installing dependencies...");
  await exec(`cd ${projectName} && npm install --force --silent`);
  try {
    await exec(`git init ${projectName}`);
    await exec(`git -C ${projectName}/ add .`);
    await exec(`git -C ${projectName}/ commit -m"initial"`);
  } catch (error) {}
})();
