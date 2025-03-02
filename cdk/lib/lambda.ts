import { Construct } from 'constructs';
import { Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';


// basic lambda policy
export const BasicLambdaPolicyStatement = new PolicyStatement({
  actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
  resources: ['arn:aws:logs:*:*:*'],
});

// oauth endpoint lambda related policy
export const getOAuthLambdaPolicy = (oAuthEndpointName: string) => {
  // todo: different policies for different endpoints

  return ([
    BasicLambdaPolicyStatement,
    new PolicyStatement({
      actions: ['dynamodb:GetItem', 'dynamodb:Scan', 'dynamodb:PutItem', 'dynamodb:DeleteItem'],
      resources: ['*'],
    }),
  ]);
};

export const createAuthChallengeFn = (
  scope: Construct,
  lambdaName: string,
  runtime: Runtime,
  tenantId: string,
  magicString: string
) => {
  const fn = new Function(scope, lambdaName, {
    runtime,
    handler: `${lambdaName}.handler`,
    code: Code.fromAsset(path.join(__dirname, `/../lambda/${lambdaName}`)),
    timeout: Duration.minutes(5),
    environment: {
      MAGIC_STRING: magicString,
    },
  });

  fn.role?.attachInlinePolicy(
    new Policy(scope, `hc-${lambdaName}-policy`, {
      statements: [BasicLambdaPolicyStatement],
    })
  );

  return fn;
};

export const createCustomEmailSenderLambda = (
  scope: Construct,
  configTable: Table,
  tenantId: string,
  spPortalUrl: string,
  // customSenderKey: Key,
  smtpScrets: Secret
) => {
  const lambdaName = 'customemailsender';

  const lambda = new Function(scope, lambdaName, {
    runtime: Runtime.NODEJS_20_X,
    handler: 'index.handler',
    code: Code.fromAsset(path.join(__dirname, `/../lambda/${lambdaName}/dist`)),
    environment: {
      CONFIG_TABLE: configTable.tableName,
      APP_URL: spPortalUrl,
      SMTPSECRET_NAME: smtpScrets.secretName,
      // SERVICE_NAME: serviceName,
    },
    timeout: Duration.minutes(5)
  });

  lambda.role?.attachInlinePolicy(
    new Policy(scope, `${lambdaName}-policy-${tenantId}`, {
      statements: [
        new PolicyStatement({
          resources:
            [configTable.tableArn]
          ,
          actions: [
            'dynamodb:GetItem',
            'dynamodb:Scan',
          ],
        }),
        new PolicyStatement({
          resources: [
            smtpScrets.secretArn + '*',
          ],
          actions: [
            'secretsmanager:GetSecretValue',
          ],
        }),
      ],
    })
  );

  return lambda;
}

