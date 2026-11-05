/* Presentation order only. Original lesson indices and progress keys stay stable. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MotionNavigation=api;
})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const order=Object.freeze([8,9,10,11,0,1,2,3,4,5,6,7]);
 const groups=Object.freeze([
  Object.freeze({title:'Сначала: движение по реке',indices:Object.freeze(order.slice(0,4))}),
  Object.freeze({title:'Путь, скорость и время',indices:Object.freeze(order.slice(4,8))}),
  Object.freeze({title:'Движение двух участников',indices:Object.freeze(order.slice(8))})
 ]);
 return Object.freeze({order,groups,first:order[0],position:index=>order.indexOf(index)+1,next:index=>order[order.indexOf(index)+1]??null,isRiver:index=>index>=8&&index<=11});
});
