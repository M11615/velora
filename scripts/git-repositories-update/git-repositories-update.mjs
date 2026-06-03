#!/usr/bin/env node

import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { exec, spawn } from "child_process";

const executeCommandAsync = promisify(exec);
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = dirname(currentFilePath);
const repositoryListFilePath = join(currentDirectoryPath, "./repositories.txt");
const fullHistoryRepositoryFilePath = join(currentDirectoryPath, "./full-history-repositories.txt");
const logFileAbsolutePath = join(currentDirectoryPath, "./git-repositories-update.log");
const stateFilePath = join(currentDirectoryPath, "./git-repositories-update-state.json");

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

const delay = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

const loadRepositoryList = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, "utf-8")
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#"));
};

const getGitSizeMB = (repositoryPath) => {
  try {
    const gitPath = join(repositoryPath, ".git");
    const getSize = (directoryPath) => {
      let total = 0;
      const files = fs.readdirSync(directoryPath, { withFileTypes: true });
      for (const file of files) {
        const fullPath = join(directoryPath, file.name);
        if (file.isDirectory()) {
          total += getSize(fullPath);
        } else {
          total += fs.statSync(fullPath).size;
        }
      }
      return total;
    };
    return getSize(gitPath) / (1024 * 1024);
  } catch {
    return 0;
  }
};

const runGitCommand = async (cmd, cwd, label) => {
  try {
    appendLogMessage(`Running: ${label}`);
    const { stdout } = await executeCommandAsync(cmd, { cwd });
    const output = stdout?.trim();
    if (output) {
      appendLogMessage(output);
    } else {
      appendLogMessage(`Success: ${label}: OK (no output)`);
    }
  } catch (error) {
    appendLogMessage(`Failed: ${label}: ${error.message}`);
    throw error;
  }
};

const main = async () => {
  const resumeState = readState();
  let repositoryPaths = loadRepositoryList(repositoryListFilePath);
  let fullHistoryRepositories = new Set(loadRepositoryList(fullHistoryRepositoryFilePath));
  if (repositoryPaths.length === 0) {
    appendLogMessage(`WARNING: No valid repository paths found in ${repositoryListFilePath}, using ../.. as default`);
    console.warn(`No valid repository paths found in ${repositoryListFilePath}, using ../.. as default`);
    repositoryPaths = ["../.."];
    fullHistoryRepositories.add("../..");
  }
  const totalRepositoryCount = repositoryPaths.length;
  let successfulRepositoryCount = 0;
  const retryCountsByRepository = new Map();
  appendLogMessage("=====================================================================");
  appendLogMessage(`Batch Git Batch Update Process Started at ${new Date().toLocaleString()}`);
  appendLogMessage(`Repositories file: ${repositoryListFilePath}`);
  appendLogMessage("=====================================================================");
  const startRepositoryIndex = resumeState?.repositoryIndex ?? 0;
  for (let repositoryIndex = startRepositoryIndex; repositoryIndex < repositoryPaths.length; repositoryIndex++) {
    const repositoryPath = repositoryPaths[repositoryIndex];
    writeState({ repositoryIndex });
    appendLogMessage("");
    appendLogMessage("-------------------------------------------------------------");
    appendLogMessage(`[${repositoryIndex + 1}/${totalRepositoryCount}] Processing repository: ${repositoryPath}`);
    appendLogMessage("-------------------------------------------------------------");
    if (fs.existsSync(join(repositoryPath, ".git"))) {
      let isUpdateSuccessful = false;
      let retryCount = 0;
      const gitSizeMB = getGitSizeMB(repositoryPath);
      appendLogMessage(`Git size: ${gitSizeMB.toFixed(2)} MB`);
      while (!isUpdateSuccessful) {
        try {
          const { stdout: remoteUrl } = await executeCommandAsync(
            "git remote get-url origin",
            { cwd: repositoryPath }
          );
          const isFullHistory = fullHistoryRepositories.has(repositoryPath);
          if (isFullHistory) {
            appendLogMessage("Mode: FULL HISTORY (git pull)");
            await runGitCommand("git pull", repositoryPath, "git pull");
          } else {
            appendLogMessage("Mode: SHALLOW (rebuild latest snapshot)");
            await runGitCommand("git fetch --depth=1 origin", repositoryPath, "git fetch");
            await runGitCommand("git reset --hard origin/HEAD", repositoryPath, "git reset");
            await runGitCommand("git gc --prune=now", repositoryPath, "git gc");
          }
          appendLogMessage(`Update completed - Remote: ${remoteUrl.trim()}, Local: ${repositoryPath}`);
          successfulRepositoryCount++;
          isUpdateSuccessful = true;
        } catch (error) {
          retryCount++;
          retryCountsByRepository.set(repositoryPath, retryCount);
          appendLogMessage(`git pull failed for ${repositoryPath}: ${error.message}`);
          appendLogMessage("Retrying in 5 seconds...");
          await delay(5000);
        }
      }
    } else {
      appendLogMessage(`Warning: ${repositoryPath} is not a valid Git repository.`);
    }
  }
  appendLogMessage("");
  appendLogMessage("=====================================================================");
  appendLogMessage(`Batch Git Batch Update Process Completed at ${new Date().toLocaleString()}`);
  appendLogMessage("=====================================================================");
  appendLogMessage(`Total Repositories: ${totalRepositoryCount}`);
  appendLogMessage(`Successfully Updated: ${successfulRepositoryCount}`);
  if (retryCountsByRepository.size > 0) {
    appendLogMessage("Repositories with Retries:");
    for (const [repositoryPath, retryCount] of retryCountsByRepository.entries()) {
      appendLogMessage(`${repositoryPath} - Retries: ${retryCount}`);
    }
  }
  appendLogMessage("=====================================================================");
  console.log(`All repositories processed. Log saved to: ${logFileAbsolutePath}`);
  clearState();
};

await main();
