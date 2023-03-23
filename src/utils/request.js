const axios = require("axios");
const { config } = require("../../config.js");

const createRequest = async (opts) => {
	return await axios
		.request({
			...opts,
		})
		.catch((e) => (e === null || e === void 0 ? void 0 : e.response));
};

const openai = async (messages) => {
	const { data } = await createRequest({
		baseURL: "https://api.openai.com",
		url: "/v1/chat/completions",
		method: "POST",
		headers: {
			["Authorization"]: ["Bearer " + config.api.apikey],
			["Content-Type"]: ["application/json; charset=UTF-8"],
		},
		data: {
			...config.api.requestConfig,
			messages,
			model: "gpt-3.5-turbo",
		},
	});
	if (data.error) {
		return {
			error: true,
			message: data.message,
		};
	}
	return {
		error: false,
		message: data.choices[0].message.content,
	};
};
const itsrose = async (messages) => {
	const { data } = await createRequest({
		baseURL: "https://api.itsrose.site",
		url: "/chatGPT/turbo",
		method: "POST",
		params: {
			apikey: config.api.apikey,
		},
		headers: {
			["Content-Type"]: ["application/json; charset=UTF-8"],
		},
		data: messages,
	});
	if (!data.status) {
		return {
			error: true,
			message: data.message,
		};
	}
	return {
		error: false,
		message: data.message,
	};
};
exports.request = async (messages) => {
	if (config.api.useOpenai) {
		return await openai(messages);
	}
	return await itsrose(messages);
};
