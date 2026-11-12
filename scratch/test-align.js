const { execSync } = require('child_process');

const sheetId = '1TxRHSty_UPaCb2uOdonhev2vx7Yp3TyyprdGVrqY7mw';
const tabName = 'LIVE I ĐỢT 2';

const rawVals = execSync(`gsheets readonly read ${sheetId} "'${tabName}'!A1:G20"`, { encoding: 'utf8' });
const rawLinks = execSync(`gsheets readonly read-links ${sheetId} "'${tabName}'!A1:G20"`, { encoding: 'utf8' });

const linesVals = rawVals.split('\n').map(l => l.split('\t').map(c => c.trim()));
const linesLinks = rawLinks.split('\n').map(l => l.split('\t').map(c => c.trim()));

console.log('Lines count vals:', linesVals.length, 'links:', linesLinks.length);

for (let i = 0; i < Math.min(linesVals.length, linesLinks.length); i++) {
  const vRow = linesVals[i];
  const lRow = linesLinks[i];
  console.log(`\nRow ${i + 1}:`);
  console.log('  VALS: ', JSON.stringify(vRow.filter(Boolean)));
  console.log('  LINKS:', JSON.stringify(lRow.filter(c => c && c.startsWith('http'))));
}
