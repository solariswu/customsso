import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from 'reactstrap';

import { amfaConfigs } from '../const';
import { clientName } from '../const';

const Home = () => {
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState(null);
  const [redirectUri, setRedirectUri] = useState(null);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    const state = searchParams.get("state")
    const redirect_uri = searchParams.get("redirect_uri")

    setRedirectUri(redirect_uri);
    setState(state);

  }, [searchParams]);

  const LOGIN = () => {
    const navigate = useNavigate();
    const [rememberDevice, setRememberDevice] = useState(sessionStorage.getItem('amfa-remember-device') || 'false');
    const [email, setEmail] = useState('');

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
        sessionStorage.setItem('amfa-remember-device', newChoice);
      }
    }

    const stepone = async (e) => {
      const mailformat = /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i;
      // /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!email || !email.match(mailformat)) {
        setErrorMsg('Please enter a valid email address');
        return;
      };

      const apti = (Math.random().toString(36).substring(2, 16) + Math.random().toString(36).substring(2, 16));
      sessionStorage.setItem('apti', apti);

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
      };

      setLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch(`${amfaConfigs.apiUrl}/amfa`, options);

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
            const result = await res.json();
            navigate('/password', {
              state: {
                username: email,
                rememberDevice,
                apti,
                state,
                redirectUri,
                aemail: result.nickname,
                phoneNumber: result.phone_number,
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
      <div className="container">
        <div className="modal-dialog">
          <div className="modal-content background-customizable modal-content-mobile visible-xs visible-sm">
            <div style={{ height: '5px', background: 'orange' }} />
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <span><h3>Sign in to your account</h3></span>
              <br />
              <div>
                <input
                  type="checkbox" id="remember-me" name="remember-me"
                  checked={rememberDevice === 'true'}
                  onChange={handleRememberDevice}
                />
                <span style={{ fontSize: '1rem', marginLeft: '0.5em', color: 'grey' }}>
                  This is my device, remember it.
                </span>
              </div>
              <div className="login-or">
                <hr className="hr-customizable" />
              </div>
              <div>
                <span className='idpDescription-customizable'> Login with your {clientName} account </span><br />
                <input name="email" id="email" className="form-control inputField-customizable" placeholder="user@email.com"
                  autoCapitalize="none" required aria-label="email" value={email} type="email" onChange={(e) => setEmail(e.target.value)}
                  onKeyUp={e => confirmLogin(e)}
                  disabled={isLoading} />
                <Button
                  name="confirm" type="submit"
                  className="btn btn-primary submitButton-customizable"
                  disabled={isLoading}
                  onClick={!isLoading ? stepone : null}
                >
                  {isLoading ? 'Sending...' : 'Confirm'}
                </Button>
              </div>
              <div>
                <span className='textDescription-customizable'> New User?
                  <a href="/password" className="textLink-customizable"> Register</a></span>
              </div>
              {errorMsg && <div>
                <br />
                <span className='errorMessage-customizable'>{errorMsg}</span>
              </div>}
              <hr className='hr-customizable' />
              <div className='footer-customizable'>
                <span
                  className='legalText-customizable'
                >
                  Copyright &copy; 2023 ePersona Inc. v0.1
                </span>
              </div>
            </div>
          </div>
        </div>

      </div >
    );
  }

  return (
    <LOGIN />
  );
}
export default Home;