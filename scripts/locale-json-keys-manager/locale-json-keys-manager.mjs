#!/usr/bin/env node

import fs from "fs";
import readline from "readline";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = dirname(currentFilePath);
const scanPathsFilePath = join(currentDirectoryPath, "./scan-paths.txt");
const logFileAbsolutePath = join(currentDirectoryPath, "./locale-json-keys-manager.log");
const stateFilePath = join(currentDirectoryPath, "./locale-json-keys-state.json");

const appendLogMessage = (message) => {
  const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
  fs.appendFileSync(logFileAbsolutePath, `[${timestamp}] ${message}\n`);
};

const readState = () => {
  try {
    return JSON.parse(fs.readFileSync(stateFilePath, "utf-8"));
  } catch {
    return null;
  }
};

const writeState = (state) => {
  fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2) + "\n");
};

const clearState = () => {
  if (fs.existsSync(stateFilePath)) {
    fs.unlinkSync(stateFilePath);
  }
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

const setNestedValue = (object, keyPath, value, position) => {
  const keys = keyPath.split(".");
  let current = object;
  keys.forEach((key, index) => {
    const isLast = index === keys.length - 1;
    if (isLast) {
      if (
        position === null ||
        position === undefined ||
        !Number.isInteger(position)
      ) {
        current[key] = value;
        return;
      }
      if (key in current) {
        delete current[key];
      }
      const entries = Object.entries(current);
      const safePosition = Math.max(0, Math.min(position, entries.length));
      entries.splice(safePosition, 0, [key, value]);
      const reordered = Object.fromEntries(entries);
      Object.keys(current).forEach(k => delete current[k]);
      Object.assign(current, reordered);
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

const processAdd = async (basePath, fileName, keys, rl, resumeState) => {
  const locales = getLocaleDirectories(basePath);
  let startLocaleIndex = resumeState?.localeIndex ?? 0;
  let startKeyIndex = resumeState?.keyIndex ?? 0;
  for (let li = startLocaleIndex; li < locales.length; li++) {
    const locale = locales[li];
    appendLogMessage(`PROCESSING LOCALE: ${locale}`);
    const filePath = join(basePath, locale, fileName);
    const json = fs.existsSync(filePath) ? readJsonFile(filePath) : {};
    for (let ki = (li === startLocaleIndex ? startKeyIndex : 0); ki < keys.length; ki++) {
      const key = keys[ki];
      writeState({
        basePath,
        fileName,
        localeIndex: li,
        keyIndex: ki
      });
      const value = await askQuestion(rl, `Value for ${locale} -> ${key}: `);
      const positionInput = await askQuestion(rl, `Position for ${locale} -> ${key} (empty = append): `);
      const position = positionInput.trim() === "" ? null : parseInt(positionInput, 10);
      setNestedValue(json, key, value, position);
      appendLogMessage(`KEY ADDED: ${key} -> ${filePath}`);
    }
    writeJsonFile(filePath, json);
    startKeyIndex = 0;
  }
  clearState();
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
  return new Promise(resolve =>
    rl.question(question, answer => resolve(answer.trim()))
  );
};

const main = async () => {
  const resumeState = readState();
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
    appendLogMessage(`WARNING: No valid scan paths found in ${scanPathsFilePath}, using ../.. as default`);
    console.warn(`No valid scan paths found in ${scanPathsFilePath}, using ../.. as default`);
    workspacePaths = ["../.."];
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
      await processAdd(scanPath, fileName, keys, rl, resumeState);
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
