import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import InfoMsg from '../../Components/InfoMsg';
import { Button } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { applicationUrl } from '../../const';


const LOGIN = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [msg, setMsg] = useState({ msg: '', type: '' });
  const [given_name, setGivenName] = useState(location.state?.attributes ? location.state?.attributes?.given_name : '');
  const [family_name, setFamilyName] = useState(location.state?.attributes ? location.state?.attributes?.family_name : '');;

  const { t } = useTranslation();

  const setErrorMsg = (msg) => {
    setMsg({ msg, type: 'error' });
  }

  useEffect(() => {
    document.title = 'Registration';
    if (!location?.state?.email || !location?.state?.password || !location?.state?.apti) {
      navigate('/register_consent');
    }
  }, [navigate, location]);

  const email = location.state ? location.state.email : '';
  const password = location.state ? location.state.password : '';
  const apti = location.state ? location.state.apti : '';

  const signUp = async (e) => {
    // console.log('now in sign up ');

    if (!given_name || given_name.trim().length < 1) {
      setErrorMsg('Please enter a valid first name');
      return;
    };

    if (!family_name || family_name.length < 1) {
      setErrorMsg('Please enter a valid last name');
      return;
    }

    const attributes = { given_name, family_name }

    navigate('/registration_verify', {
      state: {
        email,
        password,
        apti,
        attributes,
      }
    });
  }

  return (
    <div>
      <span>
        <h4>Registration</h4>
      </span>
      <hr className="hr-customizable" />
      <span className='idpDescription-customizable'> {t('registration_app_first_name')}  </span>
      <div style={{ alignItems: 'left' }}>
        <input name="firstName" id="firstname" className="form-control inputField-customizable" placeholder={t('registration_app_first_name')}
          required aria-label="first name" value={given_name} type="text" onChange={(e) => setGivenName(e.target.value)}
        />
        <span className='idpDescription-customizable'> {t('registration_app_last_name')} </span>
        <div>
          <input name="lastName" id="lastname" className="form-control inputField-customizable" placeholder={t('registration_app_last_name')}
            required aria-label="last name" value={family_name} type="text" onChange={(e) => setFamilyName(e.target.value)}
          />
        </div>
      </div>
      <Button name="confirm" type="submit" className="btn btn-primary submitButton-customizable"
        variant="success"
        onClick={() => signUp()}
      >
        Next
      </Button>
      <Button name="back" type="submit" className="btn btn-secondary submitButton-customizable-back"
        onClick={() => window.location.assign(applicationUrl)}
        style={{marginTop: '10px'}}
      >
        Cancel
      </Button>

      <InfoMsg msg={msg} isLoading={false} />
    </div>
  );
}

const RegistrationAttributes = () => {

  return (
    <LOGIN />
  );
}
export default RegistrationAttributes;