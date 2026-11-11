"use strict";
const fs = require("fs");
const path = require("path");
const {create} = require("./series-runtime");
const parts = [
  require("./series-arithmetic"),
  require("./series-equations"),
  require("./series-functions"),
  require("./series-exam-bridges")
];
if(fs.existsSync(path.join(__dirname,"series-foundation-bridges.js")))parts.push(require("./series-foundation-bridges"));
const course = JSON.parse(fs.readFileSync(path.join(__dirname, "course-data.json"), "utf8"));
parts.push({routes:course.routes||[],tasks:course.topics.flatMap(topic=>[
  ...topic.quick.map(task=>({...task,topicId:topic.id,learningMode:"quick"})),
  ...topic.creative.map(task=>({...task,topicId:topic.id,learningMode:"creative"}))
])});
const registry = create(parts);
const catalog = {
  version: 3,
  scope: "Авторские серии по основам, отдельным навыкам №6–19 и переходу к обычным задачам",
  limits: [
    "Количество seed не означает столько же разных математических ситуаций.",
    "Один правильный ответ не подтверждает полное владение темой.",
    "Полное покрытие официального банка не заявляется."
  ],
  families: registry.families.map(f => ({
    id: f.id, topicId: f.topicId, title: f.title, goal: f.goal,
    skillId: f.skillId, mode: f.mode, sample: registry.task(f.id, 37)
  })),
  routes: registry.routes
};
fs.writeFileSync(path.join(__dirname, "series-catalog.json"), JSON.stringify(catalog, null, 2)+"\n", "utf8");
console.log(JSON.stringify({families:catalog.families.length,routes:catalog.routes.length}));
