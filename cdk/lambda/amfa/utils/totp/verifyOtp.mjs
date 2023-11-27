import { getSecretKey } from "./getToken.mjs";

import { authenticator } from 'otplib';

export const validateTotp = async (payload, configs) => {
    const secret = await getSecretKey(payload.email, configs.totp.asm_totp_salt, configs.totp.asm_provider_id);
    authenticator.options = {window: 10};
    return payload.otpcode === authenticator.generate(secret);
}
