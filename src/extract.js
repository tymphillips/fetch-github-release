const extractZip = require('extract-zip');

module.exports =  function extract(source, dir) {
  return new Promise((resolve, reject) => {
    extractZip(source, { dir }, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}