
import * as crypto from 'crypto';
import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { getSecret } from './getKms.mjs';

const readFromDB = async (email, provider_id, dynamodb) => {
    //fetch tenant Info
    const params = {
        TableName: process.env.TOTPTOKEN_TABLE,
        Key: {
            id: { S: email.trim() + '#' + provider_id },
        },
    };

    const result = await dynamodb.send(new GetItemCommand(params));

    console.log('get totp token result', result);

    const item = result.Item;

    if (item && item.token) {

        return {
            token: item.token.S,
            device_name: item.device_name.S,
            email,
        };
    }

    return null;
}

const aesDecrypt = ({ toDecrypt, aesKey }) => {
    const decipher = crypto.createDecipheriv('aes-128-ecb', aesKey, '');
    let decrypted = decipher.update(toDecrypt, 'base64', 'utf8');
    return decrypted + decipher.final('utf8');
};


export const getTotp = async (email, provider_id, dynamodb) => {
    console.log ('in getTotp', email, 'provider_id', provider_id);

    const readResult = await readFromDB(email, provider_id, dynamodb);

    console.log('readResult', readResult);

    if (readResult) {
        return readResult.device_name;
    }

    return null;

}

export const getSecretKey = async (payload, dynamodb) => {
    const { email, pid } = payload;

    const readResult = await readFromDB(email, pid, dynamodb);

    console.log('readResult', readResult);

    let secret_code = null;

    if (readResult) {
        const result = readResult.token;

        const secret = await getSecret();
        const totp_secret = secret?.Mobile_Token_Key;
        const totp_salt = secret?.Mobile_Token_Salt;

        const key_and_salt = `${totp_secret}${totp_salt}`;
        const key_salt_and_email = key_and_salt + email.substring(0, email.length / 2);
        const encoded_key = Buffer.from(key_salt_and_email, 'utf8').toString('base64');
        const final_encrypt_key = encoded_key.substring(0, 16);

        secret_code = aesDecrypt({ toDecrypt: result, aesKey: final_encrypt_key });

    }

    return secret_code;

}