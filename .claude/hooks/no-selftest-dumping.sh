#!/bin/bash
# =========================================================================
# CLAUDE.md §5 の物理ゲート版
# self-test を施主に丸投げする文言・シミュレート自己申告を検出したら
# exit 2 で Claude Code を止め、修正を促す
#
# 発動タイミング: Write / Edit / MultiEdit ツールの実行直後
# 対象: ファイルへの書き込み内容
# 効果: 「作文の中の禁止フレーズ」を機械的に排除
# =========================================================================

# Claude Code は hook にツール実行情報を JSON で標準入力から渡す
INPUT=$(cat)

# 禁止フレーズ辞書（今週の血の教訓から抽出、追加は下に足すだけ）
FORBIDDEN=(
  # self-test 丸投げ系
  "ユーザーが施主検査で"
  "please run the above steps"
  "your part"
  "you can confirm"
  "manual verification required"
  "PENDING (your part)"
  # 未実行の自己申告系
  "(simulated"
  "シミュレート"
  "simulated fresh reload"
)

# 検出ループ
for phrase in "${FORBIDDEN[@]}"; do
  if echo "$INPUT" | grep -qi "$phrase"; then
    echo "" >&2
    echo "🚫 CLAUDE.md §5違反を検出しました" >&2
    echo "   禁止フレーズ: '$phrase'" >&2
    echo "" >&2
    echo "self-test はあなた（Claude Code）の仕事です。" >&2
    echo "'(simulated)' や '施主検査で確認してください' は使わないこと。" >&2
    echo "" >&2
    echo "対処:" >&2
    echo "  1. 実操作テストを自分で実行してください" >&2
    echo "  2. 実際の応答時間・実際の画面文言を出力に含めてください" >&2
    echo "  3. 修正後、再度書き込みを試みてください" >&2
    echo "" >&2
    exit 2
  fi
done

exit 0
