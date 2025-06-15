import { cookies } from 'next/headers';

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('strava_access_token');
    return !!accessToken?.value;
  } catch {
    return false;
  }
}