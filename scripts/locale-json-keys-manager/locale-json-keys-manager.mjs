#!/usr/bin/env node

import fs from "fs";
import readline from "readline";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = dirname(currentFilePath);
const scanPathsFilePath = join(currentDirectoryPath, "./scan-paths.txt");
const logFileAbsolutePath = join(currentDirectoryPath, "./locale-json-keys-manager.log");

const appendLogMessage = (message) => {
  const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
  fs.appendFileSync(logFileAbsolutePath, `[${timestamp}] ${message}\n`);
};

const getLocaleDirectories = (basePath) => {
  try {
    const entries = fs.readdirSync(basePath, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(e => e.name);
  } catch {
    return [];
  }
};

const readJsonFile = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return {};
  }
};

const writeJsonFile = (filePath, json) => {
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n");
};

const setNestedValue = (object, keyPath, value) => {
  const keys = keyPath.split(".");
  let current = object;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
    } else {
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key];
    }
  });
};

const deleteNestedValue = (object, keyPath) => {
  const keys = keyPath.split(".");
  let current = object;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      return false;
    }
    current = current[keys[i]];
  }
  if (current[keys[keys.length - 1]] !== undefined) {
    delete current[keys[keys.length - 1]];
    cleanupEmptyObjects(object);
    return true;
  }
  return false;
};

const cleanupEmptyObjects = (object) => {
  for (const key of Object.keys(object)) {
    if (typeof object[key] === "object" && object[key] !== null) {
      cleanupEmptyObjects(object[key]);
      if (Object.keys(object[key]).length === 0) {
        delete object[key];
      }
    }
  }
};

const processAdd = async (basePath, fileName, keys, rl) => {
  const locales = getLocaleDirectories(basePath);
  for (const locale of locales) {
    appendLogMessage(`PROCESSING LOCALE: ${locale}`);
    const filePath = join(basePath, locale, fileName);
    const json = fs.existsSync(filePath) ? readJsonFile(filePath) : {};
    for (const key of keys) {
      const value = await new Promise(resolve => {
        rl.question(`Value for ${locale} -> ${key}: `, resolve);
      });
      setNestedValue(json, key, value);
      appendLogMessage(`KEY ADDED: ${key} -> ${filePath}`);
    }
    writeJsonFile(filePath, json);
  }
};

const processRemove = (basePath, fileName, keys) => {
  const locales = getLocaleDirectories(basePath);
  for (const locale of locales) {
    const filePath = join(basePath, locale, fileName);
    if (!fs.existsSync(filePath)) {
      appendLogMessage(`FILE NOT FOUND: ${filePath}`);
      continue;
    }
    const json = readJsonFile(filePath);
    for (const key of keys) {
      const removed = deleteNestedValue(json, key);
      if (removed) {
        appendLogMessage(`KEY REMOVED: ${key} -> ${filePath}`);
      } else {
        appendLogMessage(`KEY NOT FOUND: ${key} -> ${filePath}`);
      }
    }
    writeJsonFile(filePath, json);
  }
};

const askQuestion = (rl, question) => {
  return new Promise(resolve => rl.question(question, resolve));
};

const main = async () => {
  appendLogMessage("=====================================================================");
  appendLogMessage(`Locale JSON Keys Manager Started at ${new Date().toLocaleString()}`);
  appendLogMessage(`Scan paths file: ${scanPathsFilePath}`);
  appendLogMessage("=====================================================================");
  let scanPaths = [];
  if (fs.existsSync(scanPathsFilePath)) {
    scanPaths = fs
      .readFileSync(scanPathsFilePath, "utf-8")
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith("#"));
  }
  if (scanPaths.length === 0) {
    appendLogMessage(`WARNING: No valid scan paths found in ${scanPathsFilePath}, using ../../server and ../../client as default`);
    console.warn(`No valid scan paths found in ${scanPathsFilePath}, using ../../server and ../../client as default`);
    workspacePaths = ["../../server", "../../client"];
  }
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const action = await askQuestion(rl, "Action (add/remove): ");
  const fileName = await askQuestion(rl, "Target file name: ");
  const keys = [];
  while (true) {
    const key = await askQuestion(rl, "Enter key (empty to finish): ");
    if (!key) break;
    keys.push(key);
  }
  for (const scanPath of scanPaths) {
    appendLogMessage("");
    appendLogMessage("-------------------------------------------------------------");
    appendLogMessage(`Scanning directory: ${scanPath}`);
    appendLogMessage("-------------------------------------------------------------");
    if (!fs.existsSync(scanPath)) {
      appendLogMessage(`WARNING: Directory does not exist: ${scanPath}`);
      continue;
    }
    if (action === "add") {
      await processAdd(scanPath, fileName, keys, rl);
    }
    if (action === "remove") {
      processRemove(scanPath, fileName, keys);
    }
  }
  rl.close();
  appendLogMessage("");
  appendLogMessage("=====================================================================");
  appendLogMessage(`Operation Completed at ${new Date().toLocaleString()}`);
  appendLogMessage("=====================================================================");
  console.log(`Log saved to: ${logFileAbsolutePath}`);
};

await main();
