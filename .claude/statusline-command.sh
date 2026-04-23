#!/usr/bin/env bash
# Claude Code status line — JetBrains Mono style, colores vivos

input=$(cat)

# ── Utilidades ──────────────────────────────────────────────────────────────

format_tokens() {
  local n=$1
  if [ -z "$n" ] || [ "$n" == "null" ]; then n=0; fi
  if [ "$n" -ge 1000000 ]; then
    printf "%.1fM" "$(echo "scale=2; $n / 1000000" | bc 2>/dev/null)"
  elif [ "$n" -ge 1000 ]; then
    printf "%.0fK" "$(echo "scale=0; $n / 1000" | bc 2>/dev/null)"
  else
    echo "$n"
  fi
}

draw_bar() {
  local pct=$1
  local fill_color=$2
  local empty_color=$3
  local width=${4:-14}
  if ! [[ "$pct" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then pct=0; fi
  local pct_int=$(printf "%.0f" "$pct")
  local filled=$(( pct_int * width / 100 ))
  local empty=$(( width - filled ))
  local out=""
  [ "$filled" -gt 0 ] && out="${out}${fill_color}$(printf '%*s' "$filled" '')\e[0m"
  [ "$empty"  -gt 0 ] && out="${out}${empty_color}$(printf '%*s' "$empty" '')\e[0m"
  echo -n "$out"
}

format_reset() {
  local resets_at=$1
  if [[ -n "$resets_at" && "$resets_at" != "null" && "$resets_at" -gt 0 ]]; then
    local now=$(date +%s)
    local diff=$(( resets_at - now ))
    if   [ "$diff" -le 0 ];    then echo "now"
    elif [ "$diff" -ge 3600 ]; then printf "%dh %02dm" $(( diff/3600 )) $(( (diff%3600)/60 ))
    elif [ "$diff" -ge 60 ];   then printf "%dm %02ds" $(( diff/60 ))   $(( diff%60 ))
    else echo "${diff}s"
    fi
  else
    echo "—"
  fi
}

badge() {
  # badge <bg_color_code> <fg_color_code> <text>
  # bg: e.g. "\e[48;2;42;31;110m"  fg: e.g. "\e[38;2;167;139;250m"
  echo -n "${1}${2} ${3} \e[0m"
}

# ── Colores RGB (fondo / texto) ──────────────────────────────────────────────
# Proyecto  — violeta oscuro / lavanda
BG_PROJECT="\e[48;2;42;31;110m";   FG_PROJECT="\e[38;2;167;139;250m"
# Rama      — verde oscuro / esmeralda
BG_BRANCH="\e[48;2;14;61;42m";     FG_BRANCH="\e[38;2;52;211;153m"
# Modelo    — gris oscuro / gris claro
BG_MODEL="\e[48;2;26;26;34m";      FG_MODEL="\e[38;2;148;163;184m"
# Agente    — rojo oscuro / rojo claro
BG_AGENT="\e[48;2;59;21;21m";      FG_AGENT="\e[38;2;248;113;113m"
# Vim NORMAL — verde oscuro / verde
BG_VIM_N="\e[48;2;26;46;26m";      FG_VIM_N="\e[38;2;74;222;128m"
# Vim INSERT — azul oscuro / azul claro
BG_VIM_I="\e[48;2;14;30;52m";      FG_VIM_I="\e[38;2;96;165;250m"
# Output style — naranja oscuro / naranja
BG_STYLE="\e[48;2;50;28;5m";       FG_STYLE="\e[38;2;251;146;60m"

# Barras
BAR_CTX_FILL="\e[48;2;245;158;11m";  BAR_CTX_EMPTY="\e[48;2;24;24;31m"
BAR_5H_FILL="\e[48;2;16;185;129m";   BAR_5H_EMPTY="\e[48;2;24;24;31m"
BAR_7D_FILL="\e[48;2;129;140;248m";  BAR_7D_EMPTY="\e[48;2;24;24;31m"

# Porcentajes
PC_CTX="\e[38;2;251;191;36m"
PC_5H="\e[38;2;52;211;153m"
PC_7D="\e[38;2;165;180;252m"

# Chips fila 3
FG_TOK="\e[38;2;96;165;250m"
FG_ADD="\e[38;2;52;211;153m"
FG_DEL="\e[38;2;248;113;113m"
FG_STG="\e[38;2;167;139;250m"
FG_RST="\e[38;2;75;85;99m"
FG_DIM="\e[38;2;55;65;81m"
RESET="\e[0m"
BOLD="\e[1m"

# ── Extracción de datos ──────────────────────────────────────────────────────

model=$(echo "$input" | jq -r '.model.display_name // "Unknown"')
git_dir=$(echo "$input" | jq -r '.workspace.project_dir // empty')

project_name="Unknown"
git_branch=""
git_staged_count=0
added=0; removed=0

if [ -n "$git_dir" ]; then
  project_name=$(basename "$git_dir")
  if [ -d "$git_dir/.git" ]; then
    git_branch=$(git -C "$git_dir" --no-optional-locks branch --show-current 2>/dev/null)
    diff_out=$(git -C "$git_dir" --no-optional-locks diff --shortstat HEAD 2>/dev/null)
    [ -z "$diff_out" ] && diff_out=$(git -C "$git_dir" --no-optional-locks diff --shortstat 2>/dev/null)
    added=$(echo "$diff_out"   | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo 0)
    removed=$(echo "$diff_out" | grep -oE '[0-9]+ deletion'  | grep -oE '[0-9]+' || echo 0)
    added=${added:-0}; removed=${removed:-0}
    git_staged_count=$(git -C "$git_dir" --no-optional-locks diff --cached --name-only 2>/dev/null | wc -l | tr -d ' ')
  fi
fi

used_pct=$(echo "$input"    | jq -r '.context_window.used_percentage // 0')
ctx_window=$(echo "$input"  | jq -r '.context_window.context_window_size // 0')
input_tokens=$(echo "$input"   | jq -r '.context_window.current_usage.input_tokens // 0')
cache_read=$(echo "$input"     | jq -r '.context_window.current_usage.cache_read_input_tokens // 0')
cache_create=$(echo "$input"   | jq -r '.context_window.current_usage.cache_creation_input_tokens // 0')
total_in_context=$(( input_tokens + cache_read + cache_create ))
total_input=$(echo "$input"  | jq -r '.context_window.total_input_tokens // 0')
total_output=$(echo "$input" | jq -r '.context_window.total_output_tokens // 0')
total_session=$(( total_input + total_output ))

ctx_pct_int=$(printf "%.0f" "${used_pct:-0}")
tokens_used_fmt=$(format_tokens "$total_in_context")
ctx_window_fmt=$(format_tokens "$ctx_window")
session_fmt=$(format_tokens "$total_session")

vim_mode=$(echo "$input"    | jq -r '.vim.mode // empty')
agent_name=$(echo "$input"  | jq -r '.agent.name // empty')
session_name=$(echo "$input" | jq -r '.session_name // empty')
output_style=$(echo "$input" | jq -r '.output_style.name // empty')

pct_5h_raw=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // 0')
pct_5h=$(printf "%.0f" "$pct_5h_raw" 2>/dev/null || echo "0")
resets_at_5h=$(echo "$input" | jq -r '.rate_limits.five_hour.resets_at // 0')
reset_5h=$(format_reset "$resets_at_5h")

pct_7d_raw=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // 0')
pct_7d=$(printf "%.0f" "$pct_7d_raw" 2>/dev/null || echo "0")
resets_at_7d=$(echo "$input" | jq -r '.rate_limits.seven_day.resets_at // 0')
reset_7d=$(format_reset "$resets_at_7d")

# ── Fila 0: badges ───────────────────────────────────────────────────────────

[ -n "$session_name" ] && display_name="$session_name" || display_name="$project_name"

row0=""
row0+=$(badge "$BG_PROJECT" "${BOLD}${FG_PROJECT}" "◆ ${display_name}")
[ -n "$git_branch" ] && row0+=" $(badge "$BG_BRANCH" "$FG_BRANCH" "⎇ ${git_branch}")"
row0+=" $(badge "$BG_MODEL" "$FG_MODEL" "${model}")"

if [ -n "$agent_name" ]; then
  row0+=" $(badge "$BG_AGENT" "$FG_AGENT" "agent:${agent_name}")"
fi

if [ -n "$vim_mode" ]; then
  if [ "$vim_mode" = "INSERT" ]; then
    row0+=" $(badge "$BG_VIM_I" "${BOLD}${FG_VIM_I}" "INSERT")"
  else
    row0+=" $(badge "$BG_VIM_N" "${BOLD}${FG_VIM_N}" "NORMAL")"
  fi
fi

if [ -n "$output_style" ] && [ "$output_style" != "default" ] && [ "$output_style" != "Default" ]; then
  row0+=" $(badge "$BG_STYLE" "$FG_STYLE" "${output_style}")"
fi

# ── Fila 1: barras ───────────────────────────────────────────────────────────

bar_ctx=$(draw_bar "$ctx_pct_int" "$BAR_CTX_FILL" "$BAR_CTX_EMPTY" 14)
bar_5h=$(draw_bar  "$pct_5h"      "$BAR_5H_FILL"  "$BAR_5H_EMPTY"  14)
bar_7d=$(draw_bar  "$pct_7d"      "$BAR_7D_FILL"  "$BAR_7D_EMPTY"  14)

seg_ctx="${FG_DIM}ctx${RESET} ${bar_ctx} ${BOLD}${PC_CTX}${ctx_pct_int}%${RESET} ${FG_RST}${tokens_used_fmt}/${ctx_window_fmt}${RESET}"
seg_5h="${FG_DIM}5h${RESET}  ${bar_5h} ${BOLD}${PC_5H}${pct_5h}%${RESET} ${FG_RST}↻ ${reset_5h}${RESET}"
seg_7d="${FG_DIM}7d${RESET}  ${bar_7d} ${BOLD}${PC_7D}${pct_7d}%${RESET} ${FG_RST}↻ ${reset_7d}${RESET}"

row1="${seg_ctx}   ${seg_5h}   ${seg_7d}"

# ── Fila 2: chips ────────────────────────────────────────────────────────────

row2="${FG_DIM}tok${RESET} ${BOLD}${FG_TOK}${session_fmt}${RESET}"

if [ "$added" -gt 0 ] || [ "$removed" -gt 0 ]; then
  row2+="   ${FG_DIM}git${RESET} ${BOLD}${FG_ADD}+${added}${RESET} ${BOLD}${FG_DEL}-${removed}${RESET}"
fi

if [ "$git_staged_count" -gt 0 ]; then
  row2+="   ${BOLD}${FG_STG}${git_staged_count} staged${RESET}"
fi

# ── Output ───────────────────────────────────────────────────────────────────

printf "%b\n%b\n%b\n" "$row0" "$row1" "$row2"
