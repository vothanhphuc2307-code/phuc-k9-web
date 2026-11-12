const { execSync } = require('child_process');
const sheetId = '139ewewSIBllZW9AZTm0jxj9B4RF0nQwPBD3mbjZQIjA';
const range = "'KHÓA T1 + T2'!A1:H40";
const cmd = `gsheets readonly read-links ${sheetId} "${range}"`;
try {
  const out = execSync(cmd, { encoding: 'utf8' });
  console.log(out);
} catch (e) {
  console.error(e.message);
}
