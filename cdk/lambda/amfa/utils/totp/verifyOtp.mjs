import { getSecretKey } from "./getToken.mjs";

import { authenticator } from 'otplib';

export const validateTotp = async (payload, configs, dynamodb) => {
    const secret = await getSecretKey({
        email: payload.email,
        salt: configs.totp.asm_totp_salt,
        pid: configs.totp.asm_provider_id
    }, dynamodb);
    authenticator.options = { window: 10 };
    const otpCode = authenticator.generate(secret);
    console.log ('validateTotp otpcode', otpCode)
    return payload.otpcode === otpCode;
}
