#!/usr/bin/env node

import fs from "fs";
import { dirname, join, resolve, basename } from "path";
import { fileURLToPath } from "url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = dirname(currentFilePath);
const workspacePathsFilePath = join(currentDirectoryPath, "./workspace-paths.txt");
const logFileAbsolutePath = join(currentDirectoryPath, "./workspace-env-sync.log");
const ENVIRONMENT_FILES = [
  { temporaryFileName: "temporary.env.development.local", environmentFileName: ".env.development.local" },
  { temporaryFileName: "temporary.env.production.local", environmentFileName: ".env.production.local" }
];

const appendLogMessage = (message) => {
  const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
  fs.appendFileSync(logFileAbsolutePath, `[${timestamp}] ${message}\n`);
};

const copyFileWithBackup = (sourceFilePath, destinationFilePath) => {
  if (!fs.existsSync(sourceFilePath)) {
    appendLogMessage(`SKIPPED: Source file not found: ${sourceFilePath}`);
    return;
  }
  try {
    if (fs.existsSync(destinationFilePath)) {
      const backupFileName = `backup.${Date.now()}.${basename(destinationFilePath)}`;
      const backupFilePath = join(dirname(destinationFilePath), backupFileName);
      fs.renameSync(destinationFilePath, backupFilePath);
      appendLogMessage(`BACKUP CREATED: ${backupFilePath}`);
    }
    fs.copyFileSync(sourceFilePath, destinationFilePath);
    appendLogMessage(`COPIED: ${sourceFilePath} -> ${destinationFilePath}`);
  } catch (error) {
    appendLogMessage(`ERROR copying file: ${sourceFilePath} -> ${destinationFilePath} - ${error.message}`);
  }
};

const processWorkspaceDirectory = (workspaceDirectory) => {
  const absoluteWorkspaceDirectory = resolve(currentDirectoryPath, workspaceDirectory);
  appendLogMessage("");
  appendLogMessage("-------------------------------------------------------------");
  appendLogMessage(`Processing workspace directory: ${absoluteWorkspaceDirectory}`);
  appendLogMessage("-------------------------------------------------------------");
  if (!fs.existsSync(absoluteWorkspaceDirectory)) {
    appendLogMessage(`WARNING: Workspace directory does not exist: ${absoluteWorkspaceDirectory}`);
    return;
  }
  for (const { temporaryFileName, environmentFileName } of ENVIRONMENT_FILES) {
    const absoluteSourceFilePath = join(absoluteWorkspaceDirectory, temporaryFileName);
    const absoluteDestinationFilePath = join(absoluteWorkspaceDirectory, environmentFileName);
    copyFileWithBackup(absoluteSourceFilePath, absoluteDestinationFilePath);
  }
};

const main = () => {
  appendLogMessage("=====================================================================");
  appendLogMessage(`Workspace Environment Synchronize Started at ${new Date().toLocaleString()}`);
  appendLogMessage(`Workspace paths file: ${workspacePathsFilePath}`);
  appendLogMessage("=====================================================================");
  let workspacePaths = [];
  if (fs.existsSync(workspacePathsFilePath)) {
    workspacePaths = fs
      .readFileSync(workspacePathsFilePath, "utf-8")
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith("#"));
  }
  if (workspacePaths.length === 0) {
    appendLogMessage(`WARNING: No valid workspace paths found in ${workspacePathsFilePath}, using ../../server and ../../client as default`);
    console.warn(`No valid workspace paths found in ${workspacePathsFilePath}, using ../../server and ../../client as default`);
    workspacePaths = ["../../server", "../../client"];
  }
  for (const workspacePath of workspacePaths) {
    processWorkspaceDirectory(workspacePath);
  }
  appendLogMessage("");
  appendLogMessage("=====================================================================");
  appendLogMessage(`Workspace Environment Synchronize Completed at ${new Date().toLocaleString()}`);
  appendLogMessage(`Processed Workspace Count: ${workspacePaths.length}`);
  appendLogMessage("=====================================================================");
  console.log(`Log saved to: ${logFileAbsolutePath}`);
};

main();
