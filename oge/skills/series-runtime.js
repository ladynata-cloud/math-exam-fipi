(function () {
  "use strict";
  var MAX_SEEDS = 1000;
  function seedValue(value) {
    var n = Number(value);
    if (!Number.isFinite(n)) n = 0;
    return ((Math.trunc(n) % MAX_SEEDS) + MAX_SEEDS) % MAX_SEEDS;
  }
  function canonical(value) {
    if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
    if (value && typeof value === "object") {
      return "{" + Object.keys(value).sort().filter(function (key) {
        return value[key] !== undefined;
      }).map(function (key) {
        return JSON.stringify(key) + ":" + canonical(value[key]);
      }).join(",") + "}";
    }
    return JSON.stringify(value);
  }
  function mathematicalVisual(value){
    if(Array.isArray(value))return value.map(mathematicalVisual);
    if(value&&typeof value==="object"){
      var result={};Object.keys(value).forEach(function(key){
        if(["label","ariaLabel","id"].indexOf(key)<0)result[key]=mathematicalVisual(value[key]);
      });return result;
    }
    return value;
  }
  function sorted(values){return values.slice().sort(function(a,b){return canonical(a).localeCompare(canonical(b));});}
  function signature(task) {
    var copy = {};
    [
      "type", "prompt", "answer", "unit", "options", "matchOptions", "fields", "conditions",
      "constants", "field", "left", "right", "domain", "counterexampleWhen", "pairs", "items",
      "a", "b", "k", "points", "min", "max", "sideA", "sideB", "base",
      "height", "numeratorA", "denominatorA", "numeratorB", "denominatorB",
      "total", "numerator", "denominator", "table", "visual",
      "models", "known", "probeValues", "secretModelId", "variable", "requireDistinguishingProbe"
    ].forEach(function (key) {
      if (task[key] !== undefined) copy[key] = task[key];
    });
    // Editorial changes must not turn the same mathematics into new evidence.
    if (task.identityPrompt !== undefined) copy.prompt = task.identityPrompt;
    if(copy.visual)copy.visual=mathematicalVisual(copy.visual);
    if(task.options&&task.options.every(function(option){return typeof option.claimId==="string";})){
      copy.options=task.options.map(function(option){return Object.assign({},option,{text:option.text.replace(/^\d+\.\s*/,"")});});
    }
    if(task.visual&&task.visual.kind==="intervals"){
      copy.visual.rows=sorted(copy.visual.rows);
      copy.options=task.visual.rows.map(function(row,index){
        return {segments:sorted(row.segments),correct:!!task.options[index].correct};
      });
    }
    if(task.type==="match"&&task.visual&&task.visual.kind==="graphs"){
      copy.pairs=task.pairs.map(function(pair){
        var plot=task.visual.plots.find(function(v){return v.label===pair.left;});
        return {graph:mathematicalVisual(plot),right:pair.right};
      });
      copy.visual.plots=sorted(copy.visual.plots);
    }
    ["options", "matchOptions", "pairs", "items"].forEach(function (key) {
      if (Array.isArray(copy[key])) {
        copy[key] = copy[key].slice().sort(function (a, b) {
          return canonical(a).localeCompare(canonical(b));
        });
      }
    });
    return canonical(copy);
  }
  function hash(text) {
    var first = 2166136261, second = 2246822519;
    for (var i = 0; i < text.length; i++) {
      first = Math.imul(first ^ text.charCodeAt(i), 16777619);
      second = Math.imul(second ^ text.charCodeAt(i), 3266489917);
    }
    return (first >>> 0).toString(16).padStart(8, "0") +
      (second >>> 0).toString(16).padStart(8, "0");
  }
  function create(parts) {
    var families = [], routes = [], familyIndex = {}, routeIndex = {}, taskIndex = {};
    (parts || []).forEach(function (part) {
      (part.tasks || []).forEach(function (fixed) {
        if (!fixed.id || taskIndex[fixed.id]) throw new Error("Duplicate or missing fixed task id.");
        taskIndex[fixed.id] = fixed;
      });
      (part.families || []).forEach(function (family) {
        if (!family.id || familyIndex[family.id]) throw new Error("Duplicate or missing family id.");
        if (typeof family.generate !== "function") throw new Error("Missing task generator: " + family.id);
        familyIndex[family.id] = family; families.push(family);
      });
      (part.routes || []).forEach(function (route) {
        if (!route.id || routeIndex[route.id]) throw new Error("Duplicate or missing route id.");
        routeIndex[route.id] = route; routes.push(route);
      });
    });
    routes.forEach(function (route) {
      if (!Array.isArray(route.steps) || !route.steps.length || route.steps.length > 12)
        throw new Error("A route needs one to twelve steps: " + route.id);
      route.steps.forEach(function (step) {
        if (step.taskId) {
          if (step.familyId || !taskIndex[step.taskId]) throw new Error("Unknown fixed task in route: " + step.taskId);
          if (step.optional !== (taskIndex[step.taskId].learningMode === "creative")) throw new Error("Only workshops may be optional: " + route.id);
        } else if (!familyIndex[step.familyId]) throw new Error("Unknown family in route: " + step.familyId);
        if(step.variants!==undefined&&(!Array.isArray(step.variants)||!step.variants.length||step.variants.some(function(v){return typeof v!=="string";})))throw new Error("Invalid variant selection in route: "+route.id);
      });
    });
    function task(familyId, seed) {
      var family = familyIndex[familyId];
      if (!family) throw new Error("Unknown family: " + familyId);
      var normalized = seedValue(seed);
      var result = JSON.parse(JSON.stringify(family.generate(normalized)));
      result.skillId = result.skillId || family.skillId;
      result.title = result.title || family.title;
      result.id = family.id + "-" + hash(signature(result));
      result.presentationId=hash(canonical({options:result.options,pairs:result.pairs,matchOptions:result.matchOptions,items:result.items,visual:result.visual,fields:result.fields}));
      result.familyId = family.id;
      result.variantSeed = normalized;
      result.topicId = family.topicId;
      result.learningMode = family.mode;
      return result;
    }
    function next(familyId, start, seen, variants) {
      var excluded = new Set(seen || []),fallback=null;
      for (var offset = 0; offset < MAX_SEEDS; offset++) {
        var candidate = task(familyId, seedValue(start + offset));
        if(variants&&variants.indexOf(candidate.variant)<0)continue;
        if(!fallback)fallback=candidate;
        if (!excluded.has(candidate.id)) return {task: candidate, fresh: true};
      }
      if(!fallback)throw new Error("No task matches the selected mathematical cases: "+familyId);
      return {task: fallback, fresh: false};
    }
    function start(routeId, initialSeed, seen) {
      var route = routeIndex[routeId];
      if (!route) throw new Error("Unknown route: " + routeId);
      var excluded = (seen || []).slice(), refs = [], fresh = true;
      route.steps.forEach(function (step, index) {
        if (step.taskId) {
          var fixed = taskIndex[step.taskId];
          refs.push({taskId:fixed.id,signature:hash(signature(fixed)),label:step.label||fixed.title});
          fresh = fresh && excluded.indexOf(fixed.id) < 0;
          excluded.push(fixed.id);
          return;
        }
        var result = next(step.familyId, seedValue(initialSeed + index * 37), excluded,step.variants);
        refs.push({familyId: step.familyId, seed: result.task.variantSeed, taskId: result.task.id, label: step.label || result.task.title});
        excluded.push(result.task.id);
        fresh = fresh && result.fresh;
      });
      return {routeId: route.id, topicId: route.topicId, title: route.title, goal: route.goal,
        refs: refs, cursor: 0, fresh: fresh};
    }
    function single(familyId, initialSeed, seen) {
      var family = familyIndex[familyId], result = next(familyId, initialSeed, seen);
      return {routeId: "family:" + familyId, topicId: family.topicId,
        title: family.title, goal: family.goal, cursor: 0, fresh: result.fresh,
        refs: [{familyId: familyId, seed: result.task.variantSeed, taskId: result.task.id, label: family.title}]};
    }
    function singleTask(taskId,seen) {
      var fixed=taskIndex[taskId];
      if(!fixed)throw new Error("Unknown fixed task: "+taskId);
      return {routeId:"task:"+taskId,topicId:fixed.topicId,title:fixed.title,
        goal:"Одна выбранная задача. Можно завершить работу после неё.",cursor:0,
        fresh:(seen||[]).indexOf(taskId)<0,
        refs:[{taskId:taskId,signature:hash(signature(fixed)),label:fixed.title}]};
    }
    function materialize(run) {
      if (!run || !Array.isArray(run.refs) || !run.refs.length || run.refs.length > 12)
        throw new Error("Invalid saved series.");
      return run.refs.map(function (ref) {
        if (!ref.familyId) {
          var fixed = taskIndex[ref.taskId];
          if (!fixed || ref.signature !== hash(signature(fixed))) throw new Error("Saved fixed task content has changed.");
          return JSON.parse(JSON.stringify(fixed));
        }
        var result = task(ref.familyId, ref.seed);
        if (ref.taskId !== result.id) throw new Error("Saved series content has changed.");
        return result;
      });
    }
    return {families: families, routes: routes, familyIndex: familyIndex, taskIndex:taskIndex,
      routeIndex: routeIndex, task: task, next: next, start: start, single: single, singleTask:singleTask,
      materialize: materialize, signature: signature, maxSeeds: MAX_SEEDS};
  }
  var api = {create: create, signature: signature, hash: hash, seedValue: seedValue};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") {
    var parts=(window.OGE_SERIES_PARTS||[]).slice(),data=window.OGE_DATA;
    if(data)parts.push({routes:data.routes||[],tasks:(data.topics||[]).reduce(function(all,topic){
      return all.concat((topic.quick||[]).map(function(t){return Object.assign({},t,{topicId:topic.id,learningMode:"quick"});}),
        (topic.creative||[]).map(function(t){return Object.assign({},t,{topicId:topic.id,learningMode:"creative"});}));
    },[])});
    window.OGE_SERIES=create(parts);
  }
}());
