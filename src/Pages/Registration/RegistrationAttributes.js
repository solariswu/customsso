import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from 'reactstrap';

import { apiUrl } from '../../const';
import { getApti, validateEmail } from '../utils';
import InfoMsg from '../../Components/InfoMsg';
import PhoneInput from 'react-phone-number-input';

const LOGIN = () => {
  const location = useLocation();
  const [isLoading, setLoading] = useState(false);

  const [msg, setMsg] = useState({ msg: '', type: '' });
  const [altEmail, setAltEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [voiceNumber, setVoiceNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const setErrorMsg = (msg) => {
    setMsg({ msg, type: 'error' });
  }

  useEffect(() => {
    document.title = 'Registration';

  }, []);

  const navigate = useNavigate();
  const email = location.state ? location.state.email : '';
  const apti = location.state ? location.state.apti : '';

  const signUp = async (e) => {
    console.log('now in sign up ');

    if (!altEmail || validateEmail(altEmail)) {
      setErrorMsg('Please enter a valid email address');
      return;
    };

    const apti = getApti();
    // const authParam = window.getAuthParam();

    const params = {
      email,
      // authParam: window.getAuthParam(),
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
      <span className='idpDescription-customizable'> First Name  </span>
      <div>
        <input name="firstName" id="firstname" className="form-control inputField-customizable" placeholder="First Name"
          required aria-label="first name" value={firstName} type="text" onChange={(e) => setFirstName(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <span className='idpDescription-customizable'> Last Name </span>
      <div>
        <input name="lastName" id="lastname" className="form-control inputField-customizable" placeholder="Last Name"
          required aria-label="last name" value={lastName} type="text" onChange={(e) => setLastName(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <span className='idpDescription-customizable'> Alt Email </span>
      <div>
        <input name="altEmail" id="altemail" className="form-control inputField-customizable" placeholder="user@email.com"
          autoCapitalize='none' required aria-label="alt email" value={altEmail} type="email" onChange={(e) => setAltEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <span className='idpDescription-customizable'> Phone Number </span>
      <div>
        <PhoneInput
          international
          countryCallingCodeEditable={false}
          defaultCountry="US"
          placeholder="phone number"
          value={phoneNumber}
          onChange={setPhoneNumber}
          disabled={isLoading}
        />
      </div>
      <span className='idpDescription-customizable'> Voice Number </span>
      <div>
        <PhoneInput
          international
          countryCallingCodeEditable={false}
          defaultCountry="US"
          placeholder="phone number"
          value={voiceNumber}
          onChange={setVoiceNumber}
          disabled={isLoading}
        />
        <Button
          name="confirm" type="submit"
          className="btn btn-primary submitButton-customizable"
          disabled={isLoading}
          onClick={!isLoading ? signUp : null}
        >
          {isLoading ? 'Loading...' : 'Next'}
        </Button>
      </div>
      <InfoMsg isLoading={isLoading} msg={msg} />
    </div>
  );
}

const RegistrationAttributes = () => {

  return (
    <LOGIN />
  );
}
export default RegistrationAttributes;