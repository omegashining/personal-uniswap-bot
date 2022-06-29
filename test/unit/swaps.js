import chai from 'chai';

import chaiAsPromised from "chai-as-promised";
import UniswapService from "../../src/services/uniswap.js";

import config from "../../src/config.js"
import moment from "moment";

const expect = chai.expect;
chai.use( chaiAsPromised );
chai.should();

const sleep = seconds => new Promise( resolve => setTimeout( resolve, seconds * 1e3 ) );

describe( 'Swaps', () => {
	const account = config.bot.accounts.swaps.address;
	const uniswapService = new UniswapService( config.bot.accounts.swaps.privateKey );

	it( 'should approve the usage of token', async() => {
		const tx = await uniswapService.approveSpendToken( config.bot.uniswap.swapRouterAddress );
		console.log( tx );
		await sleep( 2 );
		expect( true ).to.equals( true );
	} );

	it( 'should trade ETH -> XOY', async() => {
		const tx = await uniswapService.swapEthForToken( 4.0, account );
		console.log( tx );
		expect( true ).to.equals( true );
	} );

	it( 'should trade XOY -> ETH', async() => {
		const tx = await uniswapService.swapTokenForEth( 17000, account );
		//const tx = await uniswapService.refundEth(account);
		console.log( tx );
		expect( true ).to.equals( true );
	} );

	it( 'should get swaps', async() => {
		const accounts = [
		];
		const positions = await uniswapService.getSwaps();
		for( const position of positions ){
			const timestamp = moment( position.timestamp * 1000 ).format( 'DD/MM/YYYY HH:mm:ss' );
			const from = position.token0.symbol;
			const to = position.token1.symbol;
			const account = position.origin;
			const pair = position.amount0 < 0 ? `${to} -> ${from}` : `${from} -> ${to}`;
			const price = Math.abs( position.amount0 / position.amount1 ).toFixed( 8 );
			const eth = Math.abs( position.amount0 ).toFixed( 5 );
			const xoy = Math.abs( position.amount1 ).toFixed( 5 );
			const type = position.amount1 < 0 ? 'compra' : 'venta';
			const bot = accounts.find( a => a.toLowerCase() === account.toLowerCase() ) ? 'bot' : 'externo';
			const fee = (position.transaction.gasPrice * position.transaction.gasUsed)/1e18;
			console.log(`${timestamp},${pair},${price},${account},${eth},${xoy},${fee},${type},${bot}`);
		}
		expect( true ).to.equals( true );
	} );

} );