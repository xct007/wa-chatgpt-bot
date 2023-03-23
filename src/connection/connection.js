/**
 * @ref https://github.com/adiwajshing/baileys/blob/master/Example/example.ts
 */
const { Boom } = require("@hapi/boom");
const NodeCache = require("node-cache");
const Pino = require("pino");
const {
	default: makeWaSocket,
	DisconnectReason,
	useMultiFileAuthState,
	fetchLatestBaileysVersion,
	makeCacheableSignalKeyStore,
} = require("@adiwajshing/baileys");

const { config } = require("../../config.js");

const logger = Pino().child({ level: "trace" });

const msgRetryCounterCache = new NodeCache();

const connect = async () => {
	const { state, saveCreds } = await useMultiFileAuthState(
		"./baileys_auth_sessions"
	);

	const { version, isLatest } = await fetchLatestBaileysVersion();
	console.log(`using WA: ${version.join(".")}, isLatest: ${isLatest}`);

	const sock = makeWaSocket({
		version,
		logger,
		printQRInTerminal: true,
		syncFullHistory: true,
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger),
		},
		msgRetryCounterCache,
	});
	sock.ev.process(async (events) => {
		// connection update
		if (events["connection.update"]) {
			const update = events["connection.update"];
			const { connection, lastDisconnect } = update;
			if (connection === "close") {
				const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
				if (reason !== DisconnectReason.loggedOut) {
					connect();
				} else {
					console.log("Connection close. You are logged out.");
				}
			}
			console.log({ connection });
		}
		// creds update
		if (events["creds.update"]) {
			await saveCreds();
		}
		// reject call events
		if (events.call) {
			const call = events.call[0];
			if (call.status === "offer" && config.rejectCall) {
				sock.rejectCall(call.id, call.from);
			}
		}
		// message receive
		if (events["messages.upsert"]) {
			const upsert = events["messages.upsert"];
			if (upsert.type === "notify") {
				require("./handler.js")(sock, upsert);
			}
		}
	});
};
exports.connection = connect;
