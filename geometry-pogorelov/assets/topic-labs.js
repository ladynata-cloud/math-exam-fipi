/* Diagrams and measurements for the revised geometry investigations. */
(function(root){
  'use strict';
  const G=root.GeoMath;
  function line(a,b,extent='segment'){
    return {id:a+b,a,b,type:'line',extent};
  }
  function point(id,x,y,extra={}){
    return {id,x,y,kind:'free',...extra};
  }
  function scene(topic){
    if(topic===16)return {markConstructedPerpendicular:true,points:[point('A',140,245),point('B',505,245),point('C',310,110)],objects:[line('A','B','line')]};
    if(topic===20){
      const translate=(id,source)=>point(id,0,0,{kind:'sum',a:'A',b:'D',c:source});
      return {labelPartners:{D:'A',E:'B',F:'C'},points:[point('A',105,240),point('B',245,240),point('C',145,105),point('D',345,265),translate('E','B'),translate('F','C')],objects:[line('A','B'),line('B','C'),line('C','A'),line('D','E'),line('E','F'),line('F','D')]};
    }
    if(topic===61){
      const board=G.scene('triangle');
      const midpoint=(id,a,b)=>point(id,0,0,{kind:'midpoint',a,b});
      board.points.push(midpoint('D','B','C'),midpoint('E','A','C'),midpoint('F','A','B'),point('G',0,0,{kind:'intersection',o1:'AD',o2:'BE',branch:0}));
      board.objects.push(line('A','D'),line('B','E'),line('C','F'));
      return board;
    }
    if(topic===39)return G.scene('circle');
    if(topic===112)return G.scene('triangle');
    if(topic===80){
      return {points:[point('O',320,220),point('A',420,220),point('C',190,160),point('D',0,0,{kind:'parallel',a:'C',b:'O',c:'A',k:1})],objects:[{id:'circle',a:'O',b:'A',type:'circle'},line('O','A'),line('C','D','line')]};
    }
    if(topic===62||topic===67){
      const scene=G.scene('right');
      // These lessons mark the angles used in the ratios on their own canvas.
      scene.type='right-triangle-ratios';
      if(topic===67)return scene;
      scene.points.push(point('D',0,0,{kind:'midpoint',a:'A',b:'B'}),point('E',0,0,{kind:'foot',a:'D',b:'A',c:'C'}));
      scene.objects.push(line('D','E'));
      return scene;
    }
    if(topic===98){
      return {points:[point('O',260,270),point('A',460,270),point('B',345,110)],objects:[line('O','A'),line('O','B')]};
    }
    if(topic===127){
      const scene=G.scene('triangle');
      scene.points.push(point('D',0,0,{kind:'parallel',a:'C',b:'A',c:'B',k:.5,draggable:true}));
      scene.objects.push(line('C','D','line'),line('A','D'),line('B','D'));
      return scene;
    }
    if(topic===131){
      return {points:[point('O',320,220),point('A',370,220)],objects:[{id:'circle',a:'O',b:'A',type:'circle'},line('O','A')]};
    }
  }
  const fmt=x=>x.toLocaleString('ru-RU',{maximumFractionDigits:3});
  function measure(topic,board){
    const get=name=>board.point(name),a=get('A'),b=get('B'),c=get('C'),o=get('O');
    const length=(p,q)=>G.dist(p,q)/50;
    const area=(p,q,r)=>Math.abs(G.cross(G.sub(q,p),G.sub(r,p)))/5000;
    if(topic===16){
      if(G.dist(a,b)<G.EPS)return ['A и B совпали. Раздвинь точки, чтобы задать прямую AB.'];
      const line=board.perpendicularThrough('C','A','B');
      if(!line)return ['Построй перпендикуляр: выбери C, затем A и B.'];
      const along=G.sub(b,a),normal=G.sub(line.q,line.p);
      const cosine=Math.abs(G.dot(along,normal))/(G.norm(along)*G.norm(normal));
      const angle=Math.acos(Math.min(1,cosine))*180/Math.PI;
      return ['Угол между прямой AB и построенной прямой через C = '+angle.toLocaleString('ru-RU',{maximumFractionDigits:2})+'°'];
    }
    if(topic===20){
      if(area(a,b,c)<G.EPS)return ['Треугольник выродился. Уведи C с прямой AB и раздвинь A и B.'];
      const d=get('D'),e=get('E'),f=get('F');
      return ['AB = '+fmt(length(a,b))+', DE = '+fmt(length(d,e)),'AC = '+fmt(length(a,c))+', DF = '+fmt(length(d,f)),'∠A = '+fmt(G.angle(b,a,c))+'°, ∠D = '+fmt(G.angle(e,d,f))+'°','BC = '+fmt(length(b,c))+', EF = '+fmt(length(e,f))];
    }
    if(topic===61){
      const d=get('D'),e=get('E'),g=get('G');
      if(g.valid===false||area(a,b,c)<G.EPS)return ['Треугольник выродился. Уведи C с прямой AB и раздвинь A и B.'];
      return ['AG/GD = '+fmt(length(a,g)/length(g,d)),'BG/GE = '+fmt(length(b,g)/length(g,e))];
    }
    if(topic===39){
      const lengths=[length(o,a),length(o,b),length(o,c)];
      if(area(a,b,c)<G.EPS)return ['Вершины совместились или лежат на одной прямой. Описанная окружность треугольника в этом случае не определяется.'];
      return lengths.map((r,i)=>'O'+'ABC'[i]+' = '+fmt(r));
    }
    if(topic===80){
      const r=length(o,a),d=get('D'),foot=G.foot(o,c,d);
      if(!foot||r<G.EPS)return ['Раздвинь O и A: нужны положительный радиус и прямая.'];
      const intersections=G.intersections(board.geometry('circle'),board.geometry('CD'));
      return ['R = '+fmt(r),'d = '+fmt(length(o,foot)),'Общих точек: '+intersections.length];
    }
    if(topic===112){
      if(area(a,b,c)<G.EPS)return ['Три точки лежат на одной прямой. Передвинь C, чтобы получить треугольник.'];
      return ['AC = '+fmt(length(a,c))+' ↔ ∠B = '+fmt(G.angle(a,b,c))+'°','AB = '+fmt(length(a,b))+' ↔ ∠C = '+fmt(G.angle(a,c,b))+'°'];
    }
    if(topic===62||topic===67){
      const ac=length(a,c),ab=length(a,b),bc=length(b,c);
      if(area(a,b,c)<G.EPS)return ['Треугольник выродился. Раздвинь A и B.'];
      if(topic===62){
        const d=get('D'),e=get('E');
        return ['∠A = '+fmt(G.angle(b,a,c))+'°','AE/AD = '+fmt(length(a,e)/length(a,d)),'AC/AB = '+fmt(ac/ab)];
      }
      return ['∠A = '+fmt(G.angle(b,a,c))+'°','∠B = '+fmt(G.angle(a,b,c))+'°','BC = '+fmt(bc),'AB = '+fmt(ab),'sin A = cos B = '+fmt(bc/ab)];
    }
    if(topic===98){
      const u={x:(a.x-o.x)/50,y:(o.y-a.y)/50},v={x:(b.x-o.x)/50,y:(o.y-b.y)/50};
      const angle=G.angle(a,o,b);
      return ['OA = ('+fmt(u.x)+'; '+fmt(u.y)+')','OB = ('+fmt(v.x)+'; '+fmt(v.y)+')','OA · OB = '+fmt(G.dot(u,v)),angle===null?'Один вектор нулевой, угол не определён.':'∠AOB = '+fmt(angle)+'°'];
    }
    if(topic===127){
      const d=get('D');
      if(area(a,b,c)<G.EPS)return ['Треугольники выродились, площадь равна нулю. Уведи C с прямой AB и раздвинь A и B.'];
      return ['AB = '+fmt(length(a,b)),'S(ABC) = '+fmt(area(a,b,c)),'S(ABD) = '+fmt(area(a,b,d))];
    }
    if(topic===131){
      const r=length(o,a);
      return ['Радиус OA = '+fmt(r),'Площадь круга ≈ '+fmt(Math.PI*r*r)+' кв. ед.'];
    }
  }
  function rightAngleCorner(vertex,a,b,maxSize){
    if([vertex,a,b].some(p=>!p||p.valid===false))return null;
    const first=G.sub(a,vertex),second=G.sub(b,vertex);
    const l1=G.norm(first),l2=G.norm(second);
    if(Math.min(l1,l2)<1||Math.abs(G.dot(first,second))>1e-7*l1*l2)return null;
    const size=Math.min(maxSize,l1/4,l2/4);
    const u=G.mul(first,size/l1),v=G.mul(second,size/l2);
    return [G.add(vertex,u),G.add(G.add(vertex,u),v),G.add(vertex,v)];
  }
  function paint(topic,board,ctx){
    function polygon(ids,color){
      const pts=ids.map(id=>board.point(id));
      ctx.beginPath();
      pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
      ctx.closePath();ctx.fillStyle=color;ctx.fill();
    }
    function disk(x,y,r,color){
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
    }
    function markRight(vertex,a,b){
      const corners=rightAngleCorner(board.point(vertex),board.point(a),board.point(b),13);
      if(!corners)return;
      ctx.beginPath();ctx.moveTo(corners[0].x,corners[0].y);
      ctx.lineTo(corners[1].x,corners[1].y);ctx.lineTo(corners[2].x,corners[2].y);
      ctx.strokeStyle='#196a56';ctx.lineWidth=2;ctx.stroke();
    }
    if(topic===62||topic===67)markRight('C','A','B');
    if(topic===62)markRight('E','A','D');
    if(topic===112){
      markRight('B','A','C');
      markRight('C','A','B');
    }
    if(topic===127){
      polygon(['A','B','C'],'#3187a42b');
      polygon(['A','B','D'],'#d987382e');
    }
    if(topic===131){
      const g=board.geometry('circle');
      disk(g.o.x,g.o.y,g.r,'#247c7d27');
    }
    if(topic===80){
      for(const p of G.intersections(board.geometry('circle'),board.geometry('CD')))disk(p.x,p.y,6,'#ad4a19');
    }
    if(topic===98){
      markRight('O','A','B');
      const o=board.point('O');
      for(const name of ['A','B']){
        const p=board.point(name),v=G.sub(p,o),length=G.norm(v);
        if(length<15)continue;
        const u=G.unit(v),base=G.sub(p,G.mul(u,15)),side=G.mul(G.rot(u),6);
        ctx.beginPath();ctx.moveTo(p.x,p.y);
        for(const end of [G.add(base,side),G.sub(base,side)])ctx.lineTo(end.x,end.y);
        ctx.closePath();ctx.fillStyle='#214f65';ctx.fill();
      }
    }
  }
  // Schematic coordinates are in one scale; the accompanying caption states the givens.
  function proofFigure(topic){
    const figures={
      16:{pts:{A:[30,75],B:[270,75],O:[141,75],C:[141,25],D:[141,125]},segments:['AB','CD'],right:['AOC'],caption:'Прямые AB и CD пересекаются в O. Известно, что угол AOC прямой.'},
      20:{pts:{A:[25,113],B:[115,113],C:[47,48],D:[169,109],E:[259,109],F:[191,44]},segments:['AB','BC','CA','DE','EF','FD'],caption:'A соответствует D, B — E, C — F. Две стороны сходятся при A и D.'},
      61:{pts:{A:[24,121],B:[264,121],C:[99,19],D:[181.5,70],E:[61.5,70],G:[129,87],M:[76.5,104],N:[196.5,104]},segments:['AB','BC','CA','AD','BE'],aux:['ED','MN','ME','ND'],caption:'G — пересечение медиан AD и BE. M и N — середины AG и BG. Выдели параллелограмм MNDE.'},
      39:{pts:{A:[75,120],B:[195,120],C:[195,40],O:[135,80],M:[135,120],N:[195,80]},segments:['AB','BC','CA','OA','OB','OC'],aux:['OM','ON'],right:['OMA','ONB','ABC'],circle:[135,80,Math.hypot(60,40)],caption:'M и N — середины AB и BC. Серединные перпендикуляры встречаются в O. Изображён частный случай прямоугольного треугольника.'},
      62:{pts:{A:[35,130],C:[245,130],B:[245,25],D:[140,77.5],E:[140,130]},segments:['AB','BC','CA'],aux:['DE'],right:['ACB','AED'],caption:'DE параллельна BC. Сравни прилежащие к углу A катеты AE и AC.'},
      67:{pts:{A:[35,130],C:[245,130],B:[245,25]},segments:['AB','BC','CA'],right:['ACB'],caption:'Угол C прямой. Для угла A катет BC противолежащий, а для угла B он прилежащий.'},
      80:{pts:{O:[130,65],H:[130,105],X:[175,105],A:[130+Math.hypot(45,40),65]},segments:['OH','OX'],aux:['OA'],right:['OHX'],free:[[30,105,265,105]],circle:[130,65,Math.hypot(45,40)],caption:'OH — расстояние до прямой. Показан случай d < R. Точка X — одно из пересечений.'},
      98:{pts:{O:[40,125],A:[245,125],B:[165,30]},segments:['OA','OB'],aux:['AB'],arrows:['OA','OB'],caption:'OA и OB — векторы u и v. Отрезок AB имеет длину |u − v|.'},
      112:{pts:{A:[35,125],C:[265,125],B:[107,29],D:[155,125]},segments:['AB','BC','CA'],aux:['BD'],caption:'D лежит на AC. Отрезки AB и AD равны, поэтому можно сравнить углы при B и D.'},
      127:{pts:{A:[45,125],B:[220,125],C:[80,40],D:[190,40]},segments:['AB','AC','BC'],aux:['AD','BD'],free:[[25,40,265,40]],caption:'Общее основание AB. Вершины C и D лежат на одной параллельной прямой.'},
    };
    const line=(a,b,attr='')=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" ${attr}/>`;
    function square(vertex,a,b,size=9){
      const asPoint=([x,y])=>({x,y});
      const corners=rightAngleCorner(asPoint(vertex),asPoint(a),asPoint(b),size);
      return corners?'<polyline fill="none" stroke="#196a56" points="'+corners.map(p=>[p.x,p.y].join(',')).join(' ')+'"/>':'';
    }
    let diagram='',caption='';
    if(topic===131){
      const center=[146,76],vertices=Array.from({length:8},(_,i)=>[center[0]+62*Math.cos(i*Math.PI/4),center[1]+62*Math.sin(i*Math.PI/4)]);
      const a=vertices[0],b=vertices[1],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
      diagram=`<circle cx="146" cy="76" r="62" fill="none"/><polygon points="${vertices.map(p=>p.join(',')).join(' ')}" fill="#d8ede6"/>`+vertices.map(v=>line(center,v)).join('')+line(center,mid,'stroke="#b25816" stroke-width="3"')+square(mid,center,a,6)+'<text x="153" y="68">R</text><text x="166" y="100">h</text>';
      caption='Радиус R идёт к вершине, апофема h — к середине стороны правильного многоугольника.';
    }else{
      const f=figures[topic];
      if(!f)return '';
      caption=f.caption;
      if(f.circle)diagram+=`<circle cx="${f.circle[0]}" cy="${f.circle[1]}" r="${f.circle[2]}" fill="none"/>`;
      for(const [x,y,z,w] of f.free||[])diagram+=line([x,y],[z,w],'stroke="#65837d"');
      for(const seg of f.segments)diagram+=line(f.pts[seg[0]],f.pts[seg[1]],f.arrows?.includes(seg)?'marker-end="url(#vector-tip)"':'');
      for(const seg of f.aux||[])diagram+=line(f.pts[seg[0]],f.pts[seg[1]],'stroke-dasharray="5 3" stroke="#97501c"');
      for(const [a,vertex,b] of f.right||[])diagram+=square(f.pts[vertex],f.pts[a],f.pts[b]);
      for(const [k,[x,y]] of Object.entries(f.pts)){
        diagram+=`<circle cx="${x}" cy="${y}" r="2.8"/><text x="${x+(k==='H'?-14:4)}" y="${y+(y>=100?16:-6)}">${k}</text>`;
      }
    }
    return `<figure class="topic-proof-figure"><svg viewBox="0 0 300 150" role="img" aria-label="${caption}" style="width:100%;max-width:430px"><defs><marker id="vector-tip" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="#214f65"/></marker></defs><g stroke="#214f65" stroke-width="1.6" fill="#214f65" style="font:13px sans-serif"><style>.topic-proof-figure text{stroke:none;fill:#17344a}</style>${diagram}</g></svg><figcaption>${caption}</figcaption></figure>`;
  }
  let guideIndexRequest;
  function guideIndex() {
    if (root.PogorelovTopicGuideIndex) return Promise.resolve(root.PogorelovTopicGuideIndex);
    if (guideIndexRequest) return guideIndexRequest;
    guideIndexRequest = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '../assets/topic-guide-index.js';
      script.onload = () => resolve(root.PogorelovTopicGuideIndex);
      script.onerror = () => {
        guideIndexRequest = null;
        script.remove();
        reject(new Error('guide-index'));
      };
      document.head.append(script);
    });
    return guideIndexRequest;
  }

  async function mountGuide(board, topic) {
    let index;
    try { index = await guideIndex(); } catch { return; }
    const guide = index?.[topic];
    if (!guide || !board.isConnected) return;

    const details = document.createElement('details');
    details.dataset.pogorelovTopicGuide = String(topic);
    details.innerHTML = '<summary>Как выполнить опыт</summary><div class="topic-guide-body">' +
      '<h3></h3><figure><img width="672" height="700" alt=""><figcaption aria-live="polite" aria-atomic="true">' +
      '<small data-guide-position></small><p data-guide-caption></p><p data-guide-readout></p></figcaption></figure>' +
      '<div class="topic-guide-controls"><button type="button" data-guide-prev>← Назад</button>' +
      '<button type="button" data-guide-next>Дальше →</button>' +
      '<button type="button" data-guide-play aria-pressed="false">Смотреть анимацию</button></div>' +
      '<p class="muted" data-guide-error role="status" hidden></p></div>';
    details.querySelector('h3').textContent = guide.title;
    const img = details.querySelector('img');
    const position = details.querySelector('[data-guide-position]');
    const caption = details.querySelector('[data-guide-caption]');
    const readout = details.querySelector('[data-guide-readout]');
    const previous = details.querySelector('[data-guide-prev]');
    const next = details.querySelector('[data-guide-next]');
    const play = details.querySelector('[data-guide-play]');
    const error = details.querySelector('[data-guide-error]');
    const base = '../../assets/geometry-experiment-gifs/' + guide.id;
    let step = 0;
    let playing = false;
    function draw() {
      error.hidden = true;
      img.hidden = false;
      img.src = playing ? base + '.gif' : base + '-' + String(step + 1).padStart(2, '0') + '.png';
      position.textContent = playing ? 'Анимация' : 'Шаг ' + (step + 1) + ' из ' + guide.steps.length;
      caption.textContent = playing ? guide.title : guide.steps[step];
      readout.textContent = playing ? '' : guide.readouts[step];
      readout.hidden = !readout.textContent;
      previous.disabled = playing || step === 0;
      next.disabled = playing || step === guide.steps.length - 1;
      play.textContent = playing ? 'Остановить анимацию' : 'Смотреть анимацию';
      play.setAttribute('aria-pressed', String(playing));
    }
    details.addEventListener('toggle', () => {
      playing = false;
      if (details.open) draw();
      else {
        img.removeAttribute('src');
        play.setAttribute('aria-pressed', 'false');
      }
    });
    previous.onclick = () => { step--; draw(); };
    next.onclick = () => { step++; draw(); };
    play.onclick = () => { playing = !playing; draw(); };
    img.onerror = () => {
      if (!details.open || !img.hasAttribute('src')) return;
      const failedAnimation = playing;
      if (failedAnimation) { playing = false; draw(); }
      else img.hidden = true;
      error.textContent = failedAnimation ? 'Анимация не загрузилась. Можно пройти опыт по шагам.' :
        'Изображение не загрузилось. Действие для этого шага описано выше.';
      error.hidden = false;
    };
    board.before(details);
  }
  root.PogorelovTopicLabs={scene,measure,proofFigure,paint,mountGuide};
})(typeof window!=='undefined'?window:globalThis);
