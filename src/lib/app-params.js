import { getAccessToken } from '@base44/sdk';

const isNode = typeof window === 'undefined';
const env = /** @type {{ env: Record<string, string | undefined> }} */ (/** @type {unknown} */ (import.meta)).env;

const isClearAccessTokenRequested = () =>
	!isNode && new URLSearchParams(window.location.search).get("clear_access_token") === 'true';

const clearStoredAccessToken = () => {
	window.localStorage.removeItem('base44_access_token');
	window.localStorage.removeItem('token');
}

const getAppParams = () => {
	if (isClearAccessTokenRequested()) {
		clearStoredAccessToken();
	}
	return {
		appId: env.VITE_BASE44_APP_ID,
		token: getAccessToken(),
		functionsVersion: (!isNode && new URLSearchParams(window.location.search).get("functions_version")?.trim()) || env.VITE_BASE44_FUNCTIONS_VERSION,
		appBaseUrl: env.VITE_BASE44_APP_BASE_URL,
	}
}


export const appParams = {
	...getAppParams()
}
