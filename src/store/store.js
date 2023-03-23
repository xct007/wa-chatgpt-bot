/** from wabot-aq/games-wabot. Multi-Device */
const { join } = require("path");
const { Low, JSONFile } = require("./DB_Adapters/lowdb/index.js");

const lodash = require("lodash");

const { config } = require("../../config.js");

let database = new Low(new JSONFile("storechats.json"));

loadDatabase();

async function loadDatabase() {
	// If database is processed to be loaded from cloud, wait for it to be done
	if (database._read) {
		await database._read;
	}
	if (database.data !== null) {
		return database.data;
	}
	database._read = database.read().catch(console.error);
	await database._read;
	console.log("- Database loaded -");
	database.data = {
		users: {},
	};
	database.chain = lodash.chain(database.data);

	return database.data;
}

module.exports = { database, loadDatabase };
