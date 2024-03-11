import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from 'reactstrap';

import { apiUrl, applicationUrl } from '../const';
import { getApti, validateEmail } from '../Components/utils';
import InfoMsg from '../Components/InfoMsg';
import { useFeConfigs } from '../DataProviders/FeConfigProvider';

const LOGIN = () => {

	const [msg, setMsg] = useState({ msg: '', type: '' });
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState(null);
  const [redirectUri, setRedirectUri] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(localStorage.getItem('amfa-remember-device') || 'false');
  const [email, setEmail] = useState(localStorage.getItem('amfa-username') || '');
  const [isIniting, setIniting] = useState(true);

  const config = useFeConfigs();

	const setErrorMsg = (msg) => {
		setMsg({ msg, type: 'error' });
	}

  useEffect(() => {
    document.title = 'Login';

    const state = searchParams.get("state")
    const redirect_uri = searchParams.get("redirect_uri")

    setRedirectUri(redirect_uri);
    setState(state);
    // sessionStorage.setItem('amfa-callback-uri', redirect_uri);
    // sessionStorage.setItem('amfa-callback-state', state);

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

    setIniting (false);

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
      email,
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
              email,
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

  if (isIniting) {
    return null;
  }

  return (
    <div>
      <span>
        <h4>{config?.branding.login_app_main_page_header}</h4>
      </span>
      <hr className="hr-customizable" />
      <span className='idpDescription-customizable'> {config?.branding.login_app_main_page_message} </span>
      <hr className="hr-customizable" />
      <div>
        <input
          type="checkbox" id="remember-me" name="remember-me"
          checked={rememberDevice === 'true'}
          disabled={isLoading}
          onChange={handleRememberDevice}
        />
        <span style={{ fontSize: '1rem', marginLeft: '0.5em', color: 'grey' }}>
          This is my device, remember it.
        </span>
        <br />
      </div>

      <div>
        <input name="email" id="email" className="form-control inputField-customizable" placeholder="user@email.com"
          autoCapitalize="none" required aria-label="email" value={email} type="email" onChange={(e) => setEmail(e.target.value)}
          onKeyUp={e => confirmLogin(e)}
          disabled={isLoading}
          autoFocus
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
      {config?.enable_user_registration && !isLoading && <div>
        <span className='textDescription-customizable'> New User?
          <a href="/registration" className="textLink-customizable"> Register</a></span>
      </div>}
      {config?.enable_self_service && !isLoading && <div>
        <span className='textDescription-customizable'>
          <a href='/selfservice' className='textLink-customizable'> Update your profile</a></span>
      </div>}
     <InfoMsg isLoading={isLoading || !config} msg={msg} />
    </div>
  );
}

const Home = () => {

  return (
    <LOGIN />
  );
}
export default Home;