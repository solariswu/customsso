const response = (headers, statusCode, body, requestIdIn) => {
    const requestId = requestIdIn ? requestIdIn : '';

    console.log('amfa asm admin delete user response', statusCode, body, requestId);

    return {
        isBase64Encoded: false,
        statusCode,
        headers: { ...headers, requestId },
        body: JSON.stringify({ message: body }),
    };
};

export const asmDeleteUser = async (headers, email, configs, requestId, policies, admin) => {

	console.log('asmDeleteUser payload ', email, ' configs ', configs)
	const postURL = `${configs.asmurl}/extRemoveUser.kv?l=${policies.user['policy_name']}&u=${encodeURIComponent(email)}&admin=${encodeURIComponent(admin ? admin : 'AWS-ASM-Svc')}&reason=${encodeURIComponent('AWS Admin Delete')}`

	try {
		console.log ('Now posting to ', postURL);
		const amfaResponse = await fetch(postURL, {
			method: "POST"
		});
		console.log ('asm admin delete user result', amfaResponse);
	} catch (error) {
		// no issue as this may due to user has been deleted
		console.log('Function[asmDeleteUser] asm api error ', error)
	}

	return response(headers, 200, 'User deleted suceessfully', requestId);
}
