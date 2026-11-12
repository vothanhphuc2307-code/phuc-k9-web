const { execSync } = require('child_process');

const testIds = [
  { name: 'Nguyễn Phan Tiến', id: '1tKrgJeyYiuT9ZRJjX4-_aiQLIP7dvjeDtb2vu_6mFNo' },
  { name: 'Anh Giáo Kid', id: '1ekTovixSa12ppJWeXqtL6hbyRe3e9dWJtYXDSq8zFGM' },
  { name: 'Vũ Tuấn Anh', id: '1QXRVaP6-oXJAlCAFafvHhMsjnF-X5xDFttI-LQU2iGQ' },
  { name: 'Cô Sương Mai', id: '1wKK6tX2pZlBKxi83GkRPtz8EnfQkq18R7IznW_M2db4' }
];

testIds.forEach(t => {
  console.log(`\n=== ${t.name} (${t.id}) ===`);
  try {
    const out = execSync(`gsheets readonly read-links ${t.id} "'HOME'!A1:G20"`, { encoding: 'utf8', timeout: 15000 });
    console.log(out.slice(0, 1000));
  } catch (e) {
    console.log('Error:', e.message.slice(0, 120));
  }
});
