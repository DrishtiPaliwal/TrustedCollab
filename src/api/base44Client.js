import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

if (appId === undefined) {
  throw new Error('Base44 appId is required');
}

export const base44 = createClient({
  appId,
  token: token ?? undefined,
  functionsVersion,
  serverUrl: '',
  appBaseUrl
});
