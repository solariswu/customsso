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

  const templateInvite = (name, email, username, code, configs) => `<html>
  <body
    style="
      background-color: #fff;
      font-family: PT Sans, Trebuchet MS, sans-serif;
    "
  >
    <div
      style="
        margin: 0 auto;
        padding: 10px;
        width: 600px;
        background-color: #fff;
        font-size: 1.2rem;
        font-style: normal;
        font-weight: normal;
        line-height: 19px;
      "
      align="center"
    >
      <div style="padding: 20">
        <img
          style="
            border: 0;
            display: block;
            height: 57px;
            width: 313px;
          "
          height="57"
          width="313"
          alt="Animage"
          src="${configs.email_logo_url}"
        />
        <div
          style="
            font-size: 12pt;
            margin-top: 20px;
            margin-bottom: 0;
            font-style: normal;
            font-weight: bold;
            color: #000;
            line-height: 32px;
            text-align: center;
          "
        >
          Hi ${name ? name : username}
        </div><div style="display:none;">${username}</div>
        <div
          style="
            margin-top: 20px;
            margin-bottom: 0;
            font-size: 12pt;
            line-height: 24px;
            color: #000;
          "
        >
        <p>
          ${process.env.SERVICE_NAME} has created a new account for you.
        </p>
        <p>
          Your login id is ${email} and your temporary password is ${code}
        </p>
        </div>
          <div
            style="
              text-align: center;
              font-size: 12pt;
            "
          />
              <a href="${process.env.APP_URL}" style="text-decoration: none"> Complete Registration </a>
          </div>
      </div>
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

