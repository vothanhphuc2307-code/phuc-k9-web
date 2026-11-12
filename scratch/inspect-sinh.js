const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/Users/Admin/.gemini/antigravity/brain/97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7/scratch/2k9-tang-khoahocmoi-checked.json', 'utf8'));
const sinh = data.filter(d => d.subject && d.subject.includes('Sinh'));
console.log('Sinh entries:', sinh.length);
sinh.forEach(s => {
  console.log('- ' + s.name + ': links: ' + JSON.stringify(s.links));
  console.log('  checked: ' + JSON.stringify(s.checked));
});
