const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
	/**
	 * Networks define how you connect to your ethereum client and let you set the
	 * defaults web3 uses to send transactions. If you don't specify one truffle
	 * will spin up a development blockchain for you on port 9545 when you
	 * run `develop` or `test`. You can ask a truffle command to use a specific
	 * network from the command line, e.g
	 *
	 * $ truffle test --network <network-name>
	 */

	networks: {
		testing: {
			provider: () => new HDWalletProvider( "0xd0d845975f193e381ebb902f9629388691dd095f346e0be20520ac1a50afb74d", "https://ropsten.infura.io/v3/c79dc8dddd884cc4bd60e637f89173ef")
		}
	},

	mocha: {
		timeout: 100000
	},

	compilers: {
		solc: {
			version: "0.5.0"
		}
	}
};
