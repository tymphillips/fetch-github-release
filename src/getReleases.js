import got from 'got';
import { name } from '../package.json';

export default async function getReleases(user, token, repo) {
  const url = `https://api.github.com/repos/${user}/${repo}/releases`;

  const requestConfig = {
    headers: {
      'User-Agent': name
    },
    responseType: 'json'
  };

  if (token) {
    requestConfig.headers.Authorization = `token ${token}`;
  }

  const r = await got.get(url, requestConfig);
  return r.body;
}
