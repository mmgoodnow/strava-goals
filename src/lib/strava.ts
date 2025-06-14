/* eslint-disable @typescript-eslint/no-explicit-any */
import * as strava from 'strava-v3';

const stravaClient = new (strava as any).client(process.env.STRAVA_CLIENT_SECRET || '');

export const getAuthorizationUrl = () => {
  return (strava as any).oauth.getRequestAccessURL({
    client_id: process.env.STRAVA_CLIENT_ID || '',
    redirect_uri: process.env.STRAVA_REDIRECT_URI,
    scope: 'read,activity:read_all'
  });
};

export const exchangeToken = async (code: string) => {
  return (strava as any).oauth.getToken(code);
};

export const getAthleteStats = async (accessToken: string, athleteId: number) => {
  const client = new (strava as any).client(accessToken);
  return client.athletes.stats({ id: athleteId });
};

export const getActivities = async (accessToken: string, after?: number, before?: number) => {
  const client = new (strava as any).client(accessToken);
  return client.athlete.listActivities({ after, before, per_page: 200 });
};

export const getAthlete = async (accessToken: string) => {
  const client = new (strava as any).client(accessToken);
  return client.athlete.get();
};

export default stravaClient;
