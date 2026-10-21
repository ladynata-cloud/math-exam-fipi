/* Verified textbook passage links. Explanations are authored for this trainer. */
(function(root,factory){
  const api=factory(()=>root.Task19TextbookData);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.Task19TextbookReference=api;
})(typeof window==='object'?window:globalThis,function(getData){
  'use strict';
  const LABEL='Для ценителей строгости и точности';
  function sourceURL(value){
    try{const url=new URL(value);return url.protocol==='https:'?url.href:null;}
    catch(_){return null;}
  }
  function excerptURL(value){
    return typeof value==='string'&&(/^\/trainers\/task19-(?:reference|textbook)\/[a-z0-9_-]+\.(?:png|jpg|jpeg)$/i.test(value)||/^data:image\/(?:png|jpeg);base64,[a-z0-9+/=\s]+$/i.test(value))?value:null;
  }
  function forCard(card,data=getData()){
    const ids=data?.cards?.[card?.id];
    if(!Array.isArray(ids))return [];
    return [...new Set(ids)].map(id=>({id,...data.topics?.[id]})).filter(topic=>
      typeof topic.title==='string'&&Array.isArray(topic.passages));
  }
  function mount(host,card,data=getData()){
    host.replaceChildren();
    if(!card)return;
    const d=host.ownerDocument,outer=d.createElement('details'),summary=d.createElement('summary');
    outer.className='t19-textbook';outer.dataset.cardId=card.id;
    summary.textContent=LABEL;outer.append(summary);
    const content=d.createElement('div');content.className='t19-textbook-content';outer.append(content);
    const paragraph=(text,className)=>{const p=d.createElement('p');p.textContent=text;if(className)p.className=className;return p;};
    const topics=forCard(card,data);
    if(!topics.length){
      content.append(paragraph('Ссылки на учебники для этого утверждения пока не удалось загрузить. Можно продолжить тренировку и открыть наглядную подсказку.'));
      host.append(outer);return;
    }
    content.append(paragraph('Пояснение ниже составлено для тренажёра. В учебнике по ссылке можно открыть указанное определение, теорему или задачу.','t19-textbook-note'));
    content.append(paragraph('Утверждение в задании не обязательно совпадает с формулировкой теоремы. Сравни их условия и вывод.','t19-textbook-note'));
    let linkCount=0;const notedBooks=new Set();
    for(const topic of topics){
      const section=d.createElement('section'),heading=d.createElement('h3');
      section.className='t19-textbook-topic';section.dataset.topicId=topic.id;
      heading.textContent=topic.title;section.append(heading);
      if(topic.explanation)section.append(paragraph(topic.explanation));
      const list=d.createElement('ul');list.className='t19-textbook-sources';
      for(const passage of topic.passages){
        const book=data.books?.[passage.bookId],url=sourceURL(passage.url);
        if(!book||!url)continue;
        const item=d.createElement('li'),a=d.createElement('a'),edition=d.createElement('span');
        a.href=url;a.target='_blank';a.rel='noopener noreferrer';
        a.textContent=[book.authors,book.title].filter(Boolean).join('. ')+
          (passage.section?' — '+passage.section:'')+
          (passage.printedPage?' · с. '+passage.printedPage:'');
        a.dataset.bookId=passage.bookId;
        a.setAttribute('aria-label',a.textContent+'. Открыть фрагмент учебника в новой вкладке.');
        item.append(a);edition.className='t19-textbook-edition';
        edition.textContent=[book.edition,'Откроется в новой вкладке'].filter(Boolean).join(' · ');
        item.append(edition);
        if(book.hostNote&&!notedBooks.has(passage.bookId)){
          const note=d.createElement('span');note.className='t19-textbook-edition';note.textContent=book.hostNote;item.append(note);notedBooks.add(passage.bookId);
        }
        const excerpt=passage.excerpt,imageURL=excerptURL(excerpt?.file);
        if(imageURL&&excerpt.alt&&Number.isFinite(excerpt.width)&&excerpt.width>0&&Number.isFinite(excerpt.height)&&excerpt.height>0){
          const figure=d.createElement('figure'),image=d.createElement('img'),caption=d.createElement('figcaption');
          figure.className='t19-textbook-excerpt';image.src=imageURL;image.alt=excerpt.alt;image.width=excerpt.width;image.height=excerpt.height;image.loading='lazy';
          caption.textContent='Фрагмент учебника';figure.append(image,caption);item.append(figure);
        }
        list.append(item);linkCount++;
      }
      if(list.children.length)section.append(list);
      content.append(section);
    }
    if(!linkCount)content.append(paragraph('Не удалось загрузить проверенные ссылки на учебники. Пояснение выше можно прочитать на этой странице.'));
    const close=d.createElement('button');close.type='button';close.className='t19-textbook-close';close.textContent='Свернуть пояснение';
    close.addEventListener('click',()=>{outer.open=false;summary.focus();});content.append(close);
    host.append(outer);
  }
  return {label:LABEL,forCard,mount};
});
