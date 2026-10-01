(function(root){
 'use strict';
 const core=root.EgeBazaBackup;
 const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function html(){return `<section class="backup-root"><span class="eyebrow">Сохранить работу и продолжить на другом устройстве</span><h1>Резервная копия</h1><p class="page-intro">Копия переносит ответы, попытки, использование помощи и результаты проверок. Сейчас в неё входит первый модуль. Это файл для восстановления; отчёт преподавателю находится в разделе «Мой прогресс».</p><div class="two"><section class="panel"><h2>Скачать свою работу</h2><p>Сохраните файл на своём устройстве. Его можно открыть здесь в другом браузере и продолжить занятия.</p><div class="actions"><button class="btn" data-backup-export>Скачать резервную копию</button></div><p class="small">Для каждого ученика нужен свой файл. Курс не добавляет в копию имя или контакты.</p></section><section class="panel"><h2>Восстановить из файла</h2><p>Сначала покажем, что находится в копии. Результаты изменятся только после вашего подтверждения.</p><label class="backup-label" for="backup-file">Выберите JSON-файл копии</label><input id="backup-file" type="file" accept=".json,application/json" aria-describedby="backup-file-help"><p id="backup-file-help" class="small">До 256 КБ. Копия первого модуля курса «Базовый ЕГЭ».</p></section></div><p id="backup-status" class="notice backup-status" role="status" hidden></p><section id="backup-preview" class="panel backup-preview" hidden aria-labelledby="backup-preview-title"></section><div class="helper"><b>Перед переносом</b><p>Закройте другие вкладки с первым модулем. Восстановление заменяет результаты этого модуля в текущем браузере, а не объединяет работы разных учеников. Другие курсы не затрагиваются.</p><p>Файл обрабатывается в браузере и никуда автоматически не отправляется. Подтверждённые навыки рассчитываются по ответам, а не по готовой оценке из файла.</p></div><div class="actions"><a class="btn secondary" href="#progress">К моему прогрессу</a></div></section>`;}
 function stats(s){if(s.status==='unreadable')return '<p>Текущее сохранение не удалось прочитать. При восстановлении оно будет заменено выбранной копией.</p>';if(s.status==='empty')return '<p>Сохранённой работы пока нет.</p>';return `<p>Практика: <b>${s.solved}/24</b>; с первой попытки без помощи: <b>${s.independent}/24</b>; подтверждено навыков: <b>${s.confirmed}/6</b>.</p><ul>${Object.entries({diagnostic:'Старт',checkpoint:'Итог',repeat:'Повторение'}).map(([id,label])=>{const r=s.runs[id];return `<li>${label}: ${r.finished?`${r.correct}/${r.total}${r.helped?' · с обращением к обучению':''}`:r.started?`не завершено, ответов ${r.count}/${r.total}`:'не начато'}</li>`;}).join('')}</ul>`;}
 function mount(main){
  const host=main.querySelector('.backup-root'),status=host.querySelector('#backup-status'),panel=host.querySelector('#backup-preview'),input=host.querySelector('#backup-file');
  let candidate=null,generation=0;const storage=()=>root.localStorage;
  function message(text){status.textContent=text;status.hidden=false;}
  function clear(){candidate=null;panel.hidden=true;panel.replaceChildren();}
  function download(text,name,type='application/json'){
   const url=URL.createObjectURL(new Blob([text],{type:type+';charset=utf-8'})),a=document.createElement('a');
   a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function exportCurrent(){try{download(core.exportBackup(storage()),'mathexam-ege-baza-backup-'+new Date().toISOString().slice(0,10)+'.json');message('Скачивание копии начато. Проверьте, что файл появился в загрузках.');}catch(e){message(e.message);}}
  function showPreview(text){
   try{
    candidate=core.preview(text,storage());status.hidden=true;
    panel.innerHTML=`<h2 id="backup-preview-title" tabindex="-1">Сравните результаты</h2><p>Дата копии: ${esc(new Date(candidate.exportedAt).toLocaleString('ru-RU'))}.</p><div class="two"><section><h3>Сейчас в браузере</h3>${stats(candidate.current)}</section><section><h3>После восстановления</h3>${stats(candidate.incoming)}</section></div><p><b>Текущая работа первого модуля будет заменена.</b> Более поздние ответы, которых нет в файле, не сохранятся. При необходимости сначала скачайте текущую копию.</p><div class="actions"><button class="btn secondary" data-backup-current>${candidate.current.status==='unreadable'?'Скачать исходное сохранение':'Скачать текущую копию'}</button></div><label class="backup-confirm"><input type="checkbox" id="backup-consent"> Я понимаю, что результаты первого модуля в этом браузере будут заменены.</label><div class="actions"><button class="btn" data-backup-apply disabled>Восстановить выбранную копию</button><button class="btn secondary" data-backup-cancel>Отмена</button></div>`;
    panel.hidden=false;panel.querySelector('h2').focus();
    panel.querySelector('#backup-consent').onchange=e=>panel.querySelector('[data-backup-apply]').disabled=!e.target.checked;
    panel.querySelector('[data-backup-cancel]').onclick=()=>{generation++;clear();input.value='';message('Восстановление отменено. Результаты не изменились.');input.focus();};
    panel.querySelector('[data-backup-current]').onclick=()=>{
     if(candidate?.current.status==='unreadable'){try{const raw=core.get(storage());if(raw===null)throw Error('Сохранение уже удалено. Снова выберите файл.');download(raw,'mathexam-ege-baza-original.txt','text/plain');message('Скачивание исходного сохранения начато. Этот файл сохранён как текст для разбора.');}catch(e){message(e.message);}}
     else exportCurrent();
    };
    panel.querySelector('[data-backup-apply]').onclick=()=>{
     if(!candidate||!panel.querySelector('#backup-consent').checked)return;
     try{core.restore(candidate,storage());clear();input.value='';message('Копия восстановлена. Откройте «Мой прогресс» или продолжите первый модуль.');status.tabIndex=-1;status.focus();}
     catch(e){clear();input.value='';message(e.message);input.focus();}
    };
   }catch(e){clear();message(e.message);}
  }
  input.onchange=()=>{
   const token=++generation;clear();status.hidden=true;const file=input.files?.[0];if(!file)return;
   if(file.size>core.MAX_BYTES){message('Файл слишком большой. Допустимый размер — 256 КБ.');return;}
   const reader=new FileReader();reader.onerror=()=>{if(token===generation&&host.isConnected)message('Не удалось прочитать файл. Попробуйте выбрать его снова.');};
   reader.onload=()=>{if(token===generation&&host.isConnected)showPreview(String(reader.result));};reader.readAsText(file);
  };
  host.querySelector('[data-backup-export]').onclick=exportCurrent;
  function changed(event){if(event.key!==core.KEY&&event.key!==null)return;if(candidate){generation++;clear();input.value='';message('Прогресс изменился в другой вкладке. Снова выберите файл и сравните результаты.');}}
  root.addEventListener('storage',changed);
  return ()=>{generation++;root.removeEventListener('storage',changed);};
 }
 root.EgeBazaBackupUI={html,mount};
})(globalThis);
