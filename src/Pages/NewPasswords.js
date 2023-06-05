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
    if (!location.state || !location.state.validated) {
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

  const username = location.state?.username;
  const uuid = location.state?.uuid;
  const apti = location.state?.apti;

  const [errorMsg, setErrorMsg] = useState(null);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordType, setPasswordType] = useState('password');
  const [isLoading, setLoading] = useState(false);
  const [isResetDone, setResetDone] = useState(false);

  const confirmLogin = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  }

  const minLength = (value) => {
    if (value && value.length >= 8) return undefined;
    return 'Password must be at least 8 characters';
  }
  const hasLowercase = (value) => {
    if (value && /[a-z]/.test(value)) return undefined;
    return 'Password must contain at least one lowercase letter';
  }
  const hasUppercase = (value) => {
    if (value && /[A-Z]/.test(value)) return undefined;
    return 'Password must contain at least one uppercase letter';
  }
  const hasNumber = (value) => {
    if (value && /[0-9]/.test(value)) return undefined;
    return 'Password must contain at least one number';
  }
  const hasSpecial = (value) => {
    if (value && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return undefined;
    return 'Password must contain at least one special character';
  }
  const validatePassword = (value) => {
    if (minLength(value)) return minLength(value);
    if (hasLowercase(value)) return hasLowercase(value);
    if (hasUppercase(value)) return hasUppercase(value);
    if (hasNumber(value)) return hasNumber(value);
    if (hasSpecial(value)) return hasSpecial(value);
    return undefined;
  }

  const validTwoPasswords = () => {
    if (!password) {
      setErrorMsg('Please enter password');
      return false;
    };

    const passwordValidation = validatePassword(password);

    if (passwordValidation) {
      setErrorMsg(passwordValidation);
      return false;
    }

    if (!newPassword) {
      setErrorMsg('Please enter new password');
      return false;
    }

    if (password !== newPassword) {
      setErrorMsg('Passwords do not match');
      return false;
    }

    return true;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('handleSubmit');

    console.log('validatePassword', validatePassword(password));

    console.log('validTwoPasswords', validTwoPasswords());

    if (validTwoPasswords()) {

      const options = {
        method: 'POST',
        body: JSON.stringify({ email: username, password, uuid, apti }),
      };

      setLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch(`${apiUrl}/oauth2/passwordreset`, options);
        console.log('res', res);

        switch (res.status) {
          case 200:
            localStorage.setItem('OTPErrorMsg', '');
            setResetDone(true);
            break;
          default:
            const data = await res.json();
            let errMsg = 'Something went wrong, please try your login again.';
            if (data.message === "NotAuthorizedException") {
              errMsg = 'Invalid credentials.';
            }
            setErrorMsg(errMsg);
            // localStorage.setItem('OTPErrorMsg', errMsg);
            // window.location.assign(`${applicationUrl}?amfa=relogin`);
            break;
        }
      }
      catch (err) {
        console.log(err);
        setErrorMsg('Password Reset Failed. Please try again. If the problem persists, please contact help desk.');
      }
      finally {
        setLoading(false);
      }
    }
  }

  const ResetDone = () => {
    return (
      <div>
        <span className='idpDescription-customizable'> Your password has been changed. </span><br />
        <Button name="confirm" type="submit" className="btn btn-primary submitButton-customizable"
          variant="success"
          onClick={{ applicationUrl } ?
            window.location.assign(`${applicationUrl}?amfa=relogin`) :
            window.close()}
        >
          {applicationUrl ? 'Return to the Login Page' : 'Close this window'}
        </Button>
      </div >
    )

  }

  const toggle = () => (passwordType === "password") ? setPasswordType("text") : setPasswordType("password");

  return (
    <div>
      <span><h4>Password Reset</h4></span>
      <hr className="hr-customizable" />
      {isResetDone ? <ResetDone /> :
        <div>
          <span className='idpDescription-customizable'> Ensert your new password </span>
          <div className="input-group">
            <input id="signInFormPassword" name="password" type={passwordType} className="form-control inputField-customizable"
              style={{ height: '40px' }}
              placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)}
              autoFocus
              onKeyUp={e => confirmLogin(e)}
              disabled={isLoading}
            />
            <button className="btn btn-primary" onClick={toggle} >
              {passwordType === "password" ? (
                <svg
                  width="20"
                  height="17"
                  fill="#C0C0C0"
                  className="bi bi-eye-slash-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z" />
                  <path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="17"
                  fill="#C0C0C0"
                  className="bi bi-eye-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
                  <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                </svg>
              )}
            </button>
          </div>
          <span className='idpDescription-customizable'> Verify your new password </span>
          <div className="input-group">
            <input id="signInFormNewPassword" name="newPassword" type={passwordType} className="form-control inputField-customizable"
              style={{ height: '40px' }}
              placeholder="Repeat Password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              onKeyUp={e => confirmLogin(e)}
              disabled={isLoading}
            />
            <button className="btn btn-primary" onClick={toggle}>
              {passwordType === "password" ? (
                <svg
                  width="20"
                  height="17"
                  fill="#C0C0C0"
                  className="bi bi-eye-slash-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z" />
                  <path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="17"
                  fill="#C0C0C0"
                  className="bi bi-eye-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
                  <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                </svg>
              )}
            </button>
          </div>
          <Button name="confirm" type="submit" className="btn btn-primary submitButton-customizable"
            variant="success"
            disabled={isLoading}
            onClick={!isLoading ? handleSubmit : null}
          >
            {isLoading ? 'Sending...' : 'Complete'}
          </Button>
        </div>}
      {isLoading ? <span className='errorMessage-customizable'><Spinner color="primary" >{''}</Spinner></span> : (
        errorMsg && <div>
          <br />
          <span className='errorMessage-customizable'>{errorMsg}</span>
        </div>)}
    </div >
  );
}

const NewPasswords = () => {

  return (
    <LOGIN />
  )
}
export default NewPasswords;