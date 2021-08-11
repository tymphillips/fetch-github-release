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
  _outputDir,
  filterRelease = pass,
  filterAsset = pass,
  leaveZipped = false,
  disableLogging = false,
) {
  const bars = new MultiProgress(process.stderr);

  const releases = await getReleases(user, token, repo);
  const release = getLatest(releases, filterRelease, filterAsset);
  if (!release) {
    throw new Error(
      `Could not find a release for ${user}/${repo} (${os.platform()} ${os.arch()})`
    );
  }
  if (!disableLogging) {
    console.error(`Downloading ${user}/${repo}@${release.tag_name}...`);
  }
  const promises = release.assets.map(async (asset) => {
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

    const outputDir = path.isAbsolute(_outputDir) ? _outputDir : path.resolve(_outputDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    if (!fs.statSync(outputDir).isDirectory()) {
      throw new Error(`Output path "${outputDir}" must be a directory`);
    }

    const destf = path.join(outputDir, asset.name);
    if (!fs.existsSync(destf)) {
      const dest = fs.createWriteStream(destf);

      await download(asset.url, token, dest, progress);
      if (!leaveZipped && /\.zip$/.exec(destf)) {
        await extract(destf, {
          dir: outputDir
        });
        fs.unlinkSync(destf);
      }
    }
    return destf;
  });
  return Promise.all(promises);
}

module.exports = downloadRelease;