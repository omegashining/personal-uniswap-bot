import winston from "winston";
import WinstonElastic from "winston-elasticsearch";
import ElasticSearch from "@elastic/elasticsearch";
import config from "../config.js";

export default class Logger {

	constructor() {
		if( config.logger.level !== 'none' && config.logger.elastic.enabled )
			this.client = new ElasticSearch.Client( {
				node: config.logger.elastic.node,
				auth: {
					username: config.logger.elastic.username,
					password: config.logger.elastic.password
				}
			} )
	}

	instance( index ) {
		const level = config.logger.level;
		return winston.createLogger( {
			transports: [
				...( level !== 'none' && config.logger.elastic.enabled ?
					[new WinstonElastic.ElasticsearchTransport( {
						level,
						index,
						client: this.client
					} )] : [] ),
				new winston.transports.Console( {
					level,
					handleExceptions: true,
					json: true,
					colorize: true
				} ),
				new winston.transports.File( {
					level,
					handleExceptions: true,
					json: true,
					filename: `${index}.log`
				} )
			],
			silent: level === 'none'
		} );

	}
}