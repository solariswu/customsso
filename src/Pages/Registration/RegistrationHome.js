import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from 'reactstrap';

import { apiUrl, clientName } from '../../const';
import { getApti, validateEmail } from '../utils';
import InfoMsg from '../../Components/InfoMsg';
import { useFeConfigs } from '../../DataProviders/FeConfigProvider';

import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const LOGIN = () => {
  const location = useLocation();
  const config = useFeConfigs();
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [token, setToken] = useState(null);

  const [isLoading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ msg: '', type: '' });
  const [email, setEmail] = useState(location.state ? location.state.email : '');

  const setErrorMsg = (msg) => {
    setMsg({ msg, type: 'error' });
  }

  const signUpWithCaptcha = async () => {
    if (!token) {
      setErrorMsg('Please complete captcha');
      return;
    }

    setLoading(true);
    const res = await fetch(`${apiUrl}/oauth2/verifyrecaptcha`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const json = await res.json();

    console.log('verify captcha result', json);
    if (json.success) {
      signUp();
      return;
    }

    setErrorMsg('captcha verify error, please retry or contact help desk.');
    setLoading(false);
    return
  }

  const handleReCaptchaVerify = useCallback(async () => {
    if (!executeRecaptcha) {
      console.log('Execute recaptcha not yet available');
      return;
    }
    try {

      const token = await executeRecaptcha('signup');
      setToken(token);

      return;
    }
    catch (err) {
      console.error('error in verify captcha', err);
      setErrorMsg('captcha verify error, please contact help desk.');
    }

    // Do whatever you want with the token
  }, [executeRecaptcha]);

  useEffect(() => {
    document.title = 'Registration';

    if (!location.state || !location.state.consent) {
      navigate('/register_consent');
      return;
    }

    handleReCaptchaVerify();

  }, [location, navigate, handleReCaptchaVerify]);

  const confirmSignUp = (e) => {
    if (e.key === "Enter") {
      if (config.enable_google_recaptcha) {
        signUpWithCaptcha();
      }
      else {
        signUp();
      }
    }
  }

  const signUp = async (e) => {
    if (!email || validateEmail(email)) {
      setErrorMsg('Please enter a valid email address');
      return;
    };

    const apti = getApti();

    const params = {
      email,
      apti,
    };

    const options = {
      method: 'POST',
      body: JSON.stringify(params),
    };

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/oauth2/checkuser`, options);
      switch (res.status) {
        case 200:
          // const result = await res.json();
          navigate('/registration_password', {
            state: {
              email,
              apti,
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
      console.error('error in sign up', err);
      setErrorMsg('new account sign up error, please contact help desk.');
      setLoading(false);
    }
  }

  return (
    <div>
      <span>
        <h4>Registration</h4>
      </span>
      <hr className="hr-customizable" />
      {config && config.enable_user_registration && <div>
        <span className='idpDescription-customizable'> Enter your {clientName} account ID </span>
        <div>
          <input name="email" id="email" className="form-control inputField-customizable" placeholder="user@email.com"
            autoCapitalize="none" required aria-label="email" value={email} type="email" onChange={(e) => setEmail(e.target.value)}
            onKeyUp={e => confirmSignUp(e)}
            disabled={isLoading}
          />
          <Button
            name="confirm" type="submit"
            className="btn btn-primary submitButton-customizable"
            disabled={isLoading}
            onClick={config.enable_google_recaptcha ? signUpWithCaptcha : signUp}
          >
            {isLoading ? 'Loading...' : 'Next'}
          </Button>
          <div id='recaptcha' name='recaptcha' />
        </div></div>}
      {!isLoading && config && !config.enable_user_registration &&
        <span className='idpDescription-customizable'> Self Sign Up is not allowed </span>
      }
      <InfoMsg isLoading={isLoading || !config} msg={msg} />
    </div>
  );
}

const RegistrationHome = () => {

  return (
    <LOGIN />
  );
}
export default RegistrationHome;