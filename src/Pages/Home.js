import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { amfaConfigs } from '../const';

const storeOAuthQueryValues = (queryValues) => {
  console.warn('todo - storeAuthQueryValues', queryValues);
}

const Home = () => {
  const [errMsg, setErrorMsg] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams()


  useEffect(() => {
    const client_id = searchParams.get("client_id")
    const response_type = searchParams.get("response_type")
    const state = searchParams.get("state")
    const redirect_uri = searchParams.get("redirect_uri")
    const scope = searchParams.get("scope")


  }, []);

  const LOGIN = () => {
    const navigate = useNavigate();
    const [rememberDevice, setRememberDevice] = useState(sessionStorage.getItem('amfa-remember-device') || 'false');
    const [email, setEmail] = useState('');
    const [authParam, setAuthParam] = useState('');

    const handleSubmit = (e) => {
      const param = this.getAuthParam();
      setAuthParam(param);
      e.preventDefault();
    };

    const handleChange = (event) => {
      console.log("onchange:", event.target.value);
      setAuthParam(event.target.value);
    };

    const handleRememberDevice = (e) => {
      const newChoice = e.target.checked ? 'true' : 'false';

      setRememberDevice(newChoice);
      sessionStorage.setItem('amfa-remember-device', newChoice);
    }

    const stepone = (e) => {
      let apti = sessionStorage.getItem('apti');
      apti = apti ? apti : (Math.random().toString(36).substring(2, 16) + Math.random().toString(36).substring(2, 16));
      sessionStorage.setItem('apti', apti);

      const authParam = window.getAuthParam();
      console.log('authParam', authParam);

      const params = {
        email,
        rememberDevice,
        authParam,
        apti,
      };
      console.log('params', params);
      const options = {
        method: 'POST',
        body: JSON.stringify(params),
      };

      fetch(`${amfaConfigs.apiUrl}/amfa`, options)
        .then(res => res.json())
        .then(data => {
          console.log('data', data);
          if (data.error) {
            setErrorMsg(data.error);
          }
          else {
            navigate('/password');
          }
        })
        .catch(err => console.error(err));
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
                <span className='textDescription-customizable'> Login with your EPND account </span><br />
                <input name="email" id="email" className="form-control inputField-customizable" placeholder="user@email.com"
                  autoCapitalize="none" required aria-label="email" value={email} type="email" onChange={(e) => setEmail(e.target.value)} />
                <button name="confirm" type="submit" className="btn btn-primary submitButton-customizable"
                  onClick={stepone} //navigate('/password')}
                >
                  Confirm
                </button>
              </div>
              {errMsg && <div>
                <br />
                <span className='errorMessage-customizable'>{errMsg}</span>
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

  return (
    <LOGIN />
  );
}
export default Home;