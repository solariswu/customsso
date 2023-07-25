import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import InfoMsg from '../../Components/InfoMsg';
import { Button } from 'reactstrap';


const LOGIN = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [msg, setMsg] = useState({ msg: '', type: '' });
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const setErrorMsg = (msg) => {
    setMsg({ msg, type: 'error' });
  }

  useEffect(() => {
    document.title = 'Registration';
    if (!location?.state?.email) {
      navigate('/register');
    }
  }, [navigate, location]);

  const email = location.state ? location.state.email : '';
  const apti = location.state ? location.state.apti : '';

  const signUp = async (e) => {
    console.log('now in sign up ');

    if (!firstName || firstName.trim().length < 1) {
      setErrorMsg('Please enter a valid first name');
      return;
    };

    if (!lastName || lastName.length < 1) {
      setErrorMsg('Please enter a valid last name');
      return;
    }

    navigate('/registration_password', {
      state: {
        email,
        firstName,
        lastName,
        apti,
      }
    });
  }

  return (
    <div>
      <span>
        <h4>Registration</h4>
      </span>
      <hr className="hr-customizable" />
      <span className='idpDescription-customizable'> First Name  </span>
      <div style={{ alignItems: 'left' }}>
        <input name="firstName" id="firstname" className="form-control inputField-customizable" placeholder="First Name"
          required aria-label="first name" value={firstName} type="text" onChange={(e) => setFirstName(e.target.value)}
        />
        <span className='idpDescription-customizable'> Last Name </span>
        <div>
          <input name="lastName" id="lastname" className="form-control inputField-customizable" placeholder="Last Name"
            required aria-label="last name" value={lastName} type="text" onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>
      <Button name="confirm" type="submit" className="btn btn-primary submitButton-customizable"
        variant="success"
        onClick={() => signUp()}
      >
        Next
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