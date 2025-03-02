import { Sidebar, Layout } from 'react-admin';

import { AmfaAppBar } from './AmfaAppBar';

const MySidebar = (props) => (
    <Sidebar
        sx={{
            "& .RaSidebar-drawerPaper": {
                backgroundColor: "red",
				display: "none"
            },
        }}
        {...props}
    />
);

export const AmfaLayout = (props) => <Layout {...props} sidebar={MySidebar} appBar={AmfaAppBar} / >