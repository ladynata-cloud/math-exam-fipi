'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ROOT = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'trainers/trainer-board.html'), 'utf8');
const origin = 'https://mathexam.space';
function part(start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from + start.length);
  assert(from >= 0 && to > from, start); return source.slice(from, to);
}
function fixture(id) {
  const file = 'trainers/' + id + '.html', key = id === 'ege-profile-circle' ? '__profileCircleBoard' : '__profileLogTrigBoard';
  const route = id === 'ege-profile-circle' ? '#task/prep-negative/guided' : '#practice/expr-logarithms/guided';
  const selected = {route, progress:{taskId:'second-selected-task',draft:'private synthetic draft'}, view:{hintOpen:true}};
  const child = {location:new URL(origin + '/' + file + '?child-only=omit' + route),[key]:{getState:()=>selected,validateState:value=>value === selected}};
  const entry = {trainerId:id,file,trainerVersion:'1.0.0',protocolVersion:1,stateSchemaVersion:1,allowLegacyHtml:false};
  const p = vm.createContext({window:{},location:new URL(origin + '/trainers/trainer-board.html'),URL,TextEncoder,
    frame:{contentWindow:child},state:{trainerUrl:'/' + file + '?from=cabinet&note=%2B+%26#lesson/old'},
    shared:{role:'teacher',roomId:'new-room',connected:true,control:'teacher',me:{participantId:'teacher'}},
    trainerRegistry:{status:'ready',server:'https://room.example',byId:new Map([[id,entry]]),byFile:new Map([[file,entry]])},
    setMirrorStatus(){}
  });
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'trainers/board-picker.js'), 'utf8'),p);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'trainers/board-bridge.js'), 'utf8'),p);
  p.MathExamBoard=p.window.MathExamBoard;p.normalizeTrainer=p.window.BoardPicker.normalize;
  vm.runInContext([
    part('const TRAINER_PATH_LIMITS=', 'const trainerRegistry='),
    part('function unsafePathText(', 'function validateTrainerRegistryResponse('),
    part('function mirrorEntryFromPayload(', 'function trustedTrainerOrigin('),
    part('function canWrite(){', 'function readonly(){'),
    part('function addBoardSeedToTrainerUrl(', 'function compatLabel('),
    part('function bridgeStateFromPayload(', 'function requestTrainerState('),
    part('async function createRoom(){','async function connectRoom(){')
  ].join('\n'),p);
  return {p,child,selected,key,entry,route,file};
}
for (const id of ['ege-profile-log-trig','ege-profile-circle']) {
  test(id + ': actual room handler carries an immutable validated selection separately from URL and credentials', async () => {
    const {p,selected,route,file}=fixture(id), navigations=[],settings=[];
    Object.assign(p,{serverUrl:{value:'https://room.example'},trainerUrl:{},studentLink:{},roomBadge:{},DEFAULT_SERVER:'https://room.example',SERVER_KEY:'server',
      normalizeServer:value=>value,loadTrainerRegistry:async()=>{},setStatus(){},saveTeacherRoomSession(){},replaceTeacherRoomUrl(){},setControlState(){},setParticipants(){},
      setTrainerFrameSrc:value=>navigations.push(value),save(){},makeStudentLink:()=> 'synthetic-invitation',updateControlUi(){},
      localStorage:{setItem:(key,value)=>settings.push([key,value])},fetch:async()=>({ok:true,json:async()=>({roomId:'fresh-room',teacherToken:'teacher-fixture',studentToken:'student-fixture'})}),connectRoom:async()=>{}
    });
    await p.createRoom();
    assert.equal(navigations.length,1);
    const url=new URL(navigations[0],origin);
    assert.equal(url.pathname,'/'+file);assert.equal(url.hash,route);
    assert.deepEqual([...url.searchParams],[['from','cabinet'],['note','+ &'],['seed','fresh-room']]);
    const prepared=p.shared.preparedProfileTrainer;
    assert.equal(prepared.roomId,'fresh-room');assert.equal(prepared.payload.state.progress.draft,'private synthetic draft');
    selected.progress.draft='later local mutation';assert.equal(prepared.payload.state.progress.draft,'private synthetic draft','detached captured state');
    assert.equal(navigations[0].includes('private'),false);assert.equal(navigations[0].includes('child-only'),false);
    assert.deepEqual(settings,[['server','https://room.example']]);
    assert.equal(p.takePreparedProfileTrainer(null),prepared.payload,'first authenticated empty join may seed');
    assert.equal(p.takePreparedProfileTrainer(null),null,'second join cannot reuse old work');
  });
  test(id + ': existing rooms, reconnects and another controller cannot consume the prepared snapshot', () => {
    const {p}=fixture(id);
    const make=()=>({roomId:p.shared.roomId,...p.prepareProfileTrainerForRoom(p.state.trainerUrl)});
    p.shared.preparedProfileTrainer=make();assert.equal(p.takePreparedProfileTrainer({latestTrainerState:null}),null,'existing authoritative room wins even if empty trainer');
    p.shared.preparedProfileTrainer=make();p.shared.preparedProfileTrainer.roomId='old-room';assert.equal(p.takePreparedProfileTrainer(null),null);
    p.shared.preparedProfileTrainer=make();p.shared.control='student';assert.equal(p.takePreparedProfileTrainer(null),null);p.shared.control='teacher';
    p.shared.preparedProfileTrainer=make();p.shared.role='student';assert.equal(p.takePreparedProfileTrainer(null),null);p.shared.role='teacher';
    p.shared.preparedProfileTrainer=make();p.trainerRegistry.status='failed';assert.equal(p.takePreparedProfileTrainer(null),null,'registry still authorizes transfer');
  });
  test(id + ': foreign, mismatched, unregistered, invalid and oversized frame state never enters a room', () => {
    for (const change of [
      f=>{f.child.location=new URL('https://other.example/'+f.file+f.route);},
      f=>{f.child.location=new URL(origin+'/trainers/other.html'+f.route);},
      f=>{f.child.location.hash='#lesson/different';},
      f=>{f.child[f.key].validateState=()=>false;},
      f=>{delete f.child[f.key];},
      f=>{f.p.trainerRegistry.status='pending';},
      f=>{f.selected.progress.draft='<script>bad</script>';},
      f=>{f.selected.progress.draft='x'.repeat(65536);}
    ]) {const f=fixture(id);change(f);assert.equal(f.p.prepareProfileTrainerForRoom(f.p.state.trainerUrl),null);}
    const {p}=fixture(id);
    for(const url of ['/trainers/ege-profile-log-trig%2ehtml','/trainers/../trainers/'+id+'.html','https://other.example/trainers/'+id+'.html','/ege-profil/start/index.html#home','/trainers/negative-numbers-line.html'])assert.equal(p.prepareProfileTrainerForRoom(url),null,url);
  });
}
