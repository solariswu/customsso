import nodemailer from "nodemailer";


const sendEmail = async (transporter, mailDetails, callback) => {
	try {
		const info = await transporter.sendMail(mailDetails)
		callback(info);
	} catch (error) {
		console.log(error);
	}
};



export const mailer = async (mailDetails, smtpConfig) => {

	const transporter = nodemailer.createTransport(smtpConfig);

	await sendEmail(transporter, mailDetails, (info) => console.log('email send:', info))

}
