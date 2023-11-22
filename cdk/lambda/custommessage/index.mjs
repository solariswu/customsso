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
      background-color: #333;
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
            height: auto;
            width: 100%;
            max-width: 373px;
          "
          alt="Animage"
          height="200"
          width="300"
          src="${configs.logo_url}"
        />
        <h2
          style="
            font-size: 28px;
            margin-top: 20px;
            margin-bottom: 0;
            font-style: normal;
            font-weight: bold;
            color: #000;
            font-size: 24px;
            line-height: 32px;
            text-align: center;
          "
        >
          Hi ${name ? name : username}
        </h2>
        <div style="display:none;">
            ${username}
          </div>
        <p
          style="
            margin-top: 20px;
            margin-bottom: 0;
            font-size: 16px;
            line-height: 24px;
            color: #000;
          "
        >
          ${process.env.SERVICE_NAME} has created a new account for you. Your login id is ${email} and your temporary password is ${code}
        </p>
        <div style="display: inline-block; margin: 0 auto">
          <p
          style="
            margin-top: 20px;
            margin-bottom: 0;
            font-size: 16px;
            line-height: 24px;
            color: #000;
            text-align: left;
          "
          >
          <div
            style="
              color: 'white';
              text-align: 'center';
              background-color: '#6B6B6B';
              border-radius: '4px';
              margin-right: '5px';
              border: '1px solid #e5e5e5';
              box-shadow: '0px 0px 5px #e5e5e5'
            "
          />
              <a href="${process.env.APP_URL}" style="text-decoration: none"> Complete Registration </a>
          </div>

		      </p>
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

