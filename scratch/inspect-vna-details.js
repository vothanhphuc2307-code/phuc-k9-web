const { execSync } = require('child_process');

const sheetId = '1TxRHSty_UPaCb2uOdonhev2vx7Yp3TyyprdGVrqY7mw';
const tabName = 'LIVE I ĐỢT 2';
try {
  // Read with values, not links, to see cell text!
  const raw = execSync(`gsheets readonly read ${sheetId} "'${tabName}'!A1:G20"`, { encoding: 'utf8' });
  console.log('VALUES:');
  console.log(raw);
} catch (e) {
  console.error(e.message);
}
