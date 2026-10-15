#!/usr/bin/env bash
set -euo pipefail

# 檢查是否提供必要參數
if [ $# -lt 1 ] || [ -z "$1" ]; then
  echo "[錯誤] 缺少必要參數：請提供目錄路徑。" >&2
  echo "用法: $(basename "$0") <目錄路徑> [其他選項]" >&2
  echo "範例: $(basename "$0") D:/G/2304.W07003" >&2
  echo "      $(basename "$0") /d/G/2304.W07003" >&2
  exit 1
fi

TARGET_DIR="$1"
shift

# 移除結尾的斜線或反斜線
TARGET_DIR="${TARGET_DIR%/}"
TARGET_DIR="${TARGET_DIR%\\}"

# 檢查目錄或路徑是否存在
if [ ! -e "$TARGET_DIR" ]; then
  echo "[錯誤] 找不到指定的目錄或路徑: \"$TARGET_DIR\"" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 若傳入為目錄，則批次轉換目錄下的 *.zip
if [ -d "$TARGET_DIR" ]; then
  INPUT_PATTERN="$TARGET_DIR/*.zip"
else
  INPUT_PATTERN="$TARGET_DIR"
fi

node "$SCRIPT_DIR/bin/shp2geojson" "$INPUT_PATTERN" --json "$@"
