import nodemailer from "nodemailer";
import HTML_TEMPLATE from "./htmlTemplate.mjs";
import { getSMTP } from "./getKms.mjs";
import HTML_TEMPLATE_PWD from "./htmlTemplatePwd.mjs";


const sendEmail = async (transporter, mailDetails, callback) => {
	try {
		const info = await transporter.sendMail(mailDetails)
		callback(info);
	} catch (error) {
		console.log(error);
	}
};

const mailer = async (mailDetails, smtpConfig) => {

	const transporter = nodemailer.createTransport(smtpConfig);
	await sendEmail(transporter, mailDetails, (info) => console.log('email send:', info))

}

export const notifyPasswordChange = async (email, logoUrl, serviceName, isByAdmin = false) => {
	const message = `Hi ${email},\n\n` +
		` The password on your account has recently been reset${isByAdmin ? ' by Admin' : ''}.\n\n` +
		` If you are not sure you or your administrator performed this password reset, then you should contact your administrator immediately or change your password yourself.\n`;

	const smtpConfigs = await getSMTP();

	const options = {
		from: `Admin <${smtpConfigs.user}>`, // sender address
		to: email, // receiver email
		subject: "Your password has been reset.", // Subject line
		text: message,
		html: HTML_TEMPLATE_PWD(email, logoUrl, serviceName, isByAdmin),
	}

	const smtp = {
		service: smtpConfigs.service,
		host: smtpConfigs.host,
		port: smtpConfigs.port,
		secure: smtpConfigs.secure,
		auth: {
			user: smtpConfigs.user,
			pass: smtpConfigs.pass,
		}
	}

	console.log('mailer options', options, ' smtp config:', smtp);
	try {
		return await mailer(options, smtp);
	} catch (error) {
		console.error('send email for password change error', error);
	}

}

export const notifyProfileChange = async (email, types, newProfileValues, logoUrl, serviceName, isByAdmin = false) => {
	if (types.length === 0) {
		console.log('error, mailer, No changed OTP type found, input type:', types);
		return;
	}

	const message = `Hi ${email},\n\n Your following MFA has been changed${isByAdmin ? ' by Admin' : ''}.\nIf this is not your desired change, please login check or contact help desk.\n`;
	let messageMfaList = '';

	for (let index = 0; index < types.length; index++) {
		messageMfaList += `    ${types[index]} has been `;
		messageMfaList += newProfileValues[index] && newProfileValues !== '' ? `changed to \n${newProfileValues[index]}\n` : `removed\n`;
	}

	const smtpConfigs = await getSMTP();

	const options = {
		from: `Admin <${smtpConfigs.user}>`, // sender address
		to: email, // receiver email
		subject: "Your profile has been updated", // Subject line
		text: message + messageMfaList,
		html: HTML_TEMPLATE(email, types, newProfileValues, logoUrl, serviceName, isByAdmin),
	}

	const smtp = {
		service: smtpConfigs.service,
		host: smtpConfigs.host,
		port: smtpConfigs.port,
		secure: smtpConfigs.secure,
		auth: {
			user: smtpConfigs.user,
			pass: smtpConfigs.pass,
		}
	}

	console.log('mailer options', options, ' smtp config:', smtp);
	try {
		return await mailer(options, smtp);
	} catch (error) {
		console.error('send email for token change error', error);
	}
}