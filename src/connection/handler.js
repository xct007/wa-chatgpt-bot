const fs = require("fs");
const { config } = require("../../config.js");
const { serialize, request } = require("../utils/index.js");

// TODO: save conversation.
const { database: db, loadDatabase } = require("../store/index.js");

module.exports = async (sock, upsert) => {
	if (!upsert) {
		return;
	}
	if (db.data !== null) {
		await loadDatabase();
	}

	sock.queue = sock.queue ? sock.queue : {};
	let msg = serialize(sock, upsert.messages[0]);

	//
	try {
		// wait
		if (msg.sender in sock.queue) {
			return;
		}

		// ignore if there not text message
		if (!msg.text) {
			return;
		}
		sock.queue[msg.sender] = true;
		if (config.readMessage) {
			sock.readMessages([msg.key]);
		}
		if (config.composing) {
			sock.sendPresenceUpdate("composing");
		}
		const { error, message } = await request([
			{
				role: "system",
				content: config.system,
			},
			{
				role: "user",
				content: msg.text,
			},
		]);
		await sock.sendMessage(
			msg.chat,
			{
				text: error ? "opps, error happen" : message,
			},
			{ quoted: msg }
		);
	} catch (error) {
		console.log(error);
	}
	delete sock.queue[msg.sender];
};
