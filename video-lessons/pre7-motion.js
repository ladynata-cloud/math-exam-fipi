/* Fixed authored diagrams for early foundations. Progress is deterministic so
 * exactly the same construction is used in the step reader and stored MP4. */
(function(root){
  'use strict';
  const NS='http://www.w3.org/2000/svg',ink='#19313d',blue='#2159c9',green='#237d68',orange='#b05e23';
  const clamp=x=>Math.max(0,Math.min(1,Number(x)||0));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  function el(tag,attrs={},text){const node=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))node.setAttribute(k,String(v));if(text!==undefined)node.textContent=text;return node;}
  function mount(host,spec){
    const svg=el('svg',{viewBox:'0 0 640 230',class:'motion-diagram',role:'img','aria-label':spec.caption}),animated=[];
    const add=(tag,attrs,text)=>{const e=el(tag,attrs,text);svg.append(e);return e;};
    const label=(x,y,text,color=ink,size=24)=>add('text',{x,y,'text-anchor':'middle','font-size':size,'font-weight':700,fill:color},text);
    const line=(x1,y1,x2,y2,color=ink,width=3)=>add('line',{x1,y1,x2,y2,stroke:color,'stroke-width':width,'stroke-linecap':'round'});
    const appear=(node,at=0,duration=.5)=>animated.push(p=>node.style.opacity=String(smooth((p-at)/duration)));
    const draw=(node,at=0,duration=.65)=>animated.push(p=>{const len=node.getTotalLength();node.style.strokeDasharray=String(len);node.style.strokeDashoffset=String(len*(1-smooth((p-at)/duration)));});
    if(spec.kind==='fractions'){
      if(!Array.isArray(spec.fractions)||spec.fractions.length<1||spec.fractions.length>2||spec.fractions.some(([n,d])=>!Number.isInteger(n)||!Number.isInteger(d)||d<1||d>20||n<0||n>d))throw new Error('Invalid authored fraction strips');
      spec.fractions.forEach(([n,d],row)=>{const y=spec.fractions.length===1?80:40+row*90,w=480/d;
        for(let i=0;i<d;i++){add('rect',{x:70+i*w,y,width:w,height:45,fill:'#fff',stroke:'#96aab4','stroke-width':1.5});if(i<n){const cell=add('rect',{x:70+i*w+1.5,y:y+1.5,width:w-3,height:42,fill:row?green:blue});appear(cell,.08+i/(Math.max(n,1))* .55,.25);}}
        const text=label(310,y+74,spec.labels?.[row]||`${n}/${d}`,row?green:blue);appear(text,.6,.35);
      });
    }else if(spec.kind==='fraction-line'){
      const {numerator:n,denominator:d}=spec;
      if(!Number.isInteger(n)||!Number.isInteger(d)||n<1||d<2||d>10||n>2*d)throw new Error('Invalid authored fraction line');
      const units=Math.ceil(n/d),total=units*d,x=i=>55+i/total*520,y=137;
      line(42,y,592,y,'#718995',2);
      for(let i=0;i<=total;i++){line(x(i),y-8,x(i),y+8,'#718995',2);if(i%d===0)label(x(i),y+38,String(i/d));}
      const route=line(x(0),y-24,x(n),y-24,blue,5);draw(route,0,.8);
      const dot=add('circle',{cx:x(0),cy:y,r:8,fill:blue});animated.push(p=>dot.setAttribute('cx',x(n*smooth(p))));
      const mark=label(x(n),y-53,`${n}/${d}`,blue);appear(mark,.65,.35);
      label(320,218,`Один шаг — 1/${d}`,ink,22);
    }else if(spec.kind==='scale'){
      const {start,end,divisions:n,at}=spec;
      if(![start,end].every(Number.isFinite)||end<=start||!Number.isInteger(n)||n<1||n>20||!Number.isInteger(at)||at<0||at>n)throw new Error('Invalid authored scale');
      const x=i=>55+i/n*530,y=146;
      line(45,y,598,y,'#718995',2);
      for(let i=0;i<=n;i++){const tick=line(x(i),y-14,x(i),y+10,'#718995',2);appear(tick,i/(n+1)*.3,.3);}
      label(x(0),y+43,String(start));label(x(n),y+43,String(end));
      const route=line(x(0),y-36,x(at),y-36,blue,5);draw(route,.15,.7);
      const dot=add('circle',{cx:x(at),cy:y,r:7,fill:orange});appear(dot,.65,.35);
      label(320,45,`${n} равных промежутков`,ink,26);
    }else if(spec.kind==='bars'){
      if(!Array.isArray(spec.values)||spec.values.length!==2||!spec.values.every(n=>Number.isFinite(n)&&n>0))throw new Error('Invalid authored comparison bars');
      const max=Math.max(...spec.values);
      spec.values.forEach((n,i)=>{const y=45+i*85,w=490*n/max;add('rect',{x:55,y,width:w,height:43,fill:'#f0f5f7',stroke:'#bacad1'});const bar=add('rect',{x:55,y,width:0,height:43,fill:i?green:blue});animated.push(p=>bar.setAttribute('width',w*smooth((p-i*.12)/.75)));const t=label(55+w/2,y+30,spec.labels?.[i]||String(n),'#fff',25);appear(t,.65,.35);});
    }else if(spec.kind==='boundary'){
      const sides=spec.sides;if(!Array.isArray(sides)||![3,4].includes(sides.length))throw new Error('Invalid boundary');
      const pts=sides.length===4?[[115,45],[525,45],[525,173],[115,173]]:[[315,28],[532,173],[100,173]];
      const positions=sides.length===4?[[320,30],[568,115],[320,207],[69,115]]:[[460,87],[317,207],[173,85]];
      pts.forEach((a,i)=>{const b=pts[(i+1)%pts.length];line(a[0],a[1],b[0],b[1],'#bccdd4',2);const edge=line(a[0],a[1],b[0],b[1],i%2?orange:blue,5);draw(edge,i/sides.length*.65,.32);const text=label(...positions[i],String(sides[i]),i%2?orange:blue,26);appear(text,i/sides.length*.65+.1,.3);});
    }else if(spec.kind==='grid'){
      const {cols,rows,cut=0}=spec;if(!Number.isInteger(cols)||!Number.isInteger(rows)||cols<1||rows<1||cols>10||rows>6||!Number.isInteger(cut)||cut<0||cut>=Math.min(cols,rows))throw new Error('Invalid authored area grid');
      const size=Math.min(510/cols,160/rows),left=320-cols*size/2,top=24,total=rows*cols;let order=0;
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const absent=r<cut&&c>=cols-cut;add('rect',{x:left+c*size,y:top+r*size,width:size,height:size,fill:absent?'#fff':'#edf5f2',stroke:absent?'#c7d0d4':'#91a5b1','stroke-width':1.5,...absent?{'stroke-dasharray':'4 3'}:{}});if(!absent){const square=add('rect',{x:left+c*size+2,y:top+r*size+2,width:size-4,height:size-4,fill:green});appear(square,.05+order++/total*.6,.25);}}
      label(320,215,cut?'Пунктирный угол вырезан':'Считаем клетки внутри фигуры',ink,23);
    }else throw new Error('Unknown authored foundation diagram');
    host.append(svg);const caption=document.createElement('p');caption.className='motion-caption';caption.textContent=spec.caption;host.append(caption);
    return progress=>{const p=clamp(progress);for(const animate of animated)animate(p);svg.dataset.progress=String(p);};
  }
  root.MathExamPre7Motion=Object.freeze({mount});
})(typeof window==='undefined'?globalThis:window);
