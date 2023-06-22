import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button, Spinner } from 'reactstrap';
import { apiUrl, applicationUrl } from '../const';

const LOGIN = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
  const apti = location.state?.apti;
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
      password,
      rememberDevice,
      authParam,
      apti,
      state,
      redirectUri,
      phase: 'password'
    };

    const options = {
      method: 'POST',
      body: JSON.stringify({ email, password, apti, state, redirectUri }),
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

        switch (result.status) {
          case 200:
            const response = await result.json();
            if (response.location) {
              window.location.assign(response.location);
            }
            break;
          case 202:
            const response2 = await result.json();
            console.log(response2);
            navigate('/mfa', {
              state: {
                email,
                rememberDevice,
                apti,
                state,
                redirectUri,
                aemail: response2['custom:alter-email'],
                phoneNumber: response2.phone_number,
                vPhoneNumber: response2['custom:voice-number'] ? response2['custom:voice-number'] : response2.phoneNumber,
                otpOptions: response2.otpOptions,
              }
            });
            break;
          case 505:
            localStorage.setItem('OTPErrorMsg', "The login service is not currently available. Please contact the help desk.");
            window.location.assign(`${applicationUrl}?amfa=relogin`);
            break;
          default:
            const data = await result.json();
            let errMsg = 'Something went wrong, please try your login again.';
            if (data.message === "NotAuthorizedException") {
              errMsg = 'Invalid credentials.';
            }
            localStorage.setItem('OTPErrorMsg', errMsg);
            window.location.assign(`${applicationUrl}?amfa=relogin`);
            break;
        }
      }
      else {
        const data = await res.json();

        let errMsg = 'Something went wrong, please try your login again.';

        if (data.name === "NotAuthorizedException") {
          errMsg = 'Invalid credentials.';
        }
        localStorage.setItem('OTPErrorMsg', errMsg);
        window.location.assign(`${applicationUrl}?amfa=relogin`);
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
      <span><h4>Sign in to your account</h4></span>
      <hr className="hr-customizable" />
      <div>
        <span className='idpDescription-customizable'> Please enter your password </span><br />
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
      {!isLoading && <span className='textDescription-customizable'><div className="link-customizable" onClick={() =>
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