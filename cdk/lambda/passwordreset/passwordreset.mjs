
import {
    AdminSetUserPasswordCommand,
    CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

import {
    PutItemCommand,
    DynamoDBClient,
    GetItemCommand,
    QueryCommand,
    DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';

import { createHash } from 'node:crypto';
import { notifyPasswordChange } from './mailer.mjs';

const headers = {
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key,X-Requested-With',
    'Access-Control-Allow-Origin': `https://${process.env.ALLOW_ORIGIN}`,
    'Vary': 'Origin',
    'Access-Control-Expose-Headers': 'Set-Cookie',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
    'Access-Control-Allow-Credentials': 'true',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
};

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

const setNewPassword = async (Username, Password) => {
    const input = { // AdminSetUserPasswordRequest
        UserPoolId: process.env.USERPOOL_ID,
        Username,
        Password,
        Permanent: true,
    };

    console.log('set pwd param', input)

    const param = new AdminSetUserPasswordCommand(input);
    const results = await cognito.send(param);
    console.log('set user password result:', results);
}

const fetchConfig = async (type) => {
    const params = {
        TableName: process.env.AMFACONFIG_TABLE,
        Key: {
            configtype: { S: type },
        },
    };
    const getItemCommand = new GetItemCommand(params);
    const results = await dynamodb.send(getItemCommand);

    if (results.Item === undefined) {
        throw new Error(`No ${type} found`);
    }

    const result = JSON.parse(results.Item.value.S);

    console.log(`get ${type}:`, result);
    return result;
}

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

const getExistingHashes = async (username) => {
    console.log('query dynamodb with', username);

    const queryParam = {
        TableName: process.env.PWD_HISTORY_TABLE,
        KeyConditionExpression: "username = :username",
        ExpressionAttributeValues: {
            ":username": { S: username },
        },
        ConsistentRead: true,
    };

    console.log('query param', queryParam);

    const queryCommand = new QueryCommand(queryParam);

    const results = await dynamodb.send(queryCommand);
    console.log('query user password history result:', results);

    return results.Items;
}

const hasPreviousSamePwd = (newHash, oldHashes, count) => oldHashes && oldHashes.length > 0 && oldHashes.slice(-count).includes(newHash)

const getHashesFromRecords = (records) => {
    const hashes = [];
    records.forEach(el => {
        if (el.hash?.S) hashes.push(el.hash.S)
    });

    return hashes;
}

const updatePWDHistory = async (username, newHash, records, count) => {

    console.log('update password hash for', username, "with newHash", newHash, " old records", records)

    // delete oldest record
    if (newHash && newHash.length > 0) {

        if (records && records?.length >= count) {
            const res = await dynamodb.send(
                new DeleteItemCommand({
                    TableName: process.env.PWD_HISTORY_TABLE,
                    Key: {
                        username: { S: username },
                        timestamp: { N: records[0].timestamp.N }
                    },
                }))
            console.log('delete old hash result', res);
        }

        const timestamp = Date.now();

        console.log('timestamp of new hash', timestamp)
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

        console.log('put new hash result', res);
    }
}

export const handler = async (event) => {

    console.info("EVENT\n" + JSON.stringify(event, null, 2));

    const payload = JSON.parse(event.body);

    const params = {
        TableName: process.env.SESSION_ID_TABLE,
        Key: {
            uuid: { S: payload.uuid },
        },
    };

    let err = { message: "unspecified error" }
    let statusCode = 500;

    try {
        const getItemCommand = new GetItemCommand(params);
        const results = await dynamodb.send(getItemCommand);
        console.log('get password reset uid result:', results);

        const email = results.Item.username.S;
        const apti = results.Item.apti.S;
        const timestamp = results.Item.timestamp.N;

        // 5mins
        const expired = (new Date().getTime() - timestamp) > (1000 * 60 * 10);

        console.log(email);
        console.log('payload', payload);
        console.log('uuid expired:', expired);

        if (email.trim().toLowerCase() === payload.email.trim().toLowerCase() && !expired &&
            (apti === payload.apti || apti === 'updateprofile')) {

            const config = await fetchConfig("amfaConfigs");
            const username = email.trim().toLowerCase();

            if (config.enable_prevent_password_reuse) {

                const newHash = calculateHash(payload.password);
                const records = await getExistingHashes(usernname);
                const previousHashes = getHashesFromRecords(records);

                console.log('previousHashes', previousHashes)
                const usedPassword = hasPreviousSamePwd(newHash, previousHashes, config.prevent_password_reuse_count);

                console.log('usedPassword value:', usedPassword)

                if (!usedPassword) {
                    await setNewPassword (username, payload.password);

                    // //delete the pwd reset session id once reset is done successfully.
                    // const deleteItemCommand = new DeleteItemCommand(params);
                    // await dynamodb.send(deleteItemCommand);

                    await updatePWDHistory(username, newHash, records, config.prevent_password_reuse_count);

                    const amfaBrandings = await fetchConfig('amfaBrandings');
                    await notifyPasswordChange(username, amfaBrandings.email_logo_url, false)

                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({ message: 'success' }),
                    }
                }
                else {
                    err = { message: "Same password used previously" }
                    statusCode = 521;
                }
            }
            else {
                await setNewPassword (username, payload.password);
                const amfaBrandings = await fetchConfig('amfaBrandings');
                await notifyPasswordChange(username, amfaBrandings.email_logo_url, false)

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ message: 'success' }),
                }

            }
        }
        else {
            err = { message: "some parameter values are not valid" }
            statusCode = 521;
        }
    }
    catch (error) {
        console.log('error', error);
        err = error;
    }

    return {
        statusCode,
        headers,
        body: JSON.stringify(err),
    };

}