import { getSecretKey } from "./getToken.mjs";

import { authenticator } from 'otplib';

export const validateTotp = async (payload, configs) => {
    const secret = await getSecretKey(payload.email, configs.totp.asm_totp_salt, configs.totp.asm_provider_id);
    console.log('Got secret_key from DB', secret);
    console.log('Got otp from payload', payload.otpcode);
    console.log('Got otp from authenticator', authenticator.generate(secret));
    return payload.otpcode === authenticator.generate(secret);
}
