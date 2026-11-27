import fs from 'fs';
import path from 'path';

const filePath = path.resolve('client/src/pages/DocumentPreviewPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace route /vault/members/ with /family/
content = content.replace(
  /onClick=\{\(\) => navigate\(`\/vault\/members\/\$\{doc\.assignedMember\._id\}`\)\}/g,
  `onClick={() => {
    const mId = (doc.assignedMember?._id || doc.assignedMemberId?._id || doc.assignedMemberId || doc.memberId)?.toString();
    if (mId) navigate(\`/family/\${mId}\`);
    else navigate('/family');
  }}`
);

// 2. Also make header member pill clickable
content = content.replace(
  /<span className="inline-flex items-center gap-1\.5 px-2\.5 py-1 rounded-xl bg-slate-100 dark:bg-\[#202020\] text-slate-700 dark:text-neutral-200 text-xs font-semibold">\s*<User size=\{13\} className="text-\[#10B981\] dark:text-\[#3ECF8E\]" \/>\s*<span>\{doc\.assignedMember\?\.name \|\| 'Whole Family'\}<\/span>\s*<\/span>/,
  `<button
    type="button"
    onClick={() => {
      const mId = (doc.assignedMember?._id || doc.assignedMemberId?._id || doc.assignedMemberId || doc.memberId)?.toString();
      if (mId) navigate(\`/family/\${mId}\`);
      else navigate('/family');
    }}
    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#182030] dark:hover:bg-[#202a40] text-slate-700 dark:text-neutral-200 text-xs font-semibold transition-all cursor-pointer border border-slate-200/80 dark:border-[#1E293B]"
    title="View Member Profile in Family Vault"
  >
    <User size={13} className="text-[#10B981] dark:text-[#3ECF8E]" />
    <span>{doc.assignedMember?.name || 'Whole Family'}</span>
    <ExternalLink size={10} className="text-slate-400 ml-0.5" />
  </button>`
);

// 3. Theme consistency replacements:
// Replace dark background and border hexes to match LandingPage & DocumentUploadPage
content = content.replaceAll('dark:bg-[#1C1C1C]', 'dark:bg-[#121622]');
content = content.replaceAll('dark:bg-[#18181B]', 'dark:bg-[#121622]');
content = content.replaceAll('dark:bg-[#141414]', 'dark:bg-[#182030]');
content = content.replaceAll('dark:bg-[#121212]', 'dark:bg-[#090A0F]');
content = content.replaceAll('dark:bg-[#202020]', 'dark:bg-[#182030]');

content = content.replaceAll('dark:border-[#262626]', 'dark:border-[#1E293B]');
content = content.replaceAll('dark:border-[#27272A]', 'dark:border-[#1E293B]');
content = content.replaceAll('dark:border-[#2E2E2E]', 'dark:border-[#1E293B]');
content = content.replaceAll('dark:border-[#333]', 'dark:border-[#1E293B]');

// 4. Wrap root return with ambient dot background
const oldReturn = `  return (
    <div
      className={\`max-w-[1600px] mx-auto p-2.5 sm:p-4 lg:p-4 transition-all \${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-[#090A0F] overflow-y-auto max-w-none p-3 sm:p-6'
          : 'pb-28 lg:pb-2 lg:h-[calc(100vh-4.25rem)] lg:max-h-[calc(100vh-4.25rem)] lg:overflow-hidden flex flex-col space-y-2 sm:space-y-2.5'
      }\`}
    >`;

const newReturn = `  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#F8FAFC] dark:bg-[#090A0F] text-slate-900 dark:text-[#F8FAFC] transition-colors">
      {/* Background Texture & Ambient Top Glow matching Landing & Upload page */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.06] text-slate-900 dark:text-white"
        aria-hidden="true"
      />
      <div
        className={\`relative z-10 max-w-[1600px] mx-auto p-2.5 sm:p-4 lg:p-4 transition-all \${
          isFullscreen
            ? 'fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-[#090A0F] overflow-y-auto max-w-none p-3 sm:p-6'
            : 'pb-28 lg:pb-2 lg:h-[calc(100vh-4.25rem)] lg:max-h-[calc(100vh-4.25rem)] lg:overflow-hidden flex flex-col space-y-2 sm:space-y-2.5'
        }\`}
      >`;

if (content.includes(oldReturn)) {
  content = content.replace(oldReturn, newReturn);
  // Add closing div before the end of the return
  content = content.replace(/<\/div>\s*\);\s*}\s*$/, '</div>\n    </div>\n  );\n}\n');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('DocumentPreviewPage.jsx successfully updated with Landing Page theme & Member Profile route!');
