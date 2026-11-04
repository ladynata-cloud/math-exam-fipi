import test from 'node:test';import assert from 'node:assert/strict';
import {COVERAGE,COVERAGE_EXAMPLES} from '../public/coverage.js';
import {listTopics,answerOffline} from '../src/tutor.js';
test('coverage describes every actual topic and all offered examples use supported deterministic mathematics',()=>{
 const topics=listTopics();assert.equal(topics.length,40);assert.deepEqual(Object.keys(COVERAGE).sort(),topics.map(t=>t.id).sort());
 for(const topic of topics){assert(COVERAGE[topic.id].length>60);const question=COVERAGE_EXAMPLES[topic.id]||topic.sample,result=answerOffline({topic:topic.id,question,mode:'explain'});assert.equal(result.verification,'deterministic',topic.id+': '+question);assert.equal(result.complete,true,topic.id);}
});
