import { useState } from "react";
import { Button, Modal, ModalFooter, ModalHeader, ModalBody, Spinner } from "reactstrap";
import PhoneInput from 'react-phone-number-input';

import { apiUrl, applicationUrl } from '../const';

export const OTPDialog = ({ username, otptype, sendOtpConfirmed, open, toggle }) => {
    const [content, setContent] = useState('');
    const [count, setCount] = useState(0);
    const [isLoading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (content.trim().length) {
            setLoading(true);
            const params = {
                email: username,
                authParam: window.getAuthParam(),
                phase: 'confirmOTPAddress',
                otptype,
                otpaddr: content,
                // apti,  ==> todo: use this to avoid enum attack.
            };

            setLoading(true);
            try {
                const result = await fetch(`${apiUrl}/amfa`, {
                    method: 'POST',
                    body: JSON.stringify(params),
                    credentials: 'include',
                });
                console.log('result', result);

                const resultMsg = await result.json();
                console.log('resultMsg:', resultMsg);
                console.log('otptype:', otptype);

                switch (result.status) {
                    case 200:
                        sendOtpConfirmed(otptype);
                        toggle();
                        break;
                    default:
                        if (count > 4) {
                            setCount(0);
                            setContent('');
                            const errMsg = "otp address not correct";
                            window.location.assign(`${applicationUrl}?err=${errMsg}`);
                            toggle();
                        }
                        setCount(count + 1);
                        console.log('verify otp address error', count);
                        break;
                }
            }
            catch (err) {
                console.error('error in Dual OTP', err);
                // setErrorMsg('Dual OTP error, please contact help desk.');
            }
            setLoading(false);

        }

    }

    return (
        <Modal isOpen={open} toggle={toggle} backdrop="static">
            <ModalHeader>
                Confirm {otptype === 'ae' || 'e' ? 'email address' : 'phone number'}
            </ModalHeader>
            <ModalBody>
                {
                    otptype === 'ae' || otptype === 'e' ?
                        <div className="input-group">
                            <input id="profile" name="profile" type="email" className="form-control inputField-customizable"
                                style={{ height: '40px' }}
                                placeholder={"user@email.com"}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                autoFocus
                                autoComplete='off'
                                disabled={isLoading}
                            />
                        </div> :
                        <PhoneInput
                            international
                            countryCallingCodeEditable={false}
                            defaultCountry="US"
                            placeholder="phone number"
                            value={content}
                            onChange={setContent}
                            autoComplete='off'
                            disabled={isLoading}
                        />
                }
                <div style={{ paddingLeft: '4px' }}>
                    <span className="errorMessage-customizable">
                        {5 - count} attemps left
                    </span>
                </div>
            </ModalBody>
            <ModalFooter style={{ textAlign: "center" }}>
                {isLoading &&
                    <Spinner color="primary" style={{ margin: '8px auto' }}>{''}</Spinner>
                }
                <Button
                    name='confirmotpaddr'
                    type='submit'
                    className='btn btn-primary submitButton-customizable'
                    style={{ width: '80px', margin: 'auto 10px', display: 'inline', height: '40px' }}
                    onClick={handleSubmit}
                    disabled={isLoading || content.length === 0}
                >
                    OK
                </Button>
                <Button
                    name='canceldialog'
                    type='submit'
                    className='btn btn-secondary submitButton-customizable-back'
                    style={{ width: '80px', margin: 'auto 10px', display: 'inline', height: '40px' }}
                    onClick={() => { setCount(0); setContent(''); toggle() }}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
            </ModalFooter>
        </Modal>
    );
}

export default OTPDialog;