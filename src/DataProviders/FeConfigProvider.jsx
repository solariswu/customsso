import React, { useContext, useEffect, useState } from 'react';
import { apiUrl } from '/const.js';


const Context = React.createContext();

const FeConfigProvider = ({ children }) => {
	const [feconfigs, setFeconfigs] = useState();

	useEffect(() => {
		const fetchFeConfigs = async () => {

			let response = await fetch(`${apiUrl}/oauth2/feconfig`)
			let configData = await response.json();
			setFeconfigs(configData);
		}

		fetchFeConfigs();
	}, [])

	return (
		<Context.Provider value={feconfigs}>
			{children}
		</Context.Provider>
	)
}
export default FeConfigProvider;
export const useFeConfigs = () => useContext(Context);