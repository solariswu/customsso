import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LOGIN = () => {
  const navigate = useNavigate();
  const [errMsg, setErrMsg] = useState('');

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
              <div><input id="signInFormPassword" name="password" type="password" className="form-control inputField-customizable"
                placeholder="Password" required v-model="password" /></div>
              <button name="confirm" type="submit" className="btn btn-primary submitButton-customizable"
                onClick={() => navigate('/mfa')}
              >
                Sign In
              </button>
              <div>
                <p className="redirect-customizable"><a
                  href="/#">Forgot Password?</a></p>
              </div>
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
                Copyright &copy; 2023 ePersona Inc.{' '}
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