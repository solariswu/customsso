import {
	PutItemCommand,
	BatchWriteItemCommand,
	QueryCommand,
} from '@aws-sdk/client-dynamodb';

import { createHash } from 'node:crypto';

const calculateHash = (content) => {
	console.log('hash content', content);

	const sha512 = createHash('sha512').update(content).digest('hex');
	console.log('sha512 result', sha512);
	sha512.slice(98);
	console.log('sha512 sliced to', sha512);
	const res = createHash('md5').update(sha512).digest("hex")

	console.log('new hash result', res)

	return res;

}


export const createPWDHashHistory = async (username, password, dynamodb, config) => {

	if (config.enable_prevent_password_reuse) {

		const newHash = calculateHash(password);

		console.log('create password hash for', username, "with hash", newHash)

		if (newHash && newHash.length > 0) {

			const timestamp = Date.now();

			console.log('timestamp of new user password hash', timestamp)
			// put new record in
			const res = await dynamodb.send(new PutItemCommand({
				TableName: process.env.PWD_HISTORY_TABLE,
				Item: {
					username: {
						S: username,
					},
					timestamp: {
						N: `${timestamp}`,
					},
					hash: {
						S: newHash,
					}
				},
				ReturnConsumedCapacity: 'TOTAL',
			}))

			console.log('create new user hash result', res);
		}
	}
}

export const deletePwdHashByUser = async (username, dynamodb, config) => {
	function chunks(inputArray, perChunk) {
		return inputArray.reduce((all, one, i) => {
			const ch = Math.floor(i / perChunk);
			all[ch] = [].concat((all[ch] || []), one);
			return all
		}, [])
	}

	if (config.enable_prevent_password_reuse) {
		const tableName = process.env.PWD_HISTORY_TABLE;

		const queryParams = {
			TableName: process.env.PWD_HISTORY_TABLE,
			KeyConditionExpression: "username = :username",
			ExpressionAttributeValues: {
				":username": { S: username },
			},
			ConsistentRead: true,
		};

		const queryResults = await dynamodb.send(new QueryCommand(queryParams))
		if (queryResults.Items && queryResults.Items.length > 0) {

			const batchCalls = chunks(queryResults.Items, 25).map(async (chunk) => {
				const deleteRequests = chunk.map(item => {
					return {
						DeleteRequest: {
							Key: {
								'username': item.username,
								'timestamp': item.timestamp,
							}
						}
					}
				})

				const batchWriteParams = {
					RequestItems: {
						[tableName]: deleteRequests
					}
				}
				await dynamodb.send(new BatchWriteItemCommand(batchWriteParams))
			})

			await Promise.all(batchCalls)
		}
	}
}