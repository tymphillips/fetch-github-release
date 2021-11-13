const os = require('os');
const fs = require('fs');
const path = require('path');
const MultiProgress = require('multi-progress');
const getReleases = require('./getReleases');
const getLatest = require('./getLatest');
const download = require('./download');
const extract = require('./extract');
const rpad = require('./rpad');

function pass() {
  return true;
}

async function downloadRelease(
  user,
  repo,
  token,
  outputdir,
  filterRelease = pass,
  filterAsset = pass,
  leaveZipped = false,
  disableLogging = false,
) {
  const bars = new MultiProgress(process.stderr);

  return getReleases(user, token, repo)
    .then(releases => getLatest(releases, filterRelease, filterAsset))
    .then((release) => {
      if (!release) {
        throw new Error(
          `could not find a release for ${user}/${repo} (${os.platform()} ${os.arch()})`
        );
      }

      if (!disableLogging) {
        console.log(`Downloading ${user}/${repo}@${release.tag_name}...`);
      }

      const promises = release.assets.map((asset) => {
        let progress;

        if (process.stdout.isTTY && !disableLogging) {
          const bar = bars.newBar(`${rpad(asset.name, 24)} :bar :etas`, {
            complete: '▇',
            incomplete: '-',
            width: process.stdout.columns - 36,
            total: 100
          });
          progress = bar.update.bind(bar);
        }

        const destf = path.join(outputdir, asset.name);
        if (!fs.existsSync(destf)) {
          const dest = fs.createWriteStream(destf);

          return download(asset.url, token, dest, progress)
            .then(() => {
              if (!leaveZipped && /\.zip$/.exec(destf)) {
                return extract(destf, outputdir).then(() => fs.unlinkSync(destf));
              }
              return destf;
            });
        }
        return destf;
      });

      return Promise.all(promises);
    });
}

module.exports = downloadRelease;