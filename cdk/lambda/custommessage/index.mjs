import {
  DynamoDBClient,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';


export const handler = async (event, context, callback) => {

  const fetchConfig = async (configType) => {

    const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

    const params = {
      TableName: process.env.CONFIG_TABLE,
      Key: {
        configtype: { S: configType },
      },
    };
    const getItemCommand = new GetItemCommand(params);
    const results = await dynamodb.send(getItemCommand);

    if (results.Item === undefined) {
      throw new Error(`No ${configType} found`);
    }

    const result = JSON.parse(results.Item.value.S);

    console.log(`get ${configType}:`, result);
    return result;

  }

  const templateInvite = (name, email, username, code, configs) => `
  <html>
    <head>
    <meta charset="utf-8">
    <style>
      .container {
        width: 95%;
        box-shadow: 0 0.5em 1em 0 rgba(0,0,0,0.2);
        margin: 2em auto;
        border-radius: 0.5em;

      }
      .email {
        padding: 1em 4em;
      }
      .email-body {
        padding-top: 0.5em;
      }
      .email-footer {
        text-align: center;
      }
      .logo {
        text-align: center;
      }
      img {
        height: 57px;
        width: 313px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">
          <img
          alt="logo"
          src="${configs.email_logo_url}"
        />
      </div>
      <div class="email">
        <div class="email-body">
        <p>
          Hi ${name ? name : username}&#44</p>
        <br/>
        <p>
          ${process.env.SERVICE_NAME} has created a new account for you.</p>
        <p>
          Your login id is ${email} and your temporary password is <span style="background-color:#43ad7f7f">${code}</span>
        </p>
      </div>
      <div style="text-align: center; font-size: 12pt; padding: 2em">
        <a href="${process.env.APP_URL}" style="text-decoration: none; color: #fff;padding: 0.5em 4em; background-color:#06AA6D; border-radius: 0.3em"> Complete Registration </a>
      </div>
      <div style="display:none;">${username}</div>
    </div>
  </body>
</html>
`;

  if (event.triggerSource === "CustomMessage_AdminCreateUser") {

    const amfaBrandings = await fetchConfig('amfaBrandings');

    event.response.emailMessage = templateInvite(
      event.request.userAttributes.given_name, event.request.userAttributes.email,
      event.request.usernameParameter, event.request.codeParameter, amfaBrandings
    );
    event.response.emailSubject = `${process.env.SERVICE_NAME}: New Account Invitation`;
  }

  console.info("EVENT\n" + JSON.stringify(event, null, 2));

  callback(null, event);
};

