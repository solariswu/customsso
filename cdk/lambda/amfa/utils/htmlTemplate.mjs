const HTML_TEMPLATE = (user, type, value) => {
	const diff = value && value.length > 0 ?
		`<p>Your ${type} MFA value has been changed.</p>
			<p>The new value is:</p>
			<p>${value}</p>` :
		`<p>Your ${type} MFA value has been removed.</p>`;

	return `
	  <!DOCTYPE html>
	  <html>
		<head>
		  <meta charset="utf-8">
		  <title>Email Title</title>
		  <style>
			.container {
			  width: 100%;
			  height: 100%;
			  padding: 20px;
			  background-color: #f4f4f4;
			}
			.email {
			  width: 80%;
			  margin: 0 auto;
			  background-color: #fff;
			  padding: 20px;
			}
			.email-header {
			  background-color: #333;
			  color: #fff;
			  padding: 20px;
			  text-align: center;
			}
			.email-body {
			  padding: 20px;
			}
			.email-footer {
			  background-color: #333;
			  color: #fff;
			  padding: 20px;
			  text-align: center;
			}
		  </style>
		</head>
		<body>
		  <div class="container">
			<div class="email">
			  <div class="email-header">
				<h1>MFA value changed</h1>
			  </div>
			  <div class="email-body">
			  	<p>Hello ${user},</p>
				${diff}
		<p>If you did not make this change, please contact the help desk.</p>
			  </div>
			  <div class="email-footer">
				<p>APERSONA amfa</p>
			  </div>
			</div>
		  </div>
		</body>
	  </html>
	`;
}

export default HTML_TEMPLATE;