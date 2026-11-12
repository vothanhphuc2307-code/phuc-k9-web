const { readTab } = require('./crawler-lib');
const res = readTab('1TxRHSty_UPaCb2uOdonhev2vx7Yp3TyyprdGVrqY7mw', 'LIVE I ĐỢT 2');
for (let i = 0; i < 8; i++) {
  console.log(`\nRow ${i}:`);
  console.log('  VALS: ', res.vals[i]);
  console.log('  LINKS:', res.links[i]);
}
