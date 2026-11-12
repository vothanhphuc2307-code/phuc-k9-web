const { execSync } = require('child_process');
const fs = require('fs');

// We test parsing Vu Ngoc Anh
const testCrawler = require('./test-crawler.js');
// Let's run on Vu Ngoc Anh tab
const sheetId = '1TxRHSty_UPaCb2uOdonhev2vx7Yp3TyyprdGVrqY7mw';
const tabName = 'LIVE I ĐỢT 2';
try {
  const raw = execSync(`gsheets readonly read-links ${sheetId} "'${tabName}'!A1:G100"`, { encoding: 'utf8' });
  console.log('Sample raw lines:');
  console.log(raw.split('\n').slice(0, 15).join('\n'));
} catch (e) {
  console.error(e.message);
}
