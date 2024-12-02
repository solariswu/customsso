import { SecretValue, RemovalPolicy } from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { ASMSecretName, SMTPSecretName, SecretName } from "./const";


export class AmfaSecrets {
	scope: Construct
	secret: Secret;
	asmSecret: Secret;
	smtpSecret: Secret;

	constructor(scope: Construct,
		tenantAuthToken: string | undefined,
		mobileTokenSalt: string | undefined, mobileTokenKey: string | undefined,
		providerId: string | undefined,
		asmSalt: string | undefined, smtpHost: string | undefined,
		smtpUser: string | undefined, smtpPass: string | undefined,
		smtpPort: string | undefined, smtpSecure: string | undefined) {


		this.scope = scope;
		this.secret = this.createSecret(scope, mobileTokenSalt, mobileTokenKey, providerId, asmSalt);
		this.smtpSecret = this.createSmtpSecret(scope, smtpHost, smtpUser, smtpPass, smtpPort, smtpSecure);
		this.asmSecret = this.createAsmSecret(scope, tenantAuthToken);
	}

	private createSmtpSecret = (scope: Construct, smtpHost: string | undefined,
		smtpUser: string | undefined, smtpPass: string | undefined,
		smtpPort: string | undefined, smtpSecure: string | undefined): Secret => {

		return new Secret(scope, 'SMTPSecret', {
			secretName: SMTPSecretName,
			secretObjectValue: {
				service: SecretValue.unsafePlainText("SMTP"),
				host: SecretValue.unsafePlainText(smtpHost ? smtpHost : ''),
				port: SecretValue.unsafePlainText(smtpPort ? smtpPort : '587'),
				secure: SecretValue.unsafePlainText(smtpSecure ? smtpSecure : ''),
				user: SecretValue.unsafePlainText(smtpUser ? smtpUser : ''),
				pass: SecretValue.unsafePlainText(smtpPass ? smtpPass : '')
			},
			removalPolicy: RemovalPolicy.DESTROY,
		})
	}

	private createAsmSecret = (scope: Construct, tenantAuthToken: string | undefined): Secret => {
		return new Secret(scope, 'TenantAuthSecret', {
			secretName: ASMSecretName,
			secretObjectValue: {
				tenantAuthToken: SecretValue.unsafePlainText(tenantAuthToken ? tenantAuthToken : ''),
			},
			removalPolicy: RemovalPolicy.DESTROY,
		})
	}

	private createSecret = (scope: Construct, mobileTokenSalt: string | undefined, mobileTokenKey: string | undefined,
		providerId: string | undefined, asmSalt: string | undefined): Secret => {
		return new Secret(scope, 'MobileTokenSecret', {
			secretName: SecretName,
			secretObjectValue: {
				Mobile_Token_Key: SecretValue.unsafePlainText(mobileTokenKey ? mobileTokenKey : ''),
				Mobile_Token_Salt: SecretValue.unsafePlainText(mobileTokenSalt ? mobileTokenSalt : ''),
				asmSalt: SecretValue.unsafePlainText(asmSalt ? asmSalt : ''),
				Provider_Id: SecretValue.unsafePlainText(providerId? providerId: ''),
			},
			removalPolicy: RemovalPolicy.DESTROY,
		})
	}
}