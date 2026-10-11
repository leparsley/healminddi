import test from 'node:test';
import assert from 'node:assert/strict';
import {scales,scoreAnswers,resolveScale,severityFor} from '../app/assessment-data.ts';
import {papers} from '../app/research-data.ts';
test('age and concern route to the correct scale',()=>{
  assert.equal(resolveScale('under12','anxiety'),null);
  assert.equal(resolveScale('65plus','depression'),'GDS15');
  assert.equal(resolveScale('18-64','depression'),'PHQ9');
  assert.equal(resolveScale('12-17','anxiety'),'GAD7');
});
test('GAD-7 and PHQ-9 scores and adult thresholds',()=>{
  assert.equal(scoreAnswers(scales.GAD7,Array(7).fill(1)),7);
  assert.equal(scoreAnswers(scales.PHQ9,Array(9).fill(3)),27);
  assert.equal(severityFor('GAD7',9,'18-64').tone,'blue');
  assert.equal(severityFor('GAD7',10,'18-64').tone,'amber');
});
test('GDS-15 reverse scoring',()=>{
  const max=scales.GDS15.items.map(x=>x.scoreForYes?1:0);
  assert.equal(scoreAnswers(scales.GDS15,max),15);
  assert.equal(scoreAnswers(scales.GDS15,max.map(x=>1-x)),0);
});
test('all seven team research records have unique WoS identifiers',()=>{
  assert.equal(papers.length,7);assert.equal(new Set(papers.map(p=>p.id)).size,7);
  assert.ok(papers.every(p=>/^\d{15}$/.test(p.id)));
});
