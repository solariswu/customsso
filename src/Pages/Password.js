import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button } from 'reactstrap';
import { amfaConfigs } from '../const';

const LOGIN = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!location.state) {
      navigate('/');
    }
  },  [location, navigate]);

  const username = location.state?.username;
  const rememberDevice = location.state?.rememberDevice;
  const apti = location.state?.apti;
  const state = location.state?.state;
  const redirectUri = location.state?.redirectUri;

  const [errorMsg, setErrorMsg] = useState(null);
  const [password, setPassword] = useState('');
  const [isLoading, setLoading] = useState(false);

  const steptwo = async (e) => {
    const authParam = window.getAuthParam();

    const params = {
      email: username,
      password,
      rememberDevice,
      authParam,
      apti,
      phase: 'password'
    };

    const options = {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    };

    console.log('password params:', params);

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${amfaConfigs.apiUrl}/oauth2/admininitauth`, options);

      if (res.status === 200) {
        const result = await fetch(`${amfaConfigs.apiUrl}/amfa`, {
          method: 'POST',
          body: JSON.stringify(params),
        });

        switch (result.status) {
          case 200:
            console.log('get steptwo 200 back');
            break;
          case 202:
            navigate('/mfa', {
              state: {
                username,
                rememberDevice,
                apti,
                state,
                redirectUri,
              }
            });
            break;
          default:
            const data = await result.json();
            console.log('got step two data back:', data);
            if (data) {
              setErrorMsg(data.message ? data.message : data.name ? data.name : JSON.stringify(data));
            }
            else {
              setErrorMsg('Unknown error, please contact help desk.');
            }
            break;
        }
      }
    }
    catch (err) {
      console.error('error in password login', err);
      setErrorMsg('Password login error, please contact help desk.');
    }
    finally {
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
            <div className="login-or">
              <hr className="hr-customizable" />
            </div>
            <div>
              <span className='textDescription-customizable'> Please enter your password </span><br />
              <input id="signInFormPassword" name="password" type="password" className="form-control inputField-customizable"
                placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button name="confirm" type="submit" className="btn btn-primary submitButton-customizable"
                variant="success"
                disabled={isLoading}
                onClick={!isLoading ? steptwo : null}
              >
                {isLoading ? 'Sending...' : 'Sign In'}
              </Button>
              <div>
                <p className="redirect-customizable"><a
                  href="/#">Forgot Password?</a></p>
              </div>
            </div>
            {errorMsg && <div>
              <br />
              <span className='errorMessage-customizable'>{errorMsg}</span>
            </div>}
            <hr className='hr-customizable' />
            <div className='footer-customizable'>
              <span
                style={{ fontSize: '0.8rem', marginLeft: '0.5em', color: 'grey' }}
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

const Password = () => {

  return (
    <LOGIN />
  )
}
export default Password;