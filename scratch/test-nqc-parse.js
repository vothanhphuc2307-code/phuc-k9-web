const { readTab, parseTabToChapters } = require('./crawler-lib');
const d = readTab('1eZ4u9_s2MF5TfxXG8o368CDl0u1IwS8hCrO1hiRw270', 'KHÓA_KIẾN_THỨC_NỀN_TẢNG_LỚP_12_-_2009');
const chs = parseTabToChapters(d);
console.log('Chapters:', chs.length);
if (chs.length > 0) {
  console.log('Ch 1 title:', chs[0].title);
  console.log('Ch 1 topics count:', chs[0].topics.length);
  if (chs[0].topics.length > 0) {
    console.log('Topic 0:', JSON.stringify(chs[0].topics[0], null, 2));
  }
}
if (chs.length > 1) {
  console.log('Ch 2 title:', chs[1].title);
  console.log('Ch 2 topics count:', chs[1].topics.length);
  if (chs[1].topics.length > 0) {
    console.log('Topic 0 in Ch 2:', JSON.stringify(chs[1].topics[0], null, 2));
  }
}
