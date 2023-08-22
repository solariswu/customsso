
import mysql from 'mysql2/promise';
import * as crypto from 'crypto';
import { getAsmSecret } from './getKms.mjs';

const pool = mysql.createPool({
	connectionLimit: 10,
	host: "asm-authenticators.cdxmlz2ujbyj.eu-west-1.rds.amazonaws.com",
	user: "admin",
	password: "KzYbHHdaNM4LuimM7aPp",
	database: "asm_authenticators",
	port: 3306
});

const readFromDB = async (con, email, provider_id) => {
	const [rows, fields] = await con.execute('SELECT * FROM tokens WHERE email = ? AND provider_id = ?', [email, provider_id]);

	console.log('token db read result. rows', rows, 'fields', fields);
	return rows;
}

const aesDecrypt = ({ toDecrypt, aesKey }) => {
	const decipher = crypto.createDecipheriv('aes-128-ecb', aesKey, '');
	let decrypted = decipher.update(toDecrypt, 'base64', 'utf8');
	return decrypted + decipher.final('utf8');
};

export const getTotp = async (email, provider_id) => {
	const con = await pool.getConnection();
	await con.ping();

	console.log("DB Connected!");

	console.log('email', email, 'provider_id', provider_id);

	const [rows, fields] = await con.execute('SELECT * FROM tokens');

	console.log('token db read all result. rows', rows, 'fields', fields);

	const readResult = await readFromDB(con, email, provider_id);

	console.log('readResult', readResult);

	con.release();

	console.log("DB Disconnected!");

	if (readResult && readResult.length > 0) {
		return readResult[0].device_name;
	}

	return null;

}

export const getSecretKey = async function (email, asm_token_salt, provider_id) {

	const con = await pool.getConnection();
	await con.ping();

	console.log("DB Connected!");

	const readResult = await readFromDB(con, email, provider_id);

	console.log('readResult', readResult);

	let secret_code = null;

	if (readResult && readResult.length > 0) {
		const result = readResult[0].token;

		const asm_secret = await getAsmSecret();

		const key_and_salt = `${asm_secret}${asm_token_salt}`;
		const key_salt_and_email = key_and_salt + email.substring(0, email.length / 2);
		const encoded_key = Buffer.from(key_salt_and_email, 'utf8').toString('base64');
		const final_encrypt_key = encoded_key.substring(0, 16);

		secret_code = aesDecrypt({ toDecrypt: result, aesKey: final_encrypt_key });

		console.log ('read from DB - secret_code', secret_code);

	}

	con.release();

	console.log("DB Disconnected!");

	return secret_code;

}