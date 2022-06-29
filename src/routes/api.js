import Router from "./router.js";

import UniswapService from "../services/uniswap.js";
import { expandToDecimals } from "../util/uniswap.js";

import config from "../config.js";

export default class APIRouter extends Router {
	constructor( logger ) {
		super( logger );
		this.poolAccount = config.bot.accounts.pools.address;
		this.poolService = new UniswapService( config.bot.accounts.pools.privateKey );
		this.swapAccount = config.bot.accounts.swaps.address;
		this.swapService = new UniswapService( config.bot.accounts.swaps.privateKey );
	}

	init() {
		this.get( '/', '1 minute', this.home );

		this.get( '/pools', '1 minute', this.getPools );
		this.post( '/pools/eth_token', this.addEthTokenPool );
		this.post( '/pools/token_eth', this.addTokenEthPool );
		this.delete( '/pools/:tokenId', this.removePool );

		this.get( '/swaps', '1 minute', this.getSwaps );
		this.post( '/swaps/eth_token', this.swapEthToken )
		this.post( '/swaps/token_eth', this.swapTokenEth )
	}

	async home() {
		return {
			timestamp: new Date().getTime()
		}
	}

	async getPools() {
		const positions = await this.poolService.getPositions( this.poolAccount );

		return {
			positions: await Promise.all( positions.map( async( position ) => {
				return{...position, ...await this.poolService.getPositionAmounts( position ) }
			} ) )
		}
	}

	async getSwaps() {
		const swaps = await this.swapService.getSwaps( [
			"0x88d681915FB62D0EF51c78B00421597A835678e5",
			"0x580b900048d7d95b1387f8c54f5eb08c785a8c9a",
			"0xb8f6d5cadf7eb787925b9ea5a93c10afeffff804",
			"0x765e57dd7f5a396f90bd53201ca9404e087a314f",
			"0xa848219766f8653d5f2faaab47030e44faff339e",
			"0x6e90357c256f53a94f940b9cd5b5eb4e33f11dd7"
		] );
		return {
			swaps
		}
	}

	async addEthTokenPool( req ) {
		const { amount, price } = req.body;

		const tx = await this.poolService.addPool(
			config.bot.tokens.WETH,
			0,
			1e18,
			config.bot.tokens.XOY,
			expandToDecimals( amount, 8 ),
			expandToDecimals( price, 8 ),
			this.poolAccount,
			-3
		);

		return { tx }
	}

	async addTokenEthPool( req ) {
		const { amount, price } = req.body;

		const tx = await this.poolService.addPool(
			config.bot.tokens.XOY,
			expandToDecimals( amount, 8 ),
			expandToDecimals( price, 8 ),
			config.bot.tokens.WETH,
			0,
			1e18,
			this.poolAccount,
			3
		);

		return { tx }
	}

	async removePool( req ) {
		const { tokenId } = req.params;
		const tx = await this.poolService.removePool( tokenId, 100, this.poolAccount );

		return { tokenId, tx }
	}

	async swapEthToken( req ) {
		const { amount } = req.body;
		const tx = await this.swapService.swapEthForToken( amount, this.swapAccount );

		return { tx }
	}

	async swapTokenEth( req ) {
		const { amount } = req.body;
		const tx = await this.swapService.swapTokenForEth( amount, this.swapAccount );

		return { tx }
	}
}