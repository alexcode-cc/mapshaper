---
name: export-chat
description: >-
  匯出 Antigravity IDE 當前或歷史對話記錄為 Markdown 文件的工具與指引。
  當使用者要求「匯出對話」、「匯出對話記錄」、「備份對話」、「下載聊天紀錄」或想要取得目前的討論過程時啟用此技能。
---

# 對話記錄匯出技能 (Export Chat Skill)

本技能提供將 Antigravity IDE / 2.0 中的對話歷程（Transcript）完整轉換並匯出為結構化 Markdown 文件的標準流程。

## 1. 核心原理與資料來源

Antigravity 對話資料統一儲存於本地檔案系統中：
- **基礎目錄**: `%USERPROFILE%\.gemini\antigravity-ide\brain\`
- **對話記錄路徑**: `<brainDir>\<conversation-id>\.system_generated\logs\transcript_full.jsonl`
- **記錄格式**: JSON Lines (JSONL)，每行紀錄包含一個 step（例如 `USER_INPUT`, `PLANNER_RESPONSE`, `RUN_COMMAND`, `CODE_ACTION` 等）。

## 2. 匯出操作方式

### 方式 A：透過專案指令（最推薦）
在專案根目錄下直接執行：
```bash
# 預設儲存於 logs/ 目錄，且已被加入 .gitignore
npm run export:chat

# 列出最近 10 筆歷史對話
npm run export:chat -- --list

# 匯出指定歷史對話
npm run export:chat -- <對話ID>

# 自訂輸出檔案名稱
npm run export:chat -- --out logs/my_chat_backup.md
```

### 方式 B：透過 PowerShell 指令
```powershell
.\scripts\export-conversation.ps1
.\scripts\export-conversation.ps1 -List
.\scripts\export-conversation.ps1 <對話ID>
```

### 方式 C：Agent 自動為使用者執行匯出
當使用者在對話中要求匯出時，Agent 應：
1. 執行 `node scripts/export-conversation.mjs`（或直接使用本專案的匯出邏輯）。
2. 將輸出的 Markdown 檔案路徑以 clickable link 格式（`[filename](file:///path/to/file)`）提供給使用者。
3. 簡要列出匯出的對話回合數與儲存位置。

## 3. 輸出文件格式特點
- **完整保留使用者提問**：自動過濾系統 metadata 與 XML 包裝標籤。
- **條理化助手回覆**：包含完整的文字分析、規劃步驟、對照表與實作結果。
- **可收合的工具操作記錄**：使用 `<details><summary>` 收合執行過的命令與修改的檔案，保持文件整潔易讀。
