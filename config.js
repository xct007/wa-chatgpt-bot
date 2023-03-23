exports.config = {
	// reject all incoming call
	rejectCall: true,

	// send typing
	composing: true,

	// read incoming message
	readMessage: true,

	// you can use openai or api.itsrose.site
	api: {
		// set this to true if you want use your openai apikey
		useOpenai: false,
		apikey: "Your Apikey",

		// if useOpenai set true.
		requestConfig: {
			// max token.
			max_tokens: 200,
		},
	},
	// describe AI asisstant system here.
	system: "You are helpfull AI asisstant.",
};
