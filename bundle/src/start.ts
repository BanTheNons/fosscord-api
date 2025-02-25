// process.env.MONGOMS_DEBUG = "true";
import "reflect-metadata";
import cluster, { Worker } from "cluster";
import os from "os";
import { red, bold, yellow, cyan } from "nanocolors";
import { initStats } from "./stats";
import { config } from "dotenv";
config();
import { execSync } from "child_process";

// TODO: add socket event transmission
let cores = Number(process.env.THREADS) || os.cpus().length;

if (cluster.isMaster) {
	function getCommitOrFail() {
		try {
			return execSync("git rev-parse HEAD").toString().trim();
		} catch (e) {
			return null;
		}
	}
	const commit = getCommitOrFail();

	console.log(
		bold(`
███████╗ ██████╗ ███████╗███████╗ ██████╗ ██████╗ ██████╗ ██████╗
██╔════╝██╔═══██╗██╔════╝██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔══██╗
█████╗  ██║   ██║███████╗███████╗██║     ██║   ██║██████╔╝██║  ██║
██╔══╝  ██║   ██║╚════██║╚════██║██║     ██║   ██║██╔══██╗██║  ██║
██║     ╚██████╔╝███████║███████║╚██████╗╚██████╔╝██║  ██║██████╔╝
╚═╝      ╚═════╝ ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝

		fosscord-server | ${yellow(
			`Pre-relase (${
				commit !== null
					? commit.slice(0, 7)
					: "Unknown (Git cannot be found)"
			})`
		)}

Current commit: ${
			commit !== null
				? `${cyan(commit)} (${yellow(commit.slice(0, 7))})`
				: "Unknown (Git cannot be found)"
		}
`)
	);

	if (commit == null) {
		console.log(yellow(`Warning: Git is not installed or not in PATH.`));
	}

	initStats();

	console.log(`[Process] starting with ${cores} threads`);

	if (cores === 1) {
		require("./Server");
	} else {
		process.env.EVENT_TRANSMISSION = "process";

		// Fork workers.
		for (let i = 0; i < cores; i++) {
			cluster.fork();
			console.log(`[Process] worker ${i} started.`);
		}

		cluster.on("message", (sender: Worker, message: any) => {
			for (const id in cluster.workers) {
				const worker = cluster.workers[id];
				if (worker === sender || !worker) continue;
				worker.send(message);
			}
		});

		cluster.on("exit", (worker: any, code: any, signal: any) => {
			console.log(
				`[Worker] ${red(
					`died with pid: ${worker.process.pid} , restarting ...`
				)}`
			);
			cluster.fork();
		});
	}
} else {
	require("./Server");
}
