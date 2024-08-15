import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { fetchConfig } from './fetchConfig.mjs';
import { templateInvite, templateReset } from './templates.mjs';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler = async (event, context, callback) => {

  if (event.triggerSource === "CustomMessage_AdminCreateUser") {
    const amfaBrandings = await fetchConfig('amfaBrandings', dynamodb);

    event.response.emailMessage = templateInvite(
      event.request.userAttributes.given_name, event.request.userAttributes.email,
      event.request.usernameParameter, event.request.codeParameter, amfaBrandings
    );
    event.response.emailSubject = `${amfaBrandings.service_name}: New Account Invitation`;
  }

  if (event.triggerSource === 'CustomMessage_ForgotPassword') {
    const amfaBrandings = await fetchConfig('amfaBrandings', dynamodb);

    event.response.emailMessage = templateReset(
      event.request.userAttributes.given_name, event.request.userAttributes.email,
      event.request.usernameParameter, event.request.codeParameter, amfaBrandings
    );
    event.response.emailSubject = `${amfaBrandings.service_name}: Your password has been reset for security reasons`;
  }

  console.info("EVENT\n" + JSON.stringify(event, null, 2));

  callback(null, event);
};

