import { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

function PwnedPWDModal(args) {
	const [modal, setModal] = useState(false);

	const toggle = () => setModal(!modal);

	return (
		<>
			<span className='textDescription-customizable'>
				<div className="link-customizable" onClick={() => toggle()}>
					about
				</div>
			</span>

			<Modal isOpen={modal} toggle={toggle} {...args}>
				<ModalHeader toggle={toggle}>Copyright 2025 - aPersona, Inc.</ModalHeader>
				<ModalBody>

					Copyright 2025 - aPersona, Inc.<br />
					Licensed by aPersona, Inc.<br />
					Refer to your signed aPersona Subscription Agreement.
					aPersona Terms and Conditioins & Privacy Policy<br /><br />

					AWS Terms and Conditions & Privacy Policy<br /><br />

					Password breach checking is provided by Have I Been Pwned:
					<a href='https://haveibeenpwned.com'>https://haveibeenpwned.com</a><br />
					License: <a href='https://creativecommons.org/licenses/by/4.0/'>https://creativecommons.org/licenses/by/4.0/</a><br />

				</ModalBody>
				<ModalFooter style={{textAlign: "center"}}>
					<Button variant="secondary" onClick={toggle}>
						OK
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}

export default PwnedPWDModal;