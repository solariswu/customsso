import { notifyProfileChange } from "../mailer.mjs";
import writeToken, { deleteToken } from "./writeToken.mjs"
import { authenticator } from 'otplib'

const response = (headers, statusCode, body, requestIdIn) => {
    const requestId = requestIdIn ? requestIdIn : '';

    console.log('otp register response', statusCode, body, requestId);

    return {
        isBase64Encoded: false,
        statusCode,
        headers: { ...headers, requestId },
        body: JSON.stringify({ message: body }),
    };
};

export const registotp = async (headers, payload, configs, requestId) => {

    const token = authenticator.generate(payload.secretCode);
    console.log('otp validate token', token);
    console.log('otp validate payload', payload);

    if (token === payload.sixDigits) {
        console.log('otp validate true');

        try {
            if (configs.totp) {
                await writeToken(
                    payload.secretCode,
                    payload.email,
                    configs.totp.asm_totp_salt,
                    configs.totp.asm_provider_id,
                    payload.tokenLabel);

                await notifyProfileChange(payload.email, 'TOTP', payload.tokenLabel, configs.smtp);
                return response(headers, 200, 'TOTP configured', requestId);
            }
            else {
                return response(headers, 506, 'No TOTP configured', requestId)
            }
        } catch (error) {
            return response(headers, 500, error, requestId);
        }
    }
    else {
        return response(headers, 403, 'Invalid code, please check again.', requestId);
    }
}

export const deleteTotp = async (headers, email, configs, requestId) => {
    console.log('deleteTotp payload ', email, ' configs ', configs)
    await deleteToken(email, configs.totp.asm_provider_id)

    await notifyProfileChange(email, 'TOTP', null, configs.smtp);

    return response(headers, 200, 'TOTP deleted', requestId);
}