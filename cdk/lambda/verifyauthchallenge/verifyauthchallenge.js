// const auth_url = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=';

// const axios = require('axios')
exports.handler = async (event, context) => {
  console.log('entering verifyAuthChallenge');
  console.log('Received event:', JSON.stringify(event, null, 2));
  console.log('Received context:', JSON.stringify(context, null, 2));

  event.response.answerCorrect = false;

  if (
    event.request.privateChallengeParameters.magicCode ==
      event.request.challengeAnswer ||
    event.request.privateChallengeParameters.answer ==
      event.request.challengeAnswer
  ) {
    event.response.answerCorrect = true;
  }

  context.done(null, event);
};
