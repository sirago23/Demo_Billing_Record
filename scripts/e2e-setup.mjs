// Gives the E2E run a fresh database so results do not depend on earlier runs.
import { rmSync } from "node:fs";

for (const suffix of ["", "-wal", "-shm"]) rmSync(`data/e2e.db${suffix}`, { force: true });
