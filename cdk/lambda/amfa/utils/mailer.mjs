import nodemailer from "nodemailer";
import HTML_TEMPLATE from "./htmlTemplate.mjs";


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

export const notifyProfileChange = async (email, type, newProfileValue, smtpConfigs) => {
    const change = newProfileValue && newProfileValue !== ''? `changed to \n${newProfileValue}` : `removed`;

    const message = `Hi ${email},\n\n Your ${type} MFA has been ${change}.\nIf this is not your desired change, please login check or contact help desk.`;
    const options = {
        from: "Admin <admin@amfasolution.com>", // sender address
        to: email, // receiver email
        subject: "Your profile has been updated", // Subject line
        text: message,
        html: HTML_TEMPLATE(email, type, newProfileValue),
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