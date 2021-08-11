const http = require('http');
const https = require('https');
const URL = require('url');

const name = 'fetch-github-release';


function getRequestOptions(urlString, token) {
  const url = URL.parse(urlString);
  const headers = {
    Accept: 'application/octet-stream',
    'User-Agent': name,
  };

  if (token) {
    headers.Authorization = `token ${token}`;
  }

  return Object.assign({}, url, { headers });
}

module.exports = function download(url, token, w, progress = () => {}) {
  return new Promise((resolve, reject) => {
    let protocol = /^https:/.exec(url) ? https : http;
    const options = getRequestOptions(url, token);

    progress(0);

    protocol
      .get(options, (res1) => {
        protocol = /^https:/.exec(res1.headers.location) ? https : http;

        protocol
          .get(res1.headers.location, (res2) => {
            const total = parseInt(res2.headers['content-length'], 10);
            let completed = 0;
            res2.pipe(w);
            res2.on('data', (data) => {
              completed += data.length;
              progress(completed / total);
            });
            res2.on('progress', progress);
            res2.on('error', reject);
            res2.on('end', resolve);
          })
          .on('error', reject);
      })
      .on('error', reject);
  });
}
