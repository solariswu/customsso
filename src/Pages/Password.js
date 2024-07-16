import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button, Spinner } from 'reactstrap';
import { apiUrl, applicationUrl } from '../const';
import { useFeConfigs } from '../DataProviders/FeConfigProvider';
import { getApti } from '../Components/utils';

const LOGIN = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const config = useFeConfigs();

  const closeQuickView = () => {
    console.log('back pressed');
  }

  useEffect(() => {
    if (!location.state) {
      navigate('/');
    }

    window.history.pushState('fake-route', document.title, window.location.href);

    window.addEventListener('popstate', closeQuickView);
    return () => {
      window.removeEventListener('popstate', closeQuickView);
      // If we left without using the back button, aka by using a button on the page, we need to clear out that fake history event
      if (window.history.state === 'fake-route') {
        window.history.back();
      }
    };
  }, [location.state, navigate]);

  const email = location.state?.email;
  const rememberDevice = location.state?.rememberDevice;
  const apti = getApti();
  const state = location.state?.state;
  const redirectUri = location.state?.redirectUri;

  const [errorMsg, setErrorMsg] = useState(null);
  const [password, setPassword] = useState('');
  const [isLoading, setLoading] = useState(false);

  const confirmLogin = (e) => {
    if (e.key === "Enter") {
      steptwo();
    }
  }

  const steptwo = async (e) => {

    if (!password) {
      setErrorMsg('Please enter password');
      return;
    };
    const authParam = window.getAuthParam();

    const params = {
      email,
      password: password.trim(),
      rememberDevice,
      authParam,
      apti,
      state,
      redirectUri,
      phase: 'password'
    };

    const options = {
      method: 'POST',
      body: JSON.stringify({ email, password: password.trim(), apti, state, redirectUri }),
    };

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${apiUrl}/oauth2/admininitauth`, options);

      if (res.status === 200) {
        const result = await fetch(`${apiUrl}/amfa`, {
          method: 'POST',
          body: JSON.stringify(params),
          credentials: 'include',
        });

        // console.log('password amfa result', result.status)

        switch (result.status) {
          case 200:
            const response = await result.json();
            if (response.location) {
              window.location.assign(response.location);
            }
            break;
          case 202:
            const response2 = await result.json();
            // console.log('response back with 202 in password check', response2);
            navigate('/mfa', {
              state: {
                email,
                rememberDevice,
                apti,
                state,
                redirectUri,
                ...response2,
              }
            });
            return;
          case 401:
            // password expired
            const response401 = await result.json();
            // console.log('response back with 401 in password check', response401);
            navigate('/dualotp', {
              state: {
                email,
                apti,
                type: 'passwordreset',
                typeExtra: response401.message,
              }
            });
            return;
          case 402:
            // account under threat
            const resultMsg402 = await result.json();
            if (resultMsg402.message && resultMsg402.message.includes('under threat')) {
              setErrorMsg(resultMsg402.message);
              navigate('/dualotp', {
                state: {
                  email,
                  apti,
                  type: 'passwordreset',
                  typeExtra: 'RESET_REQUIRED',
                }
              });
              return;
            }
            else {
              setErrorMsg('Unknown 402 error, please contact help desk.');
            };
            break;
          case 505:
            const msg = "The login service is not currently available.\nPlease contact the help desk.";
            localStorage.setItem('OTPErrorMsg', msg);
            // window.history.go(-3);
            window.location.assign(`${applicationUrl}?err=${msg}`);
            break;
          default:
            const res = await result.json();
            let errMsg = 'Something went wrong, please try your login again.';
            if (res) {
              errMsg = res.message ? res.message : res.name ? res.name : JSON.stringify(res);
            }
            if (errMsg === "NotAuthorizedException") {
              errMsg = 'Invalid credentials.';
            }
            localStorage.setItem('OTPErrorMsg', errMsg);
            // window.history.go(-3);
            window.location.assign(`${applicationUrl}?err=${errMsg}`);
            break;
        }
      }
      else {
        if (res.status === 202) {
          const data = await res.json();
          console.log(data);
          navigate('/passwordreset', {
            state: {
              email,
              apti,
              uuid: data.uuid,
              validated: true,
              backable: false,
              from: 'force_change',
            }
          });
        }
        else {
          const data = await res.json();

          let errMsg = 'Something went wrong, please try your login again.';

          if (data.name === "NotAuthorizedException") {
            errMsg = 'Invalid credentials.';
          }
          localStorage.setItem('OTPErrorMsg', errMsg);
          window.location.assign(`${applicationUrl}?err=${errMsg}`);
        }
      }
    }
    catch (err) {
      setErrorMsg('Password login error, please contact help desk.');
    }
    finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <span><h4>{config?.branding.login_app_main_page_header}</h4></span>
      <div style={{ height: "0.2em" }} />
      <hr className="hr-customizable" />
      <div>
        <span className='idpDescription-customizable'> {config?.branding.login_app_password_message}</span>
        <div style={{ height: "0.5em" }} />
        <input id="signInFormPassword" name="password" type="password" className="form-control inputField-customizable"
          placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)}
          autoFocus
          onKeyUp={e => confirmLogin(e)}
          disabled={isLoading}
        />
        <Button name="confirm" type="submit" className="btn btn-primary submitButton-customizable"
          variant="success"
          disabled={isLoading}
          onClick={!isLoading ? steptwo : null}
        >
          {isLoading ? 'Sending...' : 'Sign In'}
        </Button>
      </div>
      {!isLoading && config && config.enable_password_reset && <span className='textDescription-customizable'><div className="link-customizable" onClick={() =>
        navigate('/dualotp', {
          state: {
            email,
            apti,
            type: 'passwordreset'
          }
        })}>Forgot Password?
      </div></span>}
      {isLoading ? <span className='errorMessage-customizable'><Spinner color="primary" >{''}</Spinner></span> : (
        errorMsg && <div>
          <br />
          <span className='errorMessage-customizable'>{errorMsg}</span>
        </div>)}
    </div >
  );
}

const Password = () => {

  return (
    <LOGIN />
  )
}
export default Password;