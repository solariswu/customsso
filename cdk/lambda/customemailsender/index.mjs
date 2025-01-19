import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { fetchConfig } from './fetchConfig.mjs';
import { notifyPasswordChange } from './mailer.mjs';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler = async (event, context, callback) => {
  console.log('event', event)

  if (event.triggerSource == 'CustomEmailSender_ForgotPassword') {
    const amfaBrandings = await fetchConfig('amfaBrandings', dynamodb);
    await notifyPasswordChange(event.request.userAttributes.given_name,
      event.request.userAttributes.email, amfaBrandings)
    //Send a message with next steps for password reset.
  }
  else if (event.triggerSource == 'CustomEmailSender_AdminCreateUser') {
    const amfaBrandings = await fetchConfig('amfaBrandings', dynamodb);
    await sendUserInvitation(event.request.userAttributes.given_name,
      event.request.userAttributes.email, amfaBrandings)
    //Send a message with next steps for signing in with a new user profile.
  }
  return;
};