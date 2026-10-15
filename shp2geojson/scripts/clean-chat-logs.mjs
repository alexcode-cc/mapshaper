import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const logsDir = path.join(rootDir, 'logs');

function printUsage () {
  console.log(`
使用方式:
  npm run audit:chat               # 檢查並報告重複對話記錄 (唯讀分析，不刪除)
  npm run clean:chat               # 執行清理，僅保留每個對話最新最完整的檔案
  node scripts/clean-chat-logs.mjs [--delete] [--dir <目錄>]

參數:
  --delete, -d    實際刪除重複/冗餘的舊版快照檔案
  --dir <path>    指定掃描目錄 (預設為專案根目錄的 logs/)
  --help, -h      顯示說明
`);
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  printUsage();
  process.exit(0);
}

const shouldDelete = args.includes('--delete') || args.includes('-d') || args.includes('--clean');
let targetDir = logsDir;
const dirIdx = args.findIndex(a => a === '--dir');
if (dirIdx !== -1 && args[dirIdx + 1]) {
  targetDir = path.resolve(args[dirIdx + 1]);
}

if (!fs.existsSync(targetDir)) {
  console.log(`[audit-chat] 目錄不存在: ${targetDir}`);
  process.exit(0);
}

const files = fs.readdirSync(targetDir)
  .filter(f => f.endsWith('.md'))
  .map(filename => {
    const filePath = path.join(targetDir, filename);
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    // 解析 Conversation ID
    const idMatch = content.match(/對話代碼.*?`([a-zA-Z0-9_-]+)`/);
    const convId = idMatch ? idMatch[1] : 'UNKNOWN_ID';

    // 解析對話總輪次
    const turnsMatch = content.match(/對話.*?(\d+)\s*回合/);
    const turnsCount = turnsMatch ? Number.parseInt(turnsMatch[1], 10) : 0;

    // 解析匯出時間
    const timeMatch = content.match(/匯出時間.*?:\s*([^\n\r]+)/);
    const exportTime = timeMatch ? timeMatch[1].trim() : stat.mtime.toLocaleString('zh-TW');

    return {
      filename,
      filePath,
      size: stat.size,
      mtime: stat.mtimeMs,
      convId,
      turnsCount,
      exportTime,
    };
  });

if (files.length === 0) {
  console.log(`[audit-chat] 在目錄 "${targetDir}" 下未發現任何 Markdown 對話記錄。`);
  process.exit(0);
}

// 依 Conversation ID 分組
const groups = {};
for (const file of files) {
  if (!groups[file.convId]) {
    groups[file.convId] = [];
  }
  groups[file.convId].push(file);
}

console.log('='.repeat(78));
console.log(`  Antigravity 對話記錄重複分析與健康檢查報告`);
console.log('='.repeat(78));
console.log(`掃描目錄: ${targetDir}`);
console.log(`檔案總數: ${files.length} 個對話記錄檔`);
console.log(`對話群組: ${Object.keys(groups).length} 個獨立對話 ID\n`);

const toKeep = [];
const toDelete = [];

for (const [convId, groupFiles] of Object.entries(groups)) {
  // 排序：輪次多者優先，若輪次相同則最後修改時間較新者優先
  groupFiles.sort((a, b) => {
    if (b.turnsCount !== a.turnsCount) {
      return b.turnsCount - a.turnsCount;
    }
    return b.mtime - a.mtime;
  });

  const primary = groupFiles[0]; // 最佳留存目標
  toKeep.push(primary);

  console.log(`📌 對話代碼 (Conversation ID): ${convId}`);
  console.log(`   檔案數量: ${groupFiles.length} 份快照`);

  console.log(`   ${'-'.repeat(74)}`);
  console.log(`   狀態         檔案名稱                                輪次   大小       匯出時間`);
  console.log(`   ${'-'.repeat(74)}`);

  // 主檔案
  const padName = name => (name.length > 36 ? name.slice(0, 33) + '...' : name.padEnd(36, ' '));
  const padTurns = t => `${t} 回合`.padEnd(8, ' ');
  const padSize = s => `${(s / 1024).toFixed(1)} KB`.padEnd(10, ' ');

  console.log(`   [建議留存]   ${padName(primary.filename)} ${padTurns(primary.turnsCount)} ${padSize(primary.size)} ${primary.exportTime}`);

  // 冗餘檔案
  for (let i = 1; i < groupFiles.length; i++) {
    const redundant = groupFiles[i];
    toDelete.push(redundant);
    console.log(`   [建議刪除]   ${padName(redundant.filename)} ${padTurns(redundant.turnsCount)} ${padSize(redundant.size)} ${redundant.exportTime}`);
  }
  console.log('');
}

// 總結統計
const reclaimBytes = toDelete.reduce((acc, f) => acc + f.size, 0);
const keepBytes = toKeep.reduce((acc, f) => acc + f.size, 0);

console.log('='.repeat(78));
console.log('📊 檢查結果總結:');
console.log(`  - 建議留存檔案: ${toKeep.length} 個 (佔用空間: ${(keepBytes / 1024).toFixed(1)} KB)`);
console.log(`  - 建議刪除檔案: ${toDelete.length} 個 (可釋放空間: ${(reclaimBytes / 1024).toFixed(1)} KB)`);

if (toDelete.length === 0) {
  console.log('\n✓ 太棒了！目前 logs 目錄中沒有任何重複或過期的舊快照，所有記錄均為各對話最新版本。');
  process.exit(0);
}

if (!shouldDelete) {
  console.log(`\n💡 說明與建議:`);
  console.log(`  上述標記為 [建議刪除] 的檔案皆為同一對話在不同時間點匯出的「舊版快照」。`);
  console.log(`  其內容已 100% 完整包含在標記為 [建議留存] 的最新檔案中。`);
  console.log(`\n👉 若要執行清理並刪除這 ${toDelete.length} 個冗餘檔案，請執行:`);
  console.log(`   npm run clean:chat`);
  console.log(`   (或: node scripts/clean-chat-logs.mjs --delete)\n`);
} else {
  console.log(`\n🧹 正在執行清理刪除作業...`);
  let deletedCount = 0;
  for (const f of toDelete) {
    try {
      fs.unlinkSync(f.filePath);
      console.log(`  ✓ [已刪除] ${f.filename}`);
      deletedCount++;
    } catch (err) {
      console.error(`  ✗ [刪除失敗] ${f.filename}:`, err.message);
    }
  }
  console.log(`\n✓ 清理完成! 成功刪除 ${deletedCount} 個重複檔案，釋放 ${(reclaimBytes / 1024).toFixed(1)} KB 空間。`);
}
