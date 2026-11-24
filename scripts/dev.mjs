import { spawn } from "node:child_process";

// Runs API and web together. Each runs in its own process group, so stopping this
// script stops every process under it, even tools that ignore Ctrl+C.
const FORCE_STOP_AFTER_MS = 3000;

const children = ["@fleetshift/api", "@fleetshift/web"].map((workspace) =>
  spawn("npm", ["run", "dev", "-w", workspace], {
    stdio: "inherit",
    detached: true,
  }),
);

const signalGroup = (pid, signal) => {
  try {
    process.kill(-pid, signal);
  } catch {
    // The group has already exited.
  }
};

let stopping = false;
const stopAll = (code) => {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) {
    if (child.pid !== undefined) signalGroup(child.pid, "SIGTERM");
  }
  setTimeout(() => {
    for (const child of children) {
      if (child.pid !== undefined) signalGroup(child.pid, "SIGKILL");
    }
    process.exit(code);
  }, FORCE_STOP_AFTER_MS).unref();
};

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => {
    stopAll(0);
  });
}

for (const child of children) {
  child.on("exit", (code) => {
    stopAll(code ?? 1);
  });
}
