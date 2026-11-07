from pathlib import Path
import sys
p=Path(sys.argv[1] if len(sys.argv)>1 else 'trainers/simple-equations-stepwise.html')
s=p.read_text()
css='''<style>
[hidden]{display:none!important}.mode-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.mode-row button{min-height:44px}.free-hint{font-size:14px;line-height:1.45;color:#475467}.free-input-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.free-input-row input{box-sizing:border-box;width:100%;max-width:420px;text-align:left;font-size:20px}.free-input-row button{min-height:44px}.free-list{padding-left:1.4em;overflow-wrap:anywhere}.free-list li{padding:5px 0}.step-error{color:#7a271a}.step-ok{color:#14532d}.free-previous details{padding:8px 0;border-top:1px solid #e5e7eb}.free-previous summary{cursor:pointer;font-weight:700}.free-previous ol{overflow-wrap:anywhere}.free-limit{color:#7a271a}@media(max-width:480px){.page{padding:10px}.card,.hero{padding:15px}.eq{font-size:34px}.free-input-row button{flex:1 1 140px}}
</style>'''
s=s.replace('</head><body>',css+'\n</head><body>')
needle='<section class="grid"><div class="card"><div class="row">'
replacement='''<section class="grid"><div class="card"><div class="mode-row" role="group" aria-label="Режим решения"><button id="modeBasic" class="active" type="button" aria-pressed="true">С выбором действия</button><button id="modeFree" type="button" aria-pressed="false">Записываю шаги</button></div><div id="freeMode" hidden><p class="free-hint">Записывай каждое следующее уравнение целиком. Можно использовать x или х, скобки, +, −, * и /. Например: 3x + 5 = 17 → 3x = 12 → x = 4.</p><div id="freeEquation" class="eq"></div><ol id="freeSteps" class="free-list" aria-label="Записанные шаги"></ol><label for="freeInput"><b>Следующий шаг</b></label><div class="free-input-row"><input id="freeInput" type="text" maxlength="160" autocomplete="off" placeholder="Например, 3x = 12"><button id="freeCheck" class="primary" type="button">Проверить шаг</button><button id="freeNext" class="good" type="button">Следующее уравнение</button></div><div id="freeFeedback" class="fb" role="status" aria-live="polite"></div><p id="freeLimit" class="free-limit"></p><p id="freeStorage" class="free-hint"></p><p class="free-hint">Проверяются линейные выражения; деление на выражение с x и нелинейные действия пока не поддерживаются. Этот режим не изменяет статистику режима с выбором действия.</p><p class="free-hint">На общей доске этот тренажёр пока не синхронизирует шаги между участниками; записи доступны в этом браузере. Хранятся последние 20 уравнений, до 60 записей в каждом.</p><details class="free-previous"><summary>Предыдущие уравнения</summary><div id="freePrevious"></div></details></div><div id="beginnerMode"><div class="row">'''
assert needle in s
s=s.replace(needle,replacement,1)
needle='<div id="fb" class="fb">Сначала выбери действие, которое будешь делать, чтобы найти x.</div></div><aside'
replace='<div id="fb" class="fb">Сначала выбери действие, которое будешь делать, чтобы найти x.</div></div></div><aside'
assert needle in s
s=s.replace(needle,replace,1)
code=Path('tools/equations/engine.js').read_text()+'\n'+Path('tools/equations/interface.js').read_text()
marker='<!-- download-panel:start:simple-equations-stepwise -->' if '<!-- download-panel:start:simple-equations-stepwise -->' in s else '<script data-inline-source="/ege-baza/return-to-course.js">'
assert marker in s
s=s.replace(marker,'<script>\n'+code+'\n</script>\n'+marker,1)
p.write_text(s)
