import { getProviderId } from "./getKms.mjs";
import { getSecretKey } from "./getToken.mjs";

import { authenticator } from 'otplib';

export const validateTotp = async (payload, dynamodb) => {
    const provider_id = await getProviderId()
    const secret = await getSecretKey({
        email: payload.email,
        pid: provider_id
    }, dynamodb);
    authenticator.options = { window: 10 };
    const otpCode = authenticator.generate(secret);
    console.log ('validateTotp otpcode', otpCode)
    return payload.otpcode === otpCode;
}
