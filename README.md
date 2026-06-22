# Velora

Velora is a full-stack TypeScript monorepo that combines a modern web client with a structured backend service.
The project is designed with modularity, internationalization, containerized development, and Docker-based deployment in mind.

This repository contains everything required to run the server and client either locally or via Docker.

---

## Features

- **Full-stack TypeScript** using a single monorepo
- **Backend service** built with Nest.js
- **Client-side application** built with Next.js
- **Internationalization (i18next)** support for multiple locales
- **Docker & Docker Compose** support for local development
- **Yarn & Turborepo** for dependency and task management

---

## Requirements

To work with this project locally, you will need:

- **Node.js** (LTS recommended)
- **Yarn**
- **Docker** (optional, recommended for consistent environments)

---

## Installation

Install all workspace dependencies from the repository root:

```bash
yarn install
```

---

## Initialization (Important)

After installing dependencies (`yarn install`) and **before running any development or deployment commands**, you must run the following scripts in order to properly prepare the environment.

### 1. Synchronize Workspace Environment

```bash
node ./scripts/workspace-environment-synchronize/workspace-environment-synchronize.mjs
```

This script is responsible for:

- Copying and synchronizing environment configuration across the workspace
- Ensuring all packages and services use consistent environment variables
- Preparing workspace environment files such as `.env.development.local` and `.env.production.local`

### 2. Generate Deployment Initialisation Script

```bash
node ./scripts/deploy-initialisation-script-generator/deploy-initialisation-script-generator.mjs
```

This script is responsible for:

- Reading the synchronized environment configuration
- Generating deployment initialisation scripts
- Preparing runtime initialisation logic for Docker-based deployment

### Why this is required

These steps ensure:

- Consistent environment configuration across services
- Correct generation of deployment initialization scripts
- Stable Docker runtime behavior
- Prevention of missing or incorrect environment setup

Skipping these steps may result in:

- Service startup failures
- Incorrect configuration loading
- Deployment inconsistencies

---

## Development

### Running with Docker

The easiest way to run the full stack is via Docker Compose:

```bash
yarn build
yarn docker:pull
yarn docker:build
yarn docker:up
```

This will start all required services defined in `./deploy/docker/docker-compose.

### Local Development (Without Docker)

You may also run the server and client independently.

#### Server

```bash
cd ./server
yarn start:dev
```

#### Client

```bash
cd ./client
yarn dev
```

#### All

```bash
yarn dev
```

Refer to each subproject's configuration files for environment variables and runtime options.

---

## Internationalization (i18next)

Both the client and server include structured internationalization support.

- Locale resources are stored under:
  - `./server/src/i18n/`
  - `./client/src/i18n/locales/`
- i18next configuration is centralized and extensible for additional languages.

---

## Project Status

This project is actively maintained as a general-purpose codebase and technical foundation.  
Updates and improvements are made as needed.

---

## License

This project is licensed under the **Apache License 2.0**.  
See the [LICENSE](LICENSE) file for full details.
