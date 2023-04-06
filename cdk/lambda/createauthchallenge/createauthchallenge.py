import string
import random
import os


AWS_REGION = os.environ.get('AWS_REGION')
CHARSET = "UTF-8"



# def isInputparamsValid(event):
#     if event['request']['userNotFound'] == True:
#         return False
#     return True


def handler(event, context):

    print(event)

    # printing letters
    # letters = string.ascii_letters
    # magicstring = (''.join(random.choice(letters) for i in range(10)))

    # if isInputparamsValid(event) != True:
    #     raise Exception(
    #         "Something wrong with the email address. Have you signed up?")

    RECIPIENT = event['request']['userAttributes']['email']
    magicstring = os.environ.get('MAGIC_STRING')
    print(magicstring)
    # This is sent back to the client app
    event['response']['publicChallengeParameters'] = {}

    event['response']['publicChallengeParameters']['username'] = RECIPIENT

    # Add the secret login code to the private challenge parameters
    # so it can be verified by the "Verify Auth Challenge Response" trigger
    event['response']['privateChallengeParameters'] = {}
    event['response']['privateChallengeParameters']['magicCode'] = magicstring

    # Add the secret login code to the session so it is available
    # in a next invocation of the "Create Auth Challenge" trigger
    event['response']['challengeMetadata'] = 'CODE-' + magicstring

    print(event)

    return event
