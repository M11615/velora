# Velora

Velora is a full-stack monorepo combining a modern web client, a structured backend service, an AI orchestration layer, and a cross-platform native application shell.
The project is designed with modularity, internationalisation, containerised development, and Docker-based deployment in mind.

This repository contains everything required to run all services either locally or via Docker.

---

## Features

- **Full-stack TypeScript** using a single monorepo
- **Backend service** built with NestJS — user accounts and website API
- **AI service** built with FastAPI — intent processing and LLM orchestration
- **Web client** built with Next.js — official website and landing pages
- **Rust core library** — device capability layer and Bridge foundation
- **Cross-platform application** built with Tauri + React — Desktop, Android, and iOS client shell
- **Internationalisation (i18next)** support for multiple locales
- **Docker and Docker Compose** support for backend services
- **Yarn and Turborepo** for dependency and task management across JavaScript/TypeScript workspaces
- **Cargo** workspace for Rust crates

---

## Repository Structure

```
velora/
├── apps/
│   ├── ai/            # FastAPI — intent processing, LLM orchestration
│   ├── app/           # Tauri + React — cross-platform client shell
│   ├── server/        # NestJS — user accounts, website API
│   └── web/           # Next.js — official website
├── crates/
│   └── core/          # Rust library — Bridge and device capability layer
├── deploy/            # Docker Compose and deployment configuration
├── scripts/           # Workspace utility scripts
├── Cargo.toml         # Cargo workspace root
└── package.json       # Yarn workspace root
```

---

## Requirements

To work with this project locally, you will need:

- **Node.js** (LTS recommended)
- **Yarn**
- **Rust** (via rustup)
- **Python 3.14+**
- **Docker** (optional, recommended for consistent environments)

---

## Installation

### 1. Install JavaScript/TypeScript dependencies

Install all workspace dependencies from the repository root:

```bash
yarn install
```

### 2. Set up the AI service environment

```bash
cd ./apps/ai
python -m venv ./.venv
```

Activate the virtual environment:

```bash
# Linux / macOS
source ./.venv/bin/activate

# Windows
./.venv/Scripts/Activate.ps1
```

Then install Python dependencies:

```bash
pip install -r ./requirements.txt
```

---

## Initialisation (Important)

After installing dependencies and **before running any development or deployment commands**, you must run the following scripts in order to properly prepare the environment.

### 1. Synchronise Workspace Environment

```bash
node ./scripts/workspace-environment-synchronise/workspace-environment-synchronise.mjs
```

This script is responsible for:

- Copying and synchronising environment configuration across the workspace
- Ensuring all packages and services use consistent environment variables
- Preparing workspace environment files such as `.env.development.local` and `.env.production.local`

### 2. Generate Deployment Initialisation Script

```bash
node ./scripts/deploy-initialisation-script-generator/deploy-initialisation-script-generator.mjs
```

This script is responsible for:

- Reading the synchronised environment configuration
- Generating deployment initialisation scripts
- Preparing runtime initialisation logic for Docker-based deployment

### Why this is required

These steps ensure:

- Consistent environment configuration across all services
- Correct generation of deployment initialisation scripts
- Stable Docker runtime behaviour
- Prevention of missing or incorrect environment setup

Skipping these steps may result in:

- Service startup failures
- Incorrect configuration loading
- Deployment inconsistencies

---

## Development

### Running backend services with Docker

The easiest way to run the server and AI backend is via Docker Compose:

```bash
yarn build
yarn docker:pull
yarn docker:build
yarn docker:up
```

This will start all required services defined in `./deploy/docker/docker-compose.yaml`.

### Local Development (Without Docker)

You may also run each service independently.

#### All services

```bash
yarn dev
```

#### Server service only

```bash
cd ./apps/server
yarn start:dev
```

#### AI service only

Ensure the virtual environment is activated, then:

```bash
cd ./apps/ai
yarn dev
```

#### Web service only

```bash
cd ./apps/web
yarn dev
```

#### Application (Tauri)
 
To develop with the full native shell (Rust + WebView), which is required for Bridge and device capability features:
 
```bash
cd ./apps/app
yarn tauri dev
```
 
To develop the frontend UI only (no Rust compilation, runs in the browser), which is faster for iterating on UI without needing the native shell:
 
```bash
cd ./apps/app
yarn dev
```

---

## Building

### All services

```bash
yarn build
```

#### Server service

```bash
cd ./apps/server
yarn build
```

### AI service (Python wheel)

Ensure the virtual environment is activated, then:

```bash
cd ./apps/ai
yarn build
```

#### Web service

```bash
cd ./apps/web
yarn build
```

### Rust core library

The core crate is compiled automatically as a dependency when building the Tauri application. It does not require a separate build step.

### Application (Tauri)

To build the frontend UI only (outputs static files to `./apps/app/dist/`, no Rust compilation):

```bash
cd ./apps/app
yarn build
```

To build the full native application for all target platforms (Linux, Windows, macOS, Android, iOS), the Tauri application is built via GitHub Actions. Push to the repository to trigger the build pipeline. Build artefacts are available for download from the Actions tab.

---

## Internationalisation (i18next)

Both the web client and server include structured internationalisation support.

- Locale resources are stored under:
  - `./apps/server/src/i18n/`
  - `./apps/web/src/app/i18n/locales/`
- i18next configuration is centralised and extensible for additional languages.

---

## Project Status

This project is actively maintained as a general-purpose codebase and technical foundation.
Updates and improvements are made as needed.

---

## License

This project is licensed under the **Apache License 2.0**.
See the [LICENSE](LICENSE) file for full details.
