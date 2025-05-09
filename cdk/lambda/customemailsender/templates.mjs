const templateHead = (email_logo_url) => `  <html>
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
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
        <img
        alt="logo"
        src="${email_logo_url}"
        style="height: 57px; width: 313px"
      />
    </div>
    <div class="email">
      `;

const templateInviteBody = (name, email, serviceName) => `
  <div class="email-body">
    <p>Hi ${name ? name : email}&#44</p>
    <br/>
    <p>${serviceName} has created a new account for you.</p>
    <p>Your login id is ${email}. Please use it to login and set up your new account.</span></p>
  </div>`;

const templateInviteButton = (login_url) => `
    <div style = "text-align: center; font-size: 12pt; padding: 1em" >
      <a href="${login_url}" style="text-decoration: none; color: #fff;padding: 0.5em 1.5em; background-color:#06AA6D; border-radius: 0.3em"> Login </a>
    </div >`;

export const templateInvite = (name, email, configs) =>
  templateHead(configs.email_logo_url) +
  templateInviteBody(name, email, configs.service_name) +
  templateInviteButton(process.env.APP_URL)

const templateResetButton = (login_url) => `
    <div style="text-align: center; font-size: 12pt; padding: 1em">
      <a href="${login_url}" style="text-decoration: none; color: #fff;padding: 0.5em 1.5em; background-color:#06AA6D; border-radius: 0.3em"> Login </a>
    </div>`;

const templateResetBody = (name, email) => `
    <p>Hi ${name ? name : email}&#44</p>
    <br/>
    <p>Please be advised that your account password has been reset for security reasons.</p>
    <p>The next time you login, you will be required to update your password.</p>
`;

export const templateReset = (name, email,configs) =>
  templateHead(configs.email_logo_url) +
  templateResetBody(name, email) +
  templateResetButton(process.env.APP_URL)