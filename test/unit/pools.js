import chai from 'chai';

import chaiAsPromised from "chai-as-promised";
import UniswapService from "../../src/services/uniswap.js";

import config from "../../src/config.js"

const expect = chai.expect;
chai.use( chaiAsPromised );
chai.should();

const sleep = seconds => new Promise( resolve => setTimeout( resolve, seconds * 1e3 ) );

describe( 'Pools', () => {
	const uniswapService = new UniswapService( config.bot.accounts.pools.privateKey );
	const account = config.bot.accounts.pools.address;

	it( 'should approve the usage of token', async() => {
		await uniswapService.approveSpendToken( config.bot.uniswap.nftPositionManagerAddress );
		await sleep( 60 );
		expect( true ).to.equals( true );
	} );

	it( 'should create a new pool', async() => {
		const tx = await uniswapService.createPool(
			config.bot.tokens.WETH,
			0,
			1e18,
			config.bot.tokens.XOY,
			200e8,
			5141e8,
			account,
			-3
		);
		console.log( tx );
		expect( true ).to.equals( true );
	} );

	it( 'should add a pool', async() => {
		// 5141, (5120), (*5095*) ->5000<-,
		const tx = await uniswapService.addPool(
			config.bot.tokens.WETH,
			0,
			1e18,
			config.bot.tokens.XOY,
			250000e8,
			3500e8,
			account,
			-3
		);
		console.log( tx );
		expect( true ).to.equals( true );
	} );

	it( 'should remove pool', async() => {
		const tx = await uniswapService.removePool( 113716, 100, account );
		console.log( tx );
		expect( true ).to.equals( true );
	} );

	it( 'should get all positions from account', async() => {
		const positions = await uniswapService.getPositions( account );
		for( const position of positions ){
			console.log( { ...position, ... await uniswapService.getPositionAmounts( position ) } );
		}
		expect( true ).to.equals( true );
	} );

} );