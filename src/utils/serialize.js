const {
	getContentType,
	jidDecode,
	downloadContentFromMessage,
} = require("@adiwajshing/baileys");

const decodeJid = (jid) => {
	if (/:\d+@/gi.test(jid)) {
		const decode = jidDecode(jid) || {};
		return (
			(decode.user && decode.server && decode.user + "@" + decode.server) ||
			jid
		).trim();
	} else {
		return jid.trim();
	}
};

exports.serialize = (sock, msg) => {
	if (msg.key) {
		msg.id = msg.key.id;
		msg.isBaileys = msg.id.startsWith("BAE5") && msg.id.length === 16;
		msg.chat = msg.key.remoteJid;
		msg.fromMe = msg.key.fromMe;
		msg.isGroup = msg.chat.endsWith("@g.us");
		msg.sender = decodeJid(
			(msg.fromMe && sock.user.id) ||
				msg.participant ||
				msg.key.participant ||
				msg.chat ||
				""
		);
	}
	if (msg.message) {
		msg.type = getContentType(msg.message);
		if (msg.type === "ephemeralMessage") {
			msg.message = msg.message[msg.type].message;
			const tipe = Object.keys(msg.message)[0];
			msg.type = tipe;
			if (tipe === "viewOnceMessage") {
				msg.message = msg.message[msg.type].message;
				msg.type = getContentType(msg.message);
			}
		}
		if (msg.type === "viewOnceMessage") {
			msg.message = msg.message[msg.type].message;
			msg.type = getContentType(msg.message);
		}

		msg.mentions = msg.message[msg.type]?.contextInfo
			? msg.message[msg.type]?.contextInfo.mentionedJid
			: null;
		try {
			const quoted = msg.message[msg.type]?.contextInfo;
			if (quoted.quotedMessage["ephemeralMessage"]) {
				const tipe = Object.keys(
					quoted.quotedMessage.ephemeralMessage.message
				)[0];
				if (tipe === "viewOnceMessage") {
					msg.quoted = {
						type: "view_once",
						stanzaId: quoted.stanzaId,
						participant: decodeJid(quoted.participant),
						sender: decodeJid(quoted.participant),
						message:
							quoted.quotedMessage.ephemeralMessage.message.viewOnceMessage
								.message,
					};
				} else {
					msg.quoted = {
						type: "ephemeral",
						stanzaId: quoted.stanzaId,
						participant: decodeJid(quoted.participant),
						sender: decodeJid(quoted.participant),
						message: quoted.quotedMessage.ephemeralMessage.message,
					};
				}
			} else if (quoted.quotedMessage["viewOnceMessage"]) {
				msg.quoted = {
					type: "view_once",
					stanzaId: quoted.stanzaId,
					participant: decodeJid(quoted.participant),
					sender: decodeJid(quoted.participant),
					message: quoted.quotedMessage.viewOnceMessage.message,
				};
			} else {
				msg.quoted = {
					type: "normal",
					stanzaId: quoted.stanzaId,
					participant: decodeJid(quoted.participant),
					sender: decodeJid(quoted.participant),
					message: quoted.quotedMessage,
				};
			}
			msg.quoted.fromMe = msg.quoted.participant === decodeJid(sock.user.id);
			msg.quoted.mtype = Object.keys(msg.quoted.message).filter(
				(v) => v.includes("Message") || v.includes("conversation")
			)[0];
			msg.quoted.text =
				msg.quoted.message[msg.quoted.mtype]?.text ||
				msg.quoted.message[msg.quoted.mtype]?.description ||
				msg.quoted.message[msg.quoted.mtype]?.caption ||
				msg.quoted.message[msg.quoted.mtype]?.hydratedTemplate
					?.hydratedContentText ||
				msg.quoted.message[msg.quoted.mtype] ||
				"";
			msg.quoted.key = {
				id: msg.quoted.stanzaId,
				fromMe: msg.quoted.fromMe,
				remoteJid: msg.chat,
			};
		} catch {
			msg.quoted = null;
		}
		msg.body =
			msg.message?.conversation ||
			msg.message?.[msg.type]?.text ||
			msg.message?.[msg.type]?.caption ||
			(msg.type === "listResponseMessage" &&
				msg.message?.[msg.type]?.singleSelectReply?.selectedRowId) ||
			(msg.type === "buttonsResponseMessage" &&
				msg.message?.[msg.type]?.selectedButtonId) ||
			(msg.type === "templateButtonReplyMessage" &&
				msg.message?.[msg.type]?.selectedId) ||
			"";
		msg.text = msg.body;
		msg.name = msg?.pushName;
		msg.reply = (text) => sock.sendMessage(msg.chat, { text }, { quoted: msg });
	}
	return msg;
};
