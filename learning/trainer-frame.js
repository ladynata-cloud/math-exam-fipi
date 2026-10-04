(function(root){
  'use strict';
  const PROTOCOL='mathexam-learning';
  const clone=value=>JSON.parse(JSON.stringify(value));
  function plain(value,depth=0){
    if(depth>18)return false;
    if(value===null||typeof value==='boolean')return true;
    if(typeof value==='number')return Number.isFinite(value);
    if(typeof value==='string')return value.length<=30000;
    if(Array.isArray(value))return value.length<=5000&&value.every(v=>plain(v,depth+1));
    if(!value||typeof value!=='object'||Object.getPrototypeOf(value)!==Object.prototype)return false;
    return Object.keys(value).length<=3000&&Object.entries(value).every(([k,v])=>!['__proto__','prototype','constructor'].includes(k)&&plain(v,depth+1));
  }
  class LearningTrainerFrame{
    constructor(host,options){
      this.host=host;this.item=options.item;this.attempt=options.attempt;this.readOnly=options.readOnly!==false;this.preview=!!options.preview;this.onChange=options.onChange;this.onStatus=options.onStatus;this.channel=crypto.randomUUID();this.instance=null;this.ready=false;this.destroyed=false;this.lastVersion=null;
      if(!this.item||!this.item.url)throw Error('Тренажёр не найден в каталоге.');
      const url=new URL(this.item.url,root.LearningTrainerOrigin||'https://mathexam.space');
      const local=['localhost','127.0.0.1'].includes(url.hostname);
      if(url.protocol!=='https:'&&!(local&&url.protocol==='http:'))throw Error('Нужен защищённый адрес тренажёра.');
      if(url.origin===location.origin)throw Error('Тренажёр должен открываться отдельно от кабинета.');
      this.origin=url.origin;
      url.searchParams.set('learning','1');url.searchParams.set('parentOrigin',location.origin);url.searchParams.set('channel',this.channel);
      this.element=document.createElement('div');this.element.className='learning-frame';
      this.iframe=document.createElement('iframe');this.iframe.title=this.item.title+(this.preview?' — живая работа ученика':'');this.iframe.referrerPolicy='no-referrer';this.iframe.setAttribute('sandbox','allow-scripts allow-same-origin');this.iframe.src=url.href;
      this.shield=document.createElement('div');this.shield.className='frame-shield';this.shield.setAttribute('aria-hidden','true');
      this.status=document.createElement('div');this.status.className='frame-status';this.status.setAttribute('role','status');
      this.element.append(this.iframe,this.shield,this.status);host.append(this.element);
      this.message=e=>this.receive(e);root.addEventListener('message',this.message);
      this.iframe.addEventListener('load',()=>{if(!this.ready){this.access();this.setStatus('Подключаем тренажёр…');clearTimeout(this.timer);this.timer=setTimeout(()=>{if(!this.ready)this.setStatus('Тренажёр не подтвердил связь. Обновите страницу.');},15000);}});
      this.resize=new ResizeObserver(()=>this.fit());this.resize.observe(host);this.fit();this.access();this.setStatus('Загружаем задание…');
    }
    setStatus(message){this.status.textContent=message;this.status.hidden=!message;this.onStatus?.(message);}
    fit(){if(this.destroyed)return;const r=this.host.getBoundingClientRect();if(this.preview){const width=1100,scale=Math.max(.01,r.width/width);this.iframe.style.width=width+'px';this.iframe.style.height=Math.max(700,r.height/scale)+'px';this.iframe.style.transform='scale('+scale+')';}else{this.iframe.style.width='100%';this.iframe.style.height='100%';this.iframe.style.transform='none';}}
    access(){const blocked=this.readOnly||this.preview||!this.ready;this.shield.hidden=!(this.preview||!this.ready);this.iframe.tabIndex=this.preview||!this.ready?-1:0;this.iframe.style.pointerEvents=this.preview||!this.ready?'none':'auto';this.element.dataset.readonly=String(blocked);}
    send(type,payload){if(this.destroyed||!this.instance)return;this.iframe.contentWindow.postMessage({protocol:PROTOCOL,version:1,channel:this.channel,instance:this.instance,type,payload},this.origin);}
    hydrate(){this.ready=false;this.access();this.send('hydrate',{taskSpec:clone(this.attempt.taskSpec),state:clone(this.attempt.state),readOnly:this.readOnly||this.preview});this.lastVersion=this.attempt.version;this.lastStateKey=JSON.stringify(this.attempt.state);this.lastTaskKey=JSON.stringify(this.attempt.taskSpec);}
    receive(event){
      if(this.destroyed||event.source!==this.iframe.contentWindow||event.origin!==this.origin)return;
      const m=event.data;if(!m||m.protocol!==PROTOCOL||m.version!==1||m.channel!==this.channel||typeof m.instance!=='string'||m.instance.length>160)return;
      if(m.type==='ready'){
        if(m.payload?.trainerId!==this.item.trainerId||m.payload.contentVersion!==this.item.contentVersion)return;
        this.instance=m.instance;this.hydrate();return;
      }
      if(m.instance!==this.instance)return;
      if(m.type==='applied'){if(m.payload?.error){this.ready=false;this.access();this.setStatus('Не удалось восстановить эту работу. Обновите страницу.');return;}this.ready=true;clearTimeout(this.timer);this.access();this.setStatus('');return;}
      if(m.type!=='change'||!this.ready||this.readOnly||this.preview)return;
      const p=m.payload;if(!p||typeof p.kind!=='string'||!plain(p.state)||!plain(p.details??{}))return;
      if(JSON.stringify(p).length>140000){this.setStatus('Состояние задания слишком большое для сохранения.');return;}
      this.lastStateKey=JSON.stringify(p.state);this.onChange?.({kind:p.kind,details:clone(p.details??{}),state:clone(p.state)});
    }
    update(attempt,{readOnly=this.readOnly,force=false}={}){
      const changed=this.readOnly!==readOnly||this.lastStateKey!==JSON.stringify(attempt.state)||this.lastTaskKey!==JSON.stringify(attempt.taskSpec)||force;
      this.attempt=attempt;this.readOnly=readOnly;
      if(changed&&this.instance)this.hydrate();else this.access();
    }
    destroy(){this.destroyed=true;clearTimeout(this.timer);root.removeEventListener('message',this.message);this.resize.disconnect();this.element.remove();}
  }
  root.LearningTrainerFrame=LearningTrainerFrame;
})(window);
