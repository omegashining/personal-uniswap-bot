import express from 'express';
import http from 'http';
import cors from 'cors';
import APIRouter from "./routes/api.js";
import Logger from "./util/logger.js";
import config from "./config.js";
import fs from "fs";
import https from "https";

const logger = new Logger();
const app = express();
const apiRouter = new APIRouter( logger.instance( config.logger.elastic.indexes.api  ) );

app.use( cors() );
app.use( express.json() );
app.use( express.urlencoded( { extended: false } ) );

app.use( function( req, res, next ) {
	res.setHeader( 'Strict-Transport-Security', 'max-age=15724800; includeSubDomains' );
	next();
} );

app.use( '/', apiRouter.getRouter() );

if( !config.server.ssl.enabled ) {
	const server = http.createServer( app );

	server.listen( config.server.port, config.server.ip, function() {
		console.log( 'API Server v1.0 HTTP port', config.server.port );
	} );
} else {
	const privateKey = fs.readFileSync( config.server.ssl.key, 'utf8' );
	const certificate = fs.readFileSync( config.server.ssl.crt, 'utf8' );
	const credentials = { key: privateKey, cert: certificate };
	const ssl = https.createServer( credentials, app );

	ssl.listen( config.server.port, config.server.ip, function() {
		console.log( 'API Server v1.0 HTTPS port', config.server.port );
	} );
}