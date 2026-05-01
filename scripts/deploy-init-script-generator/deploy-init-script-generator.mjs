#!/usr/bin/env node

import fs from "fs";
import { dirname, join, resolve, basename } from "path";
import { fileURLToPath } from "url";
import { minify } from "terser";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = dirname(currentFilePath);
const environmentPathsFilePath = join(currentDirectoryPath, "./env-paths.txt");
const deployInitialisationPathsFilePath = join(currentDirectoryPath, "./deploy-init-paths.txt");
const logFileAbsolutePath = join(currentDirectoryPath, "./deploy-init-script-generator.log");
const SCRIPT_TEMPLATES = {
  "mongo/create-user.js": (environment) => {
    return `
db = db.getSiblingDB("${environment.MONGO_DATABASE}");

db.createUser({
  user: "${environment.MONGO_USERNAME}",
  pwd: "${environment.MONGO_PASSWORD}",
  roles: [
    { role: "readWrite", db: "${environment.MONGO_DATABASE}" }
  ]
});
    `;
  }
};

const appendLogMessage = (message) => {
  const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
  fs.appendFileSync(logFileAbsolutePath, `[${timestamp}] ${message}\n`);
};

const readLinesFile = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, "utf-8")
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#"));
};

const getEnvironmentPaths = () => {
  const environmentPaths = readLinesFile(environmentPathsFilePath);
  if (environmentPaths.length === 0) {
    appendLogMessage(`WARNING: No valid environment paths found in ${environmentPathsFilePath}, using ../../server/.env.production.local as default`);
    console.warn(`No valid environment paths found in ${environmentPathsFilePath}, using ../../server/.env.production.local as default`);
    return ["../../server/.env.production.local"];
  }
  return environmentPaths;
};

const getDeployInitialisationPaths = () => {
  const deployInitialisationPaths = readLinesFile(deployInitialisationPathsFilePath);
  if (deployInitialisationPaths.length === 0) {
    appendLogMessage(`WARNING: No valid deploy initialisation paths found in ${deployInitialisationPathsFilePath}, using ../../deploy/initialisation as default`);
    console.warn(`No valid deploy initialisation paths found in ${deployInitialisationPathsFilePath}, using ../../deploy/initialisation as default`);
    return ["../../deploy/initialisation"];
  }
  return deployInitialisationPaths;
};

const parseEnvironmentFile = (environmentFilePath) => {
  if (!fs.existsSync(environmentFilePath)) {
    appendLogMessage(`SKIP env not found: ${environmentFilePath}`);
    return {};
  }
  const environment = {};
  const content = fs.readFileSync(environmentFilePath, "utf-8");
  content.split(/\r?\n/).forEach(line => {
    const t = line.trim();
    if (!t || t.startsWith("#")) return;
    const [k, ...v] = t.split("=");
    environment[k.trim()] = v.join("=").trim();
  });
  return environment;
};

const writeScript = (baseDir, relativePath, content) => {
  const outputPath = join(baseDir, relativePath);
  const directory = dirname(outputPath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  fs.writeFileSync(outputPath, content, "utf-8");
  appendLogMessage(`GENERATED: ${outputPath}`);
};

const ensureTrailingNewlineAndMinify = async (raw) => {
  const result = await minify(raw);
  return (result.code ?? "").endsWith("\n")
    ? (result.code ?? "")
    : (result.code ?? "") + "\n";
};

const processDeployDirectory = async (deployDirectory, environments) => {
  const absoluteDeployDirectory = resolve(currentDirectoryPath, deployDirectory);
  appendLogMessage("");
  appendLogMessage("-------------------------------------------------------------");
  appendLogMessage(`Deploy directory: ${absoluteDeployDirectory}`);
  appendLogMessage("-------------------------------------------------------------");
  if (!fs.existsSync(absoluteDeployDirectory)) {
    appendLogMessage(`WARNING missing deploy directory: ${absoluteDeployDirectory}`);
    return;
  }
  for (const environment of environments) {
    for (const [scriptPath, templateFunction] of Object.entries(SCRIPT_TEMPLATES)) {
      const rawScriptContent = templateFunction(environment);
      const scriptContent = await ensureTrailingNewlineAndMinify(rawScriptContent);
      writeScript(absoluteDeployDirectory, scriptPath, scriptContent);
    }
  }
};

const main = async () => {
  appendLogMessage("=====================================================================");
  appendLogMessage(`Deploy Initialisation Script Generator Started at ${new Date().toLocaleString()}`);
  appendLogMessage(`Environment paths file: ${environmentPathsFilePath}`);
  appendLogMessage(`Deploy initialisation paths file: ${deployInitialisationPathsFilePath}`);
  appendLogMessage("=====================================================================");
  const environmentPaths = getEnvironmentPaths();
  const deployInitialisationPaths = getDeployInitialisationPaths();
  const environments = [];
  for (const environmentPath of environmentPaths) {
    const absolutePath = resolve(currentDirectoryPath, environmentPath);
    const parsed = parseEnvironmentFile(absolutePath);
    if (Object.keys(parsed).length > 0) {
      environments.push(parsed);
      appendLogMessage(`LOADED ENVIRONMENT: ${absolutePath}`);
    }
  }
  for (const deployInitialisationPath of deployInitialisationPaths) {
    await processDeployDirectory(deployInitialisationPath, environments);
  }
  appendLogMessage("");
  appendLogMessage("=====================================================================");
  appendLogMessage(`Deploy Initialisation Script Generator Completed at ${new Date().toLocaleString()}`);
  appendLogMessage(`Processed Deploy Initialisation Count: ${deployInitialisationPaths.length}`);
  appendLogMessage("=====================================================================");
  console.log(`Log saved to: ${logFileAbsolutePath}`);
};

await main();
