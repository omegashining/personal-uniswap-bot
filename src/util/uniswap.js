import uniswapCore from "@uniswap/sdk-core";
import ethers from "ethers";
import bn from 'bignumber.js'

const { Token } = uniswapCore;

bn.config( { EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 } )

export const expandToDecimals = ( n, decimals ) => {
	return ethers.BigNumber.from( n ).mul( ethers.BigNumber.from( 10 ).pow( decimals ) )
}

export const token = ( { sortOrder, decimals = 18, chainId = 1 } ) => {
	if( sortOrder > 9 || sortOrder % 1 !== 0 ) throw new Error( 'invalid sort order' )
	return new Token(
		chainId,
		`0x${new Array( 40 ).fill( `${sortOrder}` ).join( '' )}`,
		decimals,
		`T${sortOrder}`,
		`token${sortOrder}`
	)
}

export const getMinTick = ( tick, tickSpacing, offset ) => ( Math.floor( tick / tickSpacing ) + offset ) * tickSpacing;

export const getMaxTick = ( tick, tickSpacing, offset ) => ( Math.ceil( tick / tickSpacing ) + offset ) * tickSpacing;

export function encodePriceSqrt( reserve1, reserve0 ) {
	return ethers.BigNumber.from(
		new bn( reserve1.toString() )
			.div( reserve0.toString() )
			.sqrt()
			.multipliedBy( new bn( 2 ).pow( 96 ) )
			.integerValue( 3 )
			.toString()
	)
}