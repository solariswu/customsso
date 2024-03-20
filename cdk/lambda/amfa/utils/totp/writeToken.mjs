

import mysql from 'mysql2/promise';
import * as crypto from 'crypto';
import { getAsmSecret } from './getKms.mjs';

const aesEncrypt = ({ toEncrypt, aesKey }) => {
	const cipher = crypto.createCipheriv('aes-128-ecb', aesKey, '');
	let encrypted = cipher.update(toEncrypt, 'utf8', 'base64');
	return encrypted + cipher.final('base64');
};

const genTotpToken = async (secret_key, email, asm_token_salt) => {

	const asm_secret = await getAsmSecret();

	const key_and_salt = `${asm_secret}${asm_token_salt}`;
	const key_salt_and_email = key_and_salt + email.substring(0, email.length/2);
	const encoded_key = Buffer.from(key_salt_and_email, 'utf8').toString('base64');
	const final_encrypt_key= encoded_key.substring(0,16);
	const cryptedResult = aesEncrypt({ toEncrypt: secret_key, aesKey: final_encrypt_key });

	return cryptedResult;

}

const writeToDB = async (con, email, token, provider_id, device_name) => {

	console.log ('starting to write token to db')

	console.log ('delete all old token from db');
	const deleteSql = 'DELETE FROM tokens WHERE email = ? AND provider_id = ?';
	const deleteValues = [email, provider_id];
	const deleteResult = await con.query(deleteSql, deleteValues);
	console.log ('delete result', deleteResult);

	const last_update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')

	const sql = `INSERT INTO tokens (email, token, last_update, provider_id, device_name) VALUES (?, ?, ?, ?, ?)`;
	const values = [email, token, last_update, provider_id, device_name];

	const restult = await con.query(sql, values);

	console.log ('token db write result', restult);
}

const pool = mysql.createPool({
	connectionLimit: 10,
	host: "asm.cdxmlz2ujbyj.eu-west-1.rds.amazonaws.com",
	user: "admin",
	password: "KzYbHHdaNM4LuimM7aPp",
	database: "asm_authenticators",
	port: 3306
});

export const deleteToken = async (email, provider_id) => {
	const con = await pool.getConnection();
	await con.ping();
	console.log("deleteToken DB Connected!");

	console.log ('delete all old token from db');
	const deleteSql = 'DELETE FROM tokens WHERE email = ? AND provider_id = ?';
	const deleteValues = [email, provider_id];

	const deleteResult = await con.execute(deleteSql, deleteValues);
	console.log ('delete result', deleteResult);

	con.release();

	console.log("DB Disconnected!");
}


export default async function writeToken(secret_key, email, asm_token_salt, provider_id, device_name) {

	const con = await pool.getConnection();
	await con.ping();

	console.log("DB Connected!");

	const encryptedToken = await genTotpToken(secret_key, email, asm_token_salt);

	await writeToDB(con, email, encryptedToken, provider_id, device_name);

	con.release();

	console.log("DB Disconnected!");

}