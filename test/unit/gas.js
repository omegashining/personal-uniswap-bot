import chai from 'chai';
import keythereum from "keythereum";
import chaiAsPromised from "chai-as-promised";

import { getEthGas } from "../../src/util/ethereum.js";

const expect = chai.expect;
chai.use( chaiAsPromised );
chai.should();

const sleep = seconds => new Promise( resolve => setTimeout( resolve, seconds * 1e3 ) );

describe( 'Gas', () => {

	it( 'should get gas Price', async() => {
		const gasPrice = await getEthGas();
		console.log( gasPrice );
		expect( true ).to.equals( true );
	} );

	it( 'should get eth pk', async() => {
		const privateKey = keythereum.recover( "" , {} );
		console.log( privateKey.toString( 'hex' ) );
		expect( true ).to.equals( true );
	} );

} );