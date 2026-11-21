(function(){
  'use strict';
  const course=window.MathExamTopicEdition,previous=course.figure;
  const esc=t=>String(t).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const txt=(x,y,t,anchor='start',size=11)=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" font-size="'+size+'">'+esc(t)+'</text>';
  const poly=pts=>'<polygon points="'+pts.map(p=>p.join(',')).join(' ')+'" stroke="#286454" stroke-width="2" fill="#d6e9e2"/>';
  function geometry({kind,a,b,c,d}){
    const W=210,H=72,x=30,y=14,px=v=>x+W*v/a,py=v=>y+H*v/b;
    let out='';
    if(kind==='19-1'){
      const X=px(c),Y=py(b-d);
      out+=poly([[x,y],[X,y],[X,Y],[x+W,Y],[x+W,y+H],[x,y+H]])+txt(x+W/2,107,'a = '+a,'middle')+txt(3,54,'b='+b)+txt((x+X)/2,11,'c='+c,'middle')+txt(244,Y+9,'d='+d);
    }else if(kind==='19-2'){
      const width=180,h=c+b,scale=Math.min(width/d,72/h),X=130-d*scale/2,top=17,mid=top+c*scale,bot=top+h*scale,L=130-a*scale/2,R=130+a*scale/2;
      out+=poly([[X,top],[X+d*scale,top],[X+d*scale,mid],[R,mid],[R,bot],[L,bot],[L,mid],[X,mid]])+txt(130,12,'d = '+d,'middle')+txt(130,bot+16,'a = '+a,'middle')+txt(R+6,(mid+bot)/2,'b='+b)+txt(X-5,mid,'c='+c,'end');
    }else if(kind==='19-3'){
      const scale=Math.min(210/a,70/b),X=36,Y=16,r=d*scale/2,C=c*scale,L=a*scale,B=b*scale;
      let path='M'+X+' '+Y+'h'+C+'a'+r+' '+r+' 0 0 0 '+(2*r)+' 0h'+C+'a'+r+' '+r+' 0 0 0 '+(2*r)+' 0h'+C+'v'+B+'h-'+L+'z';
      out+='<path d="'+path+'" stroke="#286454" stroke-width="2" fill="#d6e9e2"/>'+txt(X+C/2,Y-3,'c','middle')+txt(X+C+r,Y+Math.max(r,9)+12,'d','middle')+txt(X-5,Y+B/2,'b='+b,'end')+txt(X+L/2,Y+B+15,'a = 3c + 2d','middle');
    }else if(kind==='20-1'){
      const ww=200,hh=72,X=36,Y=15,ledge=ww*c/a,notch=ww*(a-4*c)/(3*a),depth=hh*d/b,points=[[X,Y]];let u=X;
      for(let i=0;i<4;i++){u+=ledge;points.push([u,Y]);if(i<3){points.push([u,Y+depth]);u+=notch;points.push([u,Y+depth],[u,Y]);}}
      points.push([X+ww,Y+hh],[X,Y+hh]);out+=poly(points)+txt(X+ledge/2,12,'c','middle')+txt(X+ledge+notch/2,Y+depth+13,'d','middle')+txt(X-5,Y+hh/2,'b='+b,'end')+txt(X+ww/2,Y+hh+16,'a = '+a,'middle');
    }else{
      const h=2*b+c,scale=Math.min(165/a,74/h),X=127-a*scale/2,Y=16,B=b*scale,R=c*scale/2,W0=a*scale;
      const path='M'+X+' '+Y+'h'+W0+'v'+B+'a'+R+' '+R+' 0 0 1 0 '+(2*R)+'v'+B+'h-'+(W0/2-R)+'a'+R+' '+R+' 0 0 0 -'+(2*R)+' 0h-'+(W0/2-R)+'v-'+B+'a'+R+' '+R+' 0 0 1 0 -'+(2*R)+'z';
      out+='<path d="'+path+'" stroke="#286454" stroke-width="2" fill="#d6e9e2"/>'+txt(127,Y-4,'a = '+a,'middle')+txt(X-4,Y+B*.6,'b','end')+txt(X-R-4,Y+B+R+4,'c='+c,'end')+txt(127,Y+h*scale+14,'c','middle');
    }
    return out;
  }
  course.figure=d=>{
    if(typeof d.chart!=='string'||!d.chart.startsWith('merzlyak-letter-'))return previous(d);
    const m=d.plot,kind=d.chart.slice('merzlyak-letter-'.length);
    const titles={geometry:'Контур фигуры с размерами, выступами и выемками',steps:'Три величины и их знаки на общей шкале',motion:'Движение навстречу или вдогонку',structure:'Переменные и допустимость знаменателя',residues:'Классы остатков и пара совпадающих остатков'};
    let s='';
    if(kind==='geometry')s=geometry(m);
    if(kind==='steps'){
      const max=Math.max(1,...m.items.map(Math.abs)),cx=130;
      s+='<path d="M130 9V99" stroke="#728076"/>';
      m.items.forEach((v,i)=>{const y=21+29*i,len=Math.abs(v)*72/max,x=v<0?cx-len:cx;
        s+=txt(5,y+4,'шаг '+(i+1))+'<rect x="'+x+'" y="'+(y-5)+'" width="'+len+'" height="10" fill="'+(v<0?'#ad7082':'#42836c')+'"/>'+txt(215,y+4,Number(v.toPrecision(5)));});
    }else if(kind==='motion'){
      const arrow=(x1,x2,y,label)=>'<path d="M'+x1+' '+y+'H'+x2+'" stroke="#3b7762" stroke-width="3"/>'+poly([[x2,y],[x2-7*Math.sign(x2-x1),y-4],[x2-7*Math.sign(x2-x1),y+4]])+txt((x1+x2)/2,y-9,label,'middle');
      s+=arrow(29,102,39,m.catchup?m.u+' км/ч':m.v+' км/ч')+arrow(m.catchup?157:235,m.catchup?219:157,65,m.catchup?m.v+' км/ч':m.u+' км/ч')+txt(137,99,'сначала между ними '+m.dist+' км','middle');
    }else if(kind==='structure'){
      s+=txt(139,26,m.formula,'middle',16)+txt(139,58,'последнее действие — '+m.role,'middle');
      s+=txt(139,87,m.den.length?'знаменатель с буквой: '+m.den.join(', '):'переменных в знаменателе нет','middle');
    }else if(kind==='residues'){
      const w=237/m.mod;
      for(let i=0;i<m.mod;i++){const x=13+i*w,arr=m.list.filter(n=>n%m.mod===i);s+='<rect x="'+x+'" y="12" width="'+(w-3)+'" height="77" rx="3" fill="'+(arr.length>1?'#c8e4d6':'#edf3ee')+'"/>'+txt(x+w/2-1,31,'r='+i,'middle',10);arr.forEach((v,j)=>s+=txt(x+w/2-1,52+20*j,v,'middle'));}
      s+=txt(137,108,'в одной ячейке одинаковые остатки','middle');
    }
    return '<svg viewBox="0 0 280 118" role="img" aria-label="'+titles[kind]+'"><g font-family="sans-serif" fill="#214939">'+s+'</g></svg>';
  };
})();
