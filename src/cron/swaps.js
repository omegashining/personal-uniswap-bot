import cron from "node-cron";
import UniswapService from "../services/uniswap.js";
import Logger from "../util/logger.js";
import { getEthGas } from "../util/ethereum.js";

const names = [
];

function getRandom( min, max ) {
	return Math.random() * ( max - min ) + min;
}

function getRandomInt( min, max ) {
	return Math.floor( getRandom( min, max ) );
}

function getRandomFloat( min, max, decimals ) {
	return parseFloat( getRandom( min, max ).toFixed( decimals ) );
}

const logger = new Logger();
const log = logger.instance( 'swaps' );

cron.schedule( '* * * * *', async() => {
	const gasPrice = await getEthGas();
	if( gasPrice > 100000000000 ) {
		console.log( 'gasPrice is greater than 100 gwei, skipping... | ', gasPrice );
		return;
	}

	const index = getRandomInt( 0, 5 );
	const operation = getRandomInt( 0, 2 );
	const uniswapService = new UniswapService( names[index][1] );
	const account = names[index][0];
	console.log( index, operation, account );

	if( operation === 1 ) { // Sell Tokens
		const balanceToken = await uniswapService.getBalanceTokens( account );
		if( balanceToken <= 500 ) return;
		const max = balanceToken / 5;
		const spendToken = getRandomFloat( 500, max > 10000 ? 10000 : max, 2 );
		const tx = await uniswapService.swapTokenForEth( spendToken, account );
		log.info( 'Sell', { account, balanceToken, spendToken, tx: tx.hash } );
	} else { // Buy Tokens
		const balanceEth = await uniswapService.getBalanceEthers( account );
		if( balanceEth <= 0.5 ) return;
		const spendEth = getRandomFloat( 0.3, balanceEth / 4, 4 );
		const tx = await uniswapService.swapEthForToken( spendEth, account );
		log.info( 'Buy', { account, balanceEth, spendEth, tx: tx.hash } );
	}
} );

