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
const GIT_SIZE_LIMIT_MB = 512;

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

const rebuildShallowRepository = async (remoteUrl, repositoryPath) => {
  appendLogMessage(`Git size too large, rebuilding shallow repository: ${repositoryPath}`);
  fs.rmSync(repositoryPath, { recursive: true, force: true });
  await new Promise((resolve, reject) => {
    const child = spawn(
      "git",
      ["clone", "--progress", "--depth=1", remoteUrl, repositoryPath.split(/[/\\]/).pop()],
      { cwd: dirname(repositoryPath) }
    );
    let lastProgress = "";
    child.stderr.on("data", (data) => {
      const text = data.toString();
      process.stderr.write(text);
      const lines = text.split(/\r|\n/).filter(Boolean);
      if (lines.length > 0) {
        lastProgress = lines[lines.length - 1];
      }
    });
    child.on("close", (code) => {
      appendLogMessage(`Git final progress: ${lastProgress}`);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`git clone exited with code ${code}`));
      }
    });
    child.on("error", reject);
  });
  appendLogMessage(`Rebuilt shallow repository: ${repositoryPath}`);
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
      const gitSizeMB = getGitSizeMB(repositoryPath);
      appendLogMessage(`Git size: ${gitSizeMB.toFixed(2)} MB`);
      const { stdout: remoteUrl } = await executeCommandAsync(
        "git remote get-url origin",
        { cwd: repositoryPath }
      );
      const isFullHistory = fullHistoryRepositories.has(repositoryPath);
      if (!isFullHistory && gitSizeMB > GIT_SIZE_LIMIT_MB) {
        await rebuildShallowRepository(remoteUrl.trim(), repositoryPath);
        successfulRepositoryCount++;
        continue;
      }
      let isUpdateSuccessful = false;
      let retryCount = 0;
      while (!isUpdateSuccessful) {
        try {
          if (isFullHistory) {
            appendLogMessage("Mode: FULL HISTORY (git pull)");
            const { stdout: pullStdout, stderr: pullStderr } = await executeCommandAsync("git pull", { cwd: repositoryPath });
            if (pullStderr && !pullStdout.trim()) throw new Error(pullStderr);
            appendLogMessage(pullStdout.trim());
          } else {
            appendLogMessage("Mode: SHALLOW (rebuild latest snapshot)");
            const { stdout: fetchStdout, stderr: fetchStderr } = await executeCommandAsync(
              "git fetch --depth=1 origin",
              { cwd: repositoryPath }
            );
            if (fetchStderr && !fetchStdout.trim()) throw new Error(fetchStderr);
            appendLogMessage(fetchStdout.trim());
            const { stdout: resetStdout, stderr: resetStderr } = await executeCommandAsync(
              "git reset --hard origin/HEAD",
              { cwd: repositoryPath }
            );
            if (resetStderr && !resetStdout.trim()) throw new Error(resetStderr);
            appendLogMessage(resetStdout.trim());
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
