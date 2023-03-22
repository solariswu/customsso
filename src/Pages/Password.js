import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LOGIN = () => {
  const navigate = useNavigate();
  const [errMsg, setErrMsg] = useState('');

  return (
    <div class="container">
      <div class="modal-dialog">
        <div class="modal-content background-customizable modal-content-mobile visible-xs visible-sm">
          <div style={{ height: '5px', background: 'orange' }} />
          <div class="modal-body" style={{ textAlign: 'center' }}>
            <span><h3>Sign in to your account</h3></span>
            <br />
            <div class="login-or">
              <hr class="hr-customizable" />
            </div>
            <div>
              <span class='textDescription-customizable'> Please enter your password </span><br />
              <div><input id="signInFormPassword" name="password" type="password" class="form-control inputField-customizable"
                                 placeholder="Password" required v-model="password" /></div>
              <button name="confirm" type="submit" class="btn btn-primary submitButton-customizable"
                onClick={() => navigate('/mfa')}
              >
                Sign In
              </button>
              <div>
                <p class="redirect-customizable"><a
                  href="/#">Forgot Password?</a></p>
              </div>
            </div>
            {errMsg && <div>
              <br />
              <span class='errorMessage-customizable'>{errMsg}</span>
            </div>}
            <hr class='hr-customizable' />
            <div class='footer-customizable'>
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