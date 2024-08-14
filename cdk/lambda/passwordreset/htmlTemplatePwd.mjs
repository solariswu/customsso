const HTML_TEMPLATE_PWD = (user, logoUrl, isByAdmin, serviceName) => {

	return `
		<!DOCTYPE html >
			<html>
				<head>
					<meta charset="utf-8">
						<title>Email Title</title>
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
							<img src="${logoUrl}" alt="logo" />
						</div>
						<div class="email">
							<div>
								<h1>Password changed</h1>
							</div>
							<div class="email-body">
								<p>Hello ${user},</p>
								<p>The password on your account has recently been reset${isByAdmin ? ' by Admin' : ''}. If you performed this password reset, then this message is for your information only.</p>
								<br/>
								<p>If you are not sure you or your administrator performed this password reset, then you should contact your administrator immediately or change your password yourself.</p>
							</div>
							<div class="email-footer">
								<p>${serviceName}</p>
							</div>
						</div>
					</div>
				</body>
			</html>
	`;
}

export default HTML_TEMPLATE_PWD;