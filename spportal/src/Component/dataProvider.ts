// in src/dataProvider.ts
import { DataProvider, Options, fetchUtils } from "react-admin";
import { stringify } from "query-string";
import { apiUrl } from "../aws-export";


// const httpClient = fetchUtils.fetchJson;
const httpClient = async (url: any, options: Options = {}) => {
    let myoptions = options;

    myoptions.user = {
        authenticated: true,
        token: `${localStorage.getItem('token')}`
    };

    // console.log('fetchJson options', myoptions)
    if (myoptions.user.token && myoptions.user.token !== 'null') {

        const { status, headers, body, json } = await fetchUtils.fetchJson(url, myoptions);
        // console.log('fetchJson result', { status, headers, body, json });
        return { status, headers, body, json };
    } else {
        // return Promise.resolve({ data: [], pageInfo: { hasNextPage: false, hasPreviousPage: false } });
        // console.log('token', myoptions.user.token, ' fetchJson result', { status: 401, headers: {}, body: {}, json: {} });
        return { status: 401, headers: {}, body: {}, json: {} };
    }
}

export const dataProvider: DataProvider = {
    getList: (resource, params) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        const query = {
            sort: JSON.stringify([field, order]),
            range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
            filter: JSON.stringify(params.filter),
        };
        const url = `${apiUrl}/${resource}?${stringify(query)}`;
        const token = localStorage.getItem('token');

        if (!token || !token.length || token ==='null' ) {
            return Promise.reject(new Error('No token'));
        }
        return httpClient(url).then(({ json }) => ({
            data: json.data,
            total: json.data.lengh,
        }));
    },

    getOne: (resource, params) =>
        httpClient(`${apiUrl}/${resource}/${params.id}`).then(({ json }) => ({
            data: json.data,
        })),

    getMany: (resource, params) => {
        const query = {
            filter: JSON.stringify({ id: params.ids }),
        };
        const url = `${apiUrl}/${resource}?${stringify(query)}`;
        return httpClient(url).then(({ json }) => ({ data: json }));
    },

    getManyReference: (resource, params) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        const query = {
            sort: JSON.stringify([field, order]),
            range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
            filter: JSON.stringify({
                ...params.filter,
                [params.target]: params.id,
            }),
        };
        const url = `${apiUrl}/${resource}?${stringify(query)}`;

        return httpClient(url).then(({ json }) => ({
            data: json.data,
            total: json.data.length,
        }));
    },

    update: (resource, params) =>
        httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'PUT',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json })),

    updateMany: (resource, params) => {
        const query = {
            filter: JSON.stringify({ id: params.ids }),
        };
        return httpClient(`${apiUrl}/${resource}?${stringify(query)}`, {
            method: 'PUT',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json }));
    },

    create: (resource, params) =>
        httpClient(`${apiUrl}/${resource}`, {
            method: 'POST',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({
            data: { ...params.data, id: json.id } as any,
        })),

    delete: (resource, params) =>
        httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'DELETE',
        }).then(({ json }) => ({ data: json })),

    deleteMany: (resource, params) => {
        const query = {
            filter: JSON.stringify({ id: params.ids }),
        };
        return httpClient(`${apiUrl}/${resource}?${stringify(query)}`, {
            method: 'DELETE',
        }).then(({ json }) => ({ data: json }));
    }
};
