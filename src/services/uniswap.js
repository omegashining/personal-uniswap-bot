import ethers from "ethers";
import uniswapCore from "@uniswap/sdk-core";
import v3Sdk from "@uniswap/v3-sdk";
import IUniswapV3Pool from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import UniswapV3Factory from "@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json";
import NonFungiblePositionManager
	from "@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json";
import SwapRouter from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";
import { encodePriceSqrt, getMaxTick, getMinTick, token } from "../util/uniswap.js";
import Units from 'ethereumjs-units';
import axios from 'axios';
import config from "../config.js";
import { getEthGas } from "../util/ethereum.js";

const { Pool, Position, priceToClosestTick } = v3Sdk;
const { Percent, Price, Token } = uniswapCore;

const { bot } = config;

export const MaxUint128 = ethers.BigNumber.from( 2 ).pow( 128 ).sub( 1 );

export default class UniswapService {

	constructor( privateKey ) {
		const wallet = new ethers.Wallet( privateKey );
		this.provider = wallet.connect( new ethers.providers.JsonRpcProvider( bot.rpc ) );
		this.uniswapV3Factory = new ethers.Contract( bot.uniswap.uniswapV3FactoryAddress, UniswapV3Factory.abi, this.provider );
		this.nftPositionManager = new ethers.Contract( bot.uniswap.nftPositionManagerAddress, NonFungiblePositionManager.abi, this.provider );
		this.swapRouter = new ethers.Contract( bot.uniswap.swapRouterAddress, SwapRouter.abi, this.provider );
	}

	getTxParams( value = 0 ) {
		return {
			value,
			gasPrice: getEthGas(),
			gasLimit: bot.gasLimit,
			type: 0
		}
	}

	// Approve address to spend ERC20 Token
	async approveSpendToken( address, amount = "115792089237316195423570985008687907853269984665640564039457584007913129639935" ) {
		const tokenContract = new ethers.Contract( bot.tokens.XOY.address, [
			{
				constant: false,
				inputs: [
					{ name: '_spender', type: 'address' },
					{ name: '_value', type: 'uint256' },
				],
				name: 'approve',
				outputs: [{ name: '', type: 'bool' }],
				payable: false,
				stateMutability: 'nonpayable',
				type: 'function',
			},
		], this.provider );
		const amount1Approved = ethers.BigNumber.from( amount );
		return await tokenContract.approve( address, amount1Approved, this.getTxParams() );
	}

	async getBalanceTokens( account ) {
		const tokenContract = new ethers.Contract( bot.tokens.XOY.address, [
			{
				"constant": true,
				"inputs": [
					{
						"name": "account",
						"type": "address"
					}
				],
				"name": "balanceOf",
				"outputs": [
					{
						"name": "",
						"type": "uint256"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			}], this.provider );
		const result = await tokenContract.balanceOf( account );
		return parseFloat((result.toNumber() / 1e8).toFixed( 2 ));
	}

	async getBalanceEthers( account ) {
		const provider = ethers.getDefaultProvider("homestead", {
			etherscan: 'M2YM7BXNGUCAXFVV2CXR227RHJVGFMU1AQ'
		});
		const result = await provider.getBalance( account )
		return parseFloat(parseFloat( Units.convert(result, 'wei', 'ether') ).toFixed( 4 ));
	}

	// Create Pool
	async createPool( token0, amount0, price0, token1, amount1, price1, owner, offset = 3, fee = 3000, expires = 1000 ) {
		const amount0Desired = ethers.BigNumber.from( amount0 );
		const amount1Desired = ethers.BigNumber.from( amount1 );
		const amount0Min = ethers.BigNumber.from( amount0 );
		const amount1Min = ethers.BigNumber.from( amount1 );
		const deadline = Math.floor( Date.now() / 1000 ) + expires;

		const tokenA = token( { sortOrder: 0, decimals: token0.decimals } );
		const tokenB = token( { sortOrder: 1, decimals: token1.decimals } );
		const closestTick = priceToClosestTick( new Price( tokenA, tokenB, price0, price1 ) );

		const mintParams = [{
			token0: token0.address, // token0
			token1: token1.address, // token1
			fee, // fee
			tickLower: getMinTick( closestTick, 60, offset ), // tickLower
			tickUpper: getMaxTick( closestTick, 60, offset ), // tickUpper
			amount0Desired, // amount0Desired
			amount1Desired, // amount1Desired
			amount0Min, // amount0Min
			amount1Min, // amount1Min
			recipient: owner, // recipient
			deadline // deadline
		}];

		const poolParams = [
			token0.address, // token0
			token1.address, // token1
			fee, // fee
			ethers.BigNumber.from( encodePriceSqrt( price1, price0 ) )
		]

		const createAndInitializePoolIfNecessaryData = this.nftPositionManager.interface.encodeFunctionData(
			'createAndInitializePoolIfNecessary',
			poolParams
		)

		const mintData = this.nftPositionManager.interface.encodeFunctionData(
			'mint',
			mintParams
		)

		return await this.nftPositionManager.multicall( [createAndInitializePoolIfNecessaryData, mintData], this.getTxParams() );
	}

	// Create Pool
	async addPool( token0, amount0, price0, token1, amount1, price1, owner, offset = 3, fee = 3000, expires = 1000 ) {
		const amount0Desired = ethers.BigNumber.from( amount0 );
		const amount1Desired = ethers.BigNumber.from( amount1 );
		const amount0Min = ethers.BigNumber.from( amount0 );
		const amount1Min = ethers.BigNumber.from( amount1 );
		const deadline = Math.floor( Date.now() / 1000 ) + expires;

		const tokenA = token( { sortOrder: 0, decimals: token0.decimals } );
		const tokenB = token( { sortOrder: 1, decimals: token1.decimals } );
		const closestTick = priceToClosestTick( new Price( tokenA, tokenB, price0, price1 ) );

		const mintParams = [{
			token0: token0.address, // token0
			token1: token1.address, // token1
			fee, // fee
			tickLower: getMinTick( closestTick, 60, offset ), // tickLower
			tickUpper: getMaxTick( closestTick, 60, offset ), // tickUpper
			amount0Desired, // amount0Desired
			amount1Desired, // amount1Desired
			amount0Min, // amount0Min
			amount1Min, // amount1Min
			recipient: owner, // recipient
			deadline // deadline
		}];

		const mintData = this.nftPositionManager.interface.encodeFunctionData(
			'mint',
			mintParams
		)

		return await this.nftPositionManager.multicall( [mintData], this.getTxParams() );
	}

	// Remove Pool
	async removePool( tokenId, percentage, account ) {
		const amount0Min = ethers.BigNumber.from( 0 );
		const amount1Min = ethers.BigNumber.from( 0 );
		const deadline = Math.floor( Date.now() / 1000 ) + 1000;

		const position = await this.nftPositionManager.positions( tokenId );
		const liquidity = new Percent( percentage, 100 ).multiply( position.liquidity.toString() ).quotient;

		const decreaseLiquidityParams = [{
			tokenId, // tokenId
			liquidity: liquidity.toString(), // liquidity
			amount0Min, // amount0Min
			amount1Min, // amount1Min
			deadline // deadline
		}];

		const decreaseLiquidityData = this.nftPositionManager.interface.encodeFunctionData(
			'decreaseLiquidity',
			decreaseLiquidityParams
		)

		const collectParams = [{
			tokenId, // tokenId
			recipient: bot.tokens.NONE.address, // recipient
			amount0Max: MaxUint128, // amount0Max
			amount1Max: MaxUint128 // amount1Max
		}];

		const collectData = this.nftPositionManager.interface.encodeFunctionData(
			'collect',
			collectParams
		)

		const unwrapWETH9Params = [
			ethers.BigNumber.from( "0" ),
			account
		];

		const unwrapWETH9Data = this.nftPositionManager.interface.encodeFunctionData(
			'unwrapWETH9',
			unwrapWETH9Params
		)

		const sweepTokenParams = [
			bot.tokens.XOY.address,
			ethers.BigNumber.from( "0" ),
			account
		];

		const sweepTokenData = this.nftPositionManager.interface.encodeFunctionData(
			'sweepToken',
			sweepTokenParams
		)

		return await this.nftPositionManager.multicall( [decreaseLiquidityData, collectData, unwrapWETH9Data, sweepTokenData], this.getTxParams() );
	}

	async swapEthForToken( eth, account, fee = 3000 ) {
		const deadline = Math.floor( Date.now() / 1000 ) + 900;
		const wei = Units.convert( eth, 'ether', 'wei' );

		const exactInputSingleParams = [{
			tokenIn: bot.tokens.WETH.address,
			tokenOut: bot.tokens.XOY.address,
			fee,
			recipient: account,
			deadline,
			amountIn: wei,
			amountOutMinimum: ethers.BigNumber.from( "0" ),
			sqrtPriceLimitX96: 0
		}];

		const exactInputSingleData = this.swapRouter.interface.encodeFunctionData(
			'exactInputSingle',
			exactInputSingleParams
		);

		return await this.swapRouter.multicall( [exactInputSingleData], this.getTxParams( wei ) );
	}

	async swapTokenForEth( amount, account, fee = 3000 ) {
		const deadline = Math.floor( Date.now() / 1000 ) + 1000;

		const exactInputSingleParams = [{
			tokenIn: bot.tokens.XOY.address,
			tokenOut: bot.tokens.WETH.address,
			fee,
			recipient: bot.tokens.NONE.address,
			deadline,
			amountIn: ethers.BigNumber.from( amount * 10 ** bot.tokens.XOY.decimals ),
			amountOutMinimum: ethers.BigNumber.from( "0" ),
			sqrtPriceLimitX96: 0
		}];

		const exactInputSingleData = this.swapRouter.interface.encodeFunctionData(
			'exactInputSingle',
			exactInputSingleParams
		);

		const unwrapWETH9Params = [ethers.BigNumber.from( "0" ), account];
		const unwrapWETH9Data = this.swapRouter.interface.encodeFunctionData(
			'unwrapWETH9',
			unwrapWETH9Params
		);

		return await this.swapRouter.multicall( [exactInputSingleData, unwrapWETH9Data], this.getTxParams() );
	}

	async refundEth() {
		return await this.swapRouter.refundETH( this.getTxParams() );
	}

	async getPositions( account ) {
		const tokenAddress = config.bot.tokens.XOY.address;
		const length = ( await this.nftPositionManager.balanceOf( account ) ).toNumber();
		const positions = await Promise.all( new Array( length ).fill( 0 ).map( async( _, index ) => {
			const tokenId = await this.nftPositionManager.tokenOfOwnerByIndex( account, index );
			const position = await this.nftPositionManager.positions( tokenId );
			return {
				tokenId: tokenId.toString(),
				token0: position.token0,
				token1: position.token1,
				fee: position.fee,
				tickLower: position.tickLower,
				tickUpper: position.tickUpper,
				liquidity: position.liquidity.toString(),
				status: position.liquidity.toString() === "0" ? 'closed' : 'open'
			};
		} ) );
		return positions.filter( p =>
			p.token0.toLowerCase() === tokenAddress.toLowerCase() ||
			p.token1.toLowerCase() === tokenAddress.toLowerCase()
		);
	}

	async getSwaps( accounts ) {
		return await axios.post( 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
			{
				query: `
{
swaps(first: 300, orderBy: timestamp, orderDirection: desc, where:
 { token1: "0xe9f1d62c671efe99896492766c0b416bd3fb9e52" }
) {
	timestamp,
	 origin,
     token0{symbol,id}
     token1{symbol,id}
     amount0
     amount1,
     transaction{gasUsed,gasPrice}
 }
}
`
			} ).then( res => res.data ? res.data.data.swaps : [] );
	}

	async getPositionAmounts( position ) {
		const TokenA = new Token( 1, position.token0, 18 );
		const TokenB = new Token( 1, position.token1, 8 );

		const poolAddress = await this.uniswapV3Factory.getPool( position.token0, position.token1, position.fee )
		const poolContract = new ethers.Contract( poolAddress, IUniswapV3Pool.abi, this.provider );
		const slot = await poolContract.slot0();

		const pool = new Pool(
			TokenA,
			TokenB,
			position.fee,
			slot[0].toString(),
			position.liquidity,
			slot[1]
		);

		const fullPosition = new Position( {
			pool,
			liquidity: position.liquidity,
			tickLower: position.tickLower,
			tickUpper: position.tickUpper
		} );
		const amount0 = fullPosition.amount0.toSignificant( 4 );
		const amount1 = fullPosition.amount1.toSignificant( 4 );

		return { amount0, amount1 }
	}
}