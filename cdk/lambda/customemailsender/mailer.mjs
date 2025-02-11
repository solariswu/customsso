import nodemailer from "nodemailer";
import { getSMTP } from "./getKms.mjs";
import { templateInvite, templateReset } from "./templates.mjs";

const sendEmail = async (transporter, mailDetails, callback) => {
	try {
		const info = await transporter.sendMail(mailDetails)
		callback(info);
	} catch (error) {
		console.log(error);
	}
};

const mailer = async (mailDetails, smtpConfig) => {

	smtpConfig.secure = (smtpConfig.secure === 'false' || smtpConfig.secure === false) ? false : true;
	console.log('mailer options', mailDetails, ' smtp config:', smtpConfig)

	const transporter = nodemailer.createTransport(smtpConfig);
	await sendEmail(transporter, mailDetails, (info) => console.log('email send:', info))

}

export const notifyPasswordChange = async (user, email, configs) => {
	const message = `Hi ${email},\n\n` +
		` The password on your account has recently been reset.\n\n` +
		` If you are not sure you or your administrator performed this password reset, then you should contact your administrator immediately or change your password yourself.\n`;

	const smtpConfigs = await getSMTP();

	const options = {
		from: `Admin <${smtpConfigs.user}>`, // sender address
		to: email, // receiver email
		subject: "Your password has been reset.", // Subject line
		text: message,
		html: templateReset(user, email, configs)
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

export const sendUserInvitation = async (user, email, configs) => {
	const message = `Hi ${email},\n\n` +
		` ${configs.service_name} has created a new Account for you.\n\n` +
		` Your login id is ${email}. Please use it to login and set up your new account.\n` +
		` The login Url is ${process.env.APP_URL}`;

	const smtpConfigs = await getSMTP();

	const options = {
		from: `Admin <${smtpConfigs.user}>`, // sender address
		to: email, // receiver email
		subject: `${configs.service_name}: New Account Invitation`, // Subject line
		text: message,
		html: templateInvite(user, email, configs),
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
