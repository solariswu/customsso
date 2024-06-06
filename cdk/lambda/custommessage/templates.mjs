const templateCommonHead = (email_logo_url) => `  <html>
  <head>
  <meta charset="utf-8">
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
        <img
        alt="logo"
        src="${email_logo_url}"
      />
    </div>
    <div class="email">
      <div class="email-body">
      `;

const templateCommonTail = (username, code) => `
    <div style="display:none;">${username}-${code}</div>
    </div></body></html>`;

const templateInviteBody = (name, email, username, code) => `
   <p>Hi ${name ? name : username}&#44</p>
   <br/>
   <p>${process.env.SERVICE_NAME} has created a new account for you.</p>
   <p>Your login id is ${email}. Please use it to login and set up your new account.</span></p>`;

const templateInviteButton = `
    <div style = "text-align: center; font-size: 12pt; padding: 2em" >
      <a href="${process.env.APP_URL}" style="text-decoration: none; color: #fff;padding: 0.5em 4em; background-color:#06AA6D; border-radius: 0.3em"> Complete Registration </a>
    </div >`;

export const templateInvite = (name, email, username, code, configs) =>
	templateCommonHead(configs.email_logo_url) +
	templateInviteBody(name, email, username, code) +
	'</div >' +
	templateInviteButton +
	templateCommonTail(username, code);

const templateResetButton = `
    <div style="text-align: center; font-size: 12pt; padding: 2em">
      <a href="${process.env.APP_URL}" style="text-decoration: none; color: #fff;padding: 0.5em 4em; background-color:#06AA6D; border-radius: 0.3em"> Login and Set New Password </a>
    </div>`;

const templateResetBody = (name, email, code) => `
    <p>Hi ${name ? name : email}&#44</p>
    <br/>
    <p>${process.env.SERVICE_NAME}: Please be advised that your account password has been reset for security reasons.</p>
    <p>The next time you login, you will be required to update your password.</p>
`;

export const templateReset = (name, email, username, code, configs) =>
	templateCommonHead(configs.email_logo_url) +
	templateResetBody(name, email, code) +
	'</div>' +
	templateResetButton +
	templateCommonTail(username, code);