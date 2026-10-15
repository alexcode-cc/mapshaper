import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 取得 Antigravity IDE 資料目錄
const userHome = os.homedir();
const brainDir = path.join(userHome, '.gemini', 'antigravity-ide', 'brain');

function printUsage () {
  console.log(`
使用方式:
  npm run export:chat                  # 自動匯出最新/當前對話 (或 pnpm export:chat)
  npm run export:chat -- <對話ID>      # 匯出指定對話
  npm run export:chat -- --list        # 列出最近 10 筆對話歷程
  node scripts/export-conversation.mjs [對話ID] [輸出路徑]

範例:
  npm run export:chat
  npm run export:chat -- --out logs/chat_backup.md
`);
}

// 搜尋所有對話並依最後修改時間排序
function getConversations () {
  if (!fs.existsSync(brainDir)) return [];
  const entries = fs.readdirSync(brainDir, { withFileTypes: true });
  const list = [];
  for (const ent of entries) {
    if (!ent.isDirectory() || ent.name.startsWith('.')) continue;
    const logPath = path.join(brainDir, ent.name, '.system_generated', 'logs', 'transcript_full.jsonl');
    if (fs.existsSync(logPath)) {
      try {
        const stat = fs.statSync(logPath);
        list.push({
          id: ent.name,
          logPath,
          size: stat.size,
          mtime: stat.mtimeMs,
          date: stat.mtime.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
        });
      } catch {
        // 略過無法取得狀態之目錄
      }
    }
  }
  return list.sort((a, b) => b.mtime - a.mtime);
}

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printUsage();
  process.exit(0);
}

const conversations = getConversations();

if (args.includes('--list')) {
  console.log(`\n找到 ${conversations.length} 筆對話記錄 (依最新時間排序):`);
  conversations.slice(0, 10).forEach((c, idx) => {
    console.log(`  ${idx + 1}. [${c.date}] ${c.id} (${(c.size / 1024).toFixed(1)} KB)`);
  });
  console.log('\n使用 `npm run export:chat -- <對話ID>` 可匯出特定對話。');
  process.exit(0);
}

// 解析目標 Conversation ID 與輸出檔案
let targetId = null;
let customOutPath = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out' || args[i] === '-o') {
    customOutPath = args[i + 1];
    i++;
  } else if (!targetId) {
    targetId = args[i];
  }
}

let selected = null;
if (targetId) {
  selected = conversations.find(c => c.id.toLowerCase().startsWith(targetId.toLowerCase()));
  if (!selected) {
    // 檢查是否為直接路徑
    if (fs.existsSync(targetId)) {
      selected = { id: path.basename(path.dirname(targetId)), logPath: targetId, size: fs.statSync(targetId).size };
    } else {
      console.error(`[export-chat] 找不到符合的對話 ID: "${targetId}"`);
      process.exit(1);
    }
  }
} else {
  if (conversations.length === 0) {
    console.error('[export-chat] 找不到任何對話記錄。');
    process.exit(1);
  }
  selected = conversations[0]; // 預設使用最新的對話
}

console.log(`[export-chat] 目標對話 ID: ${selected.id}`);
console.log(`[export-chat] 來源記錄檔: ${selected.logPath} (${(selected.size / 1024).toFixed(1)} KB)`);

// 讀取並解析 JSONL
const rawContent = fs.readFileSync(selected.logPath, 'utf8').replace(/^\uFEFF/, '');
const lines = rawContent.trim().split('\n');

const turns = [];
let currentTurn = null;

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const step = JSON.parse(line);
    if (step.type === 'USER_INPUT') {
      if (currentTurn) {
        turns.push(currentTurn);
      }
      const content = step.content || '';
      // 提取使用者核心提問，過濾 XML 標籤與 metadata
      const userReqMatch = content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
      const userText = userReqMatch ? userReqMatch[1].trim() : content.trim();

      currentTurn = {
        index: turns.length + 1,
        user: userText,
        time: step.created_at || step.timestamp || '',
        assistantText: [],
        toolSummary: [],
      };
    } else if (currentTurn) {
      if (step.type === 'PLANNER_RESPONSE') {
        const text = (step.content || '').trim();
        if (text && !currentTurn.assistantText.includes(text)) {
          currentTurn.assistantText.push(text);
        }
      } else if (step.type === 'RUN_COMMAND' && step.command) {
        currentTurn.toolSummary.push(`- 執行指令: \`${step.command}\``);
      } else if (step.type === 'CODE_ACTION' && step.file) {
        currentTurn.toolSummary.push(`- 編輯檔案: \`${step.file}\``);
      } else if (step.type === 'WRITE_TO_FILE' && step.file) {
        currentTurn.toolSummary.push(`- 建立/覆寫檔案: \`${step.file}\``);
      } else if (step.type === 'VIEW_FILE' && step.file) {
        currentTurn.toolSummary.push(`- 檢視檔案: \`${path.basename(step.file)}\``);
      }
    }
  } catch {
    // 忽略個別行解析錯誤
  }
}
if (currentTurn) {
  turns.push(currentTurn);
}

// 產出 Markdown
const exportDate = new Date();
const pad = n => String(n).padStart(2, '0');
const dateStamp = `${exportDate.getFullYear()}${pad(exportDate.getMonth() + 1)}${pad(exportDate.getDate())}_${pad(exportDate.getHours())}${pad(exportDate.getMinutes())}${pad(exportDate.getSeconds())}`;

let md = `# Antigravity 對話記錄匯出\n\n`;
md += `> **對話代碼 (Conversation ID)**: \`${selected.id}\`  \n`;
md += `> **匯出時間**: ${exportDate.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}  \n`;
md += `> **對話總輪次**: ${turns.length} 回合  \n`;
md += `> **原始記錄大小**: ${(selected.size / 1024).toFixed(1)} KB  \n\n`;
md += `---\n\n`;

for (const t of turns) {
  md += `## 回合 ${t.index}：使用者提問\n\n`;
  if (t.time) md += `*時間: ${t.time}*\n\n`;
  md += `\`\`\`text\n${t.user}\n\`\`\`\n\n`;

  md += `### 助手回覆與執行結果\n\n`;
  if (t.assistantText.length > 0) {
    md += t.assistantText.join('\n\n') + '\n\n';
  } else {
    md += `*(本回合執行中主要為代碼分析、工具呼叫或多步驟處理)*\n\n`;
  }

  if (t.toolSummary.length > 0) {
    md += `<details><summary>點擊展開本回合執行操作摘要 (${t.toolSummary.length} 項)</summary>\n\n`;
    md += t.toolSummary.slice(0, 20).join('\n') + '\n';
    if (t.toolSummary.length > 20) {
      md += `\n*...等共 ${t.toolSummary.length} 項操作*\n`;
    }
    md += `\n</details>\n\n`;
  }

  md += `---\n\n`;
}

// 決定儲存路徑
let finalOutPath = '';
if (customOutPath) {
  finalOutPath = path.resolve(customOutPath);
} else {
  const logsDir = path.join(rootDir, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  finalOutPath = path.join(logsDir, `對話記錄匯出_${dateStamp}.md`);
}

fs.writeFileSync(finalOutPath, md, 'utf8');

console.log(`\n✓ [匯出成功] 對話記錄已儲存至:`);
console.log(`  -> ${path.relative(rootDir, finalOutPath).replace(/\\/g, '/') || finalOutPath}`);
console.log(`  總計匯出 ${turns.length} 個對話回合。`);
