import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button, Spinner } from 'reactstrap';

import { allowSelfSignUp, apiUrl, clientName, applicationUrl } from '../const';
import { getApti, validateEmail } from './utils';

const LOGIN = () => {

  const [errorMsg, setErrorMsg] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState(null);
  const [redirectUri, setRedirectUri] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(localStorage.getItem('amfa-remember-device') || 'false');
  const [email, setEmail] = useState(localStorage.getItem('amfa-username') || '');

  useEffect(() => {
    const state = searchParams.get("state")
    const redirect_uri = searchParams.get("redirect_uri")

    setRedirectUri(redirect_uri);
    setState(state);

    const previousState = sessionStorage.getItem('amfa-state');

    if (state === null || state === '' || state === previousState) {
      window.location.assign(`${applicationUrl}?amfa=relogin`);
    }
    else {
      sessionStorage.setItem('amfa-state', state);
    }

    const otpErrorMsg = localStorage.getItem('OTPErrorMsg');
    if (otpErrorMsg) {
      setErrorMsg(otpErrorMsg);
      localStorage.removeItem('OTPErrorMsg');
    }

    return () => {
      setState(null);
    }

  }, []);

  const navigate = useNavigate();

  const confirmLogin = (e) => {
    if (e.key === "Enter") {
      stepone();
    }
  }
  const handleRememberDevice = (e) => {
    const newChoice = e.target.checked ? 'true' : 'false';

    if ((newChoice === 'true' && window.confirm('Remember this device?')) ||
      newChoice === 'false') {
      setRememberDevice(newChoice);
      localStorage.setItem('amfa-remember-device', newChoice);
    }
  }

  const stepone = async (e) => {

    if (!email || validateEmail(email)) {
      setErrorMsg('Please enter a valid email address');
      return;
    };

    if (rememberDevice === 'true') {
      localStorage.setItem('amfa-username', email.trim());
    }

    const apti = getApti();
    const authParam = window.getAuthParam();

    const params = {
      email: email.toLocaleLowerCase(),
      rememberDevice,
      authParam,
      apti,
      state,
      redirectUri,
      phase: 'username'
    };

    const options = {
      method: 'POST',
      body: JSON.stringify(params),
      credentials: 'include',
    };

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${apiUrl}/amfa`, options);

      switch (res.status) {
        case 200:
          const response = await res.json();
          if (response.location) {
            window.location.assign(response.location);
            return;
          }
          else {
            setErrorMsg('Passwordless login error, please contact help desk.');
          }
          break;
        case 202:
          // const result = await res.json();
          navigate('/password', {
            state: {
              email: email.toLocaleLowerCase(),
              rememberDevice,
              apti,
              state,
              redirectUri
            }
          });
          break;
        default:
          const data = await res.json();
          if (data) {
            setErrorMsg(data.message ? data.message : JSON.stringify(data));
          }
          else {
            setErrorMsg('Unknown error, please contact help desk.');
          }
          break;
      }
      setLoading(false);
    }
    catch (err) {
      console.error('error in home', err);
      setErrorMsg('Email login error, please contact help desk.');
      setLoading(false);
    }
  }


  return (
    <div>
      <span>
        <h4>Sign in to your account</h4>
      </span>
      <hr className="hr-customizable" />
      <span className='idpDescription-customizable'> Login with your {clientName} account </span>
      <div>
        <input
          type="checkbox" id="remember-me" name="remember-me"
          checked={rememberDevice === 'true'}
          onChange={handleRememberDevice}
        />
        <span style={{ fontSize: '1rem', marginLeft: '0.5em', color: 'grey' }}>
          This is my device, remember it.
        </span>
        <br />
        <br />
      </div>

      <div>
        <input name="email" id="email" className="form-control inputField-customizable" placeholder="user@email.com"
          autoCapitalize="none" required aria-label="email" value={email} type="email" onChange={(e) => setEmail(e.target.value)}
          onKeyUp={e => confirmLogin(e)}
          disabled={isLoading}
        />
        <Button
          name="confirm" type="submit"
          className="btn btn-primary submitButton-customizable"
          disabled={isLoading}
          onClick={!isLoading ? stepone : null}
        >
          {isLoading ? 'Sending...' : 'Sign In'}
        </Button>
      </div>
      {allowSelfSignUp && !isLoading && <div>
        <span className='textDescription-customizable'> New User?
          <a href="/password" className="textLink-customizable"> Register</a></span>
      </div>}
      {isLoading ? <span className='errorMessage-customizable'><Spinner color="primary" >{''}</Spinner></span> :
        (errorMsg && <div>
          <br />
          <span className='errorMessage-customizable'>{errorMsg}</span>
        </div>)}
    </div>

  );
}

const Home = () => {

  return (
    <LOGIN />
  );
}
export default Home;