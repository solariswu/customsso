import { AdminUpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";
import { notifyProfileChange } from "../mailer.mjs";
import writeToken, { deleteToken } from "./writeToken.mjs";
import { authenticator } from "otplib";

const response = (headers, statusCode, body, requestIdIn) => {
  const requestId = requestIdIn ? requestIdIn : "";

  console.log("otp register response", statusCode, body, requestId);

  return {
    isBase64Encoded: false,
    statusCode,
    headers: { ...headers, requestId },
    body: JSON.stringify({ message: body }),
  };
};

export const registotp = async (
  headers,
  payload,
  configs,
  requestId,
  logoUrl,
  serviceName,
  provider_id,
  cognito,
  dynamodb
) => {
  authenticator.options = { window: 10 };

  const token = authenticator.generate(payload.secretCode);
  console.log("otp validate token", token);
  console.log("otp validate payload", payload);

  if (token === payload.sixDigits) {
    console.log("otp validate true");

    try {
      // if (configs.totp) {
      await writeToken(
        {
          secret_key: payload.secretCode,
          email: payload.email,
          provider_id,
          device_name: payload.tokenLabel,
        },
        dynamodb
      );

      await cognito.send(
        new AdminUpdateUserAttributesCommand({
          UserPoolId: process.env.USERPOOL_ID,
          Username: payload.email,
          UserAttributes: [
            {
              Name: "custom:totp-label",
              Value: payload.tokenLabel,
            },
          ],
        })
      );

      await notifyProfileChange(
        payload.email,
        ["Mobile TOTP"],
        [payload.tokenLabel],
        logoUrl,
        serviceName,
        false
      );
      return response(headers, 200, "TOTP configured", requestId);
      // }
      // else {
      //     return response(headers, 506, 'No TOTP configured', requestId)
      // }
    } catch (error) {
      return response(headers, 500, error, requestId);
    }
  } else {
    return response(
      headers,
      403,
      "Invalid code, please check again.",
      requestId
    );
  }
};

export const deleteTotp = async (
  headers,
  email,
  configs,
  requestId,
  cognito,
  needNotify,
  dynamodb,
  logoUrl,
  serviceName,
  isByAdmin,
  provider_id
) => {
  console.log("deleteTotp payload ", email, " configs ", configs);
  let totpCount = 0;

  try {
    totpCount = await deleteToken({ email, pid: provider_id }, dynamodb);

    await cognito.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: process.env.USERPOOL_ID,
        Username: email,
        UserAttributes: [
          {
            Name: "custom:totp-label",
            Value: "",
          },
        ],
      })
    );

    if (needNotify) {
      // user may deleted
      await notifyProfileChange(
        email,
        ["Mobile TOTP"],
        [null],
        logoUrl,
        serviceName,
        isByAdmin
      );
    }
  } catch (error) {
    // no issue as this may due to user has been deleted
    console.log(
      "Function[deleteTotp] remove User custom attributes error ",
      error
    );
  }

  return {
    isBase64Encoded: false,
    statusCode: 200,
    headers: { ...headers, requestId },
    body: JSON.stringify({ data: "OK", deletedRecsCount: totpCount }),
  };
};
