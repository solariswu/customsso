import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { amfaConfigs } from '../const';

const LOGIN = () => {
  const navigate = useNavigate();
  const location = useLocation();
  console.log('location in password:', location.state);

  const username = location.state.username;
  const rememberDevice = location.state.rememberDevice;
  const apti = location.state.apti;

  const [errorMsg, setErrorMsg] = useState(null);
  const [password, setPassword] = useState('');

  const steptwo = async (e) => {
    // const apti =  sessionStorage.getItem('apti');
    // console.log ('get apti in password:', apti);

    const authParam = window.getAuthParam();

    const params = {
      email: username,
      password,
      rememberDevice,
      authParam,
      apti,
    };

    const options = {
      method: 'POST',
      body: JSON.stringify({username, password}),
    };

    console.log ('password params:', params);

    try {
      const res = await fetch(`${amfaConfigs.apiUrl}/oauth2/admininitauth`, options);
      console.log ('password res:', res);

      switch (res.status) {
        case 200:
          console.log('got 200 back');
          break;
        case 202:
          navigate('/mfa');
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
    }
    catch (err) {
      console.error(err);
      setErrorMsg(JSON.stringify(err));
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
              <button name="confirm" type="submit" className="btn btn-primary submitButton-customizable"
                onClick={steptwo}
              >
                Sign In
              </button>
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