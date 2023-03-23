const fs = require("fs");
const { join } = require("path");
const { setupMaster, fork } = require("cluster");

let isRunning = false;

function run(file) {
	if (isRunning) {
		return;
	}
	isRunning = true;
	const args = [join(__dirname, file)];
	setupMaster({
		exec: args[0],
		args: args.slice(1),
	});
	const _fork = fork();
	_fork.on("message", (data) => {
		console.log(data);
	});
	_fork.on("exit", (code) => {
		throw code;
	});
}
run("src/index.js");
