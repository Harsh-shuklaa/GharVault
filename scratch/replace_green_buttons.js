import fs from 'fs';
import path from 'path';

// 1. Update DocumentUploadPage.jsx
const uploadPagePath = path.resolve('client/src/pages/DocumentUploadPage.jsx');
let uploadContent = fs.readFileSync(uploadPagePath, 'utf8');

uploadContent = uploadContent.replace(
  /bg-\[#10B981\] hover:bg-emerald-600 dark:bg-\[#3ECF8E\] dark:hover:bg-\[#34B27B\] text-white dark:text-\[#121212\] text-xs font-bold flex items-center justify-center gap-1\.5 shadow-md shadow-\[#10B981\]\/25/g,
  'bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/25'
);

fs.writeFileSync(uploadPagePath, uploadContent, 'utf8');
console.log('DocumentUploadPage.jsx updated: Green button changed to sky-500!');

// 2. Update DocumentPreviewPage.jsx
const previewPagePath = path.resolve('client/src/pages/DocumentPreviewPage.jsx');
let previewContent = fs.readFileSync(previewPagePath, 'utf8');

// Replace primary button classes
// Primary green button -> sky-500
previewContent = previewContent.replaceAll(
  'bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212]',
  'bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/25'
);
previewContent = previewContent.replaceAll(
  'bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 text-white dark:text-[#121212]',
  'bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/25'
);
previewContent = previewContent.replaceAll(
  'bg-[#10B981] hover:bg-[#059669] text-white',
  'bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/25'
);

// Toggle button active state
previewContent = previewContent.replaceAll(
  'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212]',
  'bg-sky-500 text-white'
);

previewContent = previewContent.replaceAll(
  'bg-[#10B981] dark:bg-[#3ECF8E] text-white',
  'bg-sky-500 text-white'
);

previewContent = previewContent.replaceAll(
  'bg-[#10B981] dark:bg-[#3ECF8E]',
  'bg-sky-500'
);

previewContent = previewContent.replaceAll(
  'shadow-[#3ECF8E]/25',
  'shadow-sky-500/25'
);
previewContent = previewContent.replaceAll(
  'shadow-[#3ECF8E]/20',
  'shadow-sky-500/20'
);
previewContent = previewContent.replaceAll(
  'shadow-[#10B981]/25',
  'shadow-sky-500/25'
);
previewContent = previewContent.replaceAll(
  'shadow-[#10B981]/20',
  'shadow-sky-500/20'
);

// Switch thumb/track
previewContent = previewContent.replaceAll(
  "focus:border-[#10B981] dark:focus:border-[#3ECF8E]",
  "focus:border-sky-500 dark:focus:border-sky-400"
);

// Checkboxes and focus rings
previewContent = previewContent.replaceAll(
  "text-[#10B981] dark:text-[#3ECF8E] border-slate-300 focus:ring-[#3ECF8E]",
  "text-sky-500 border-slate-300 focus:ring-sky-500"
);

// Replace icon and text colors
previewContent = previewContent.replaceAll('text-[#10B981] dark:text-[#3ECF8E]', 'text-sky-500 dark:text-sky-400');
previewContent = previewContent.replaceAll('text-[#3ECF8E]', 'text-sky-400');
previewContent = previewContent.replaceAll('text-[#10B981]', 'text-sky-500');

// Pills & Badges: emerald -> sky
previewContent = previewContent.replaceAll('bg-emerald-50 dark:bg-[#3ECF8E]/10', 'bg-sky-50 dark:bg-sky-500/10');
previewContent = previewContent.replaceAll('border-emerald-200 dark:border-[#3ECF8E]/30', 'border-sky-200 dark:border-sky-500/30');
previewContent = previewContent.replaceAll('border-emerald-200 dark:border-[#3ECF8E]/20', 'border-sky-200 dark:border-sky-500/20');
previewContent = previewContent.replaceAll('text-emerald-800 dark:text-[#3ECF8E]', 'text-sky-800 dark:text-sky-300');
previewContent = previewContent.replaceAll('text-emerald-700 dark:text-[#3ECF8E]', 'text-sky-700 dark:text-sky-400');
previewContent = previewContent.replaceAll('bg-emerald-100 dark:bg-[#3ECF8E]/20', 'bg-sky-100 dark:bg-sky-500/20');
previewContent = previewContent.replaceAll('text-emerald-800 dark:text-[#3ECF8E]', 'text-sky-800 dark:text-sky-300');
previewContent = previewContent.replaceAll('text-emerald-900 dark:text-[#3ECF8E]', 'text-sky-900 dark:text-sky-300');
previewContent = previewContent.replaceAll('bg-emerald-50/80 dark:bg-[#3ECF8E]/15', 'bg-sky-50/80 dark:bg-sky-500/15');
previewContent = previewContent.replaceAll('bg-emerald-50/80 dark:bg-[#3ECF8E]/10', 'bg-sky-50/80 dark:bg-sky-500/10');
previewContent = previewContent.replaceAll('text-emerald-950 dark:text-white', 'text-sky-950 dark:text-white');
previewContent = previewContent.replaceAll('bg-emerald-500 animate-pulse', 'bg-sky-500 animate-pulse');

// Also update sticky bottom WhatsApp button to not be overwhelming green, but match theme with emerald icon
previewContent = previewContent.replaceAll(
  'bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-800 dark:text-[#3ECF8E] font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-500/30',
  'bg-slate-100 dark:bg-[#182030] hover:bg-slate-200 dark:hover:bg-[#202a40] text-slate-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-[#1E293B]'
);

fs.writeFileSync(previewPagePath, previewContent, 'utf8');
console.log('DocumentPreviewPage.jsx successfully updated: Green buttons transformed to theme sky-500/sky-400!');
