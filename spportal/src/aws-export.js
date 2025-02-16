import { AmfaServiceDomain, AdminAPIUrl, ProjectRegion, EndUserAppClientId, EndUserPoolId, OAuthDomainName } from "/amfaext.js";

/* aPersona End User Portal Settings */
export const amfa_service_domain = AmfaServiceDomain;

/* The string below MUST be quoted with `  ` and NOT ' ' */
export const apiUrl = AdminAPIUrl;

const awsmobile = {
	aws_project_region: ProjectRegion,
	aws_user_pools_web_client_id: EndUserAppClientId,
	aws_user_pools_id: EndUserPoolId,  // end user userpool id
	aws_oauth_domain: OAuthDomainName,
};
export default awsmobile;
