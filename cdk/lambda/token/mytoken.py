import json
import os

import boto3
from botocore.exceptions import ClientError

AWS_REGION = os.environ.get('AWS_REGION')

DBTABLE_NAME = os.environ.get('AUTHCODE_TABLE')


def handler(event, context):

    print(event)

    bodyStr = event['body']
    code = ''
    clientsecret = ''

    for t in bodyStr.split('&'):
        param = t.split('=')
        if param[0] == 'code':
            code = param[1]
        elif param[0] == 'client_secret':
            clientSecret = param[1]
        elif param[0] == 'client_id':
            clientId = param[1]

    RESCODE = 200
    RESBODY = json.dumps("All Good!")

    dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)

    table = dynamodb.Table(DBTABLE_NAME)

    try:
        response = table.get_item(Key={'authcode': code})
    except ClientError as e:
        print(e.response['Error']['Message'])
        RESBODY = json.dumps(e.response['Error']['Message'])
        RESCODE = 400
    else:
        print(response)
        tokens = response['Item']['tokenString']
        table.delete_item(Key={'authcode': code})

        RESCODE = response['ResponseMetadata']['HTTPStatusCode']
        RESBODY = tokens

    return {
        'statusCode': RESCODE,
        'body': RESBODY
    }
