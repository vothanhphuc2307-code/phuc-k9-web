const { readTab, parseTabToChapters } = require('./crawler-lib');
const d = readTab('1JlnkaUii3qcvHwHDqU_12PTAjutUgrTrCSW0YEmsyGc', 'LIVE C');
console.log('LIVE C rows:', d.vals.length);
for (let i = 0; i < Math.min(d.vals.length, 10); i++) {
  console.log('Row ' + i + ' VALS : ' + JSON.stringify(d.vals[i]));
  console.log('Row ' + i + ' LINKS: ' + JSON.stringify(d.links[i]));
}
