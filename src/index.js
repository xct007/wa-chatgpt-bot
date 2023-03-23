const { connection } = require("./connection/index.js");
const { database, loadDatabase } = require("./store/index.js");
const { config } = require("../config.js");

connection();
loadDatabase();

let isRunning = false;

if (config.storeConversation) {
	storeChats();
}
async function storeChats() {
	if (isRunning) {
		return;
	}
	isRunning = true;
	setInterval(async () => {
		await Promise.allSettled([
			database.data !== null
				? database.write()
				: Promise.reject("users data error"),
		]);
	}, 60 * 1000);
}
