/* PHÚC K9 source routing compatibility shim. Filtering, bookmarks and Sheets preview are owned by ecosystem-v2. */
(function(){
 'use strict';
 const aliases=new Set(['exam','review-hub','special-exams']);
 const base=window.switchTab;
 if(typeof base==='function'&&!base.__pk9SourceHub){function wrapped(tab,...args){const route=aliases.has(tab)?'exam-bank':tab;const result=base.call(this,route,...args);if(route==='exam-bank')requestAnimationFrame(()=>window.pk9RenderSourceBank?.());return result}wrapped.__pk9SourceHub=true;window.switchTab=wrapped}
 window.renderExamBank=()=>window.pk9RenderSourceBank?.();
 window.initExamBank=window.renderExamBank;
 window.startExamBank=function(){window.switchTab?.('exam-bank');window.phucToast?.('Kho đề mở tài liệu gốc; phần chấm tự động chỉ bật với đề đã được biên soạn và cấp phép riêng.')};
 window.startExam=window.startExamBank;window.loadExamCategory=window.startExamBank;window.startExamCategoryDirect=window.startExamBank;
})();
