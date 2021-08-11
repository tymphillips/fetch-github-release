const request = require('superagent');
const name = 'fetch-github-release';

module.exports = function getReleases(user, token, repo) {
  const url = `https://api.github.com/repos/${user}/${repo}/releases`;

  return new Promise((resolve, reject) => {
    const r = request.get(url);
    r.set('User-Agent', name);
    if (token) {
      r.set('Authorization', `token ${token}`);
    }
    r.end((err, res) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(res.body);
    });
  });
}
