import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave, validateSave, type SchoolGrade } from '../src/rules';
import { beginProject, adjustProject, finishProject, workSpec, changeDesign, designOptions, redesignProject, moveFruit } from '../src/adventure';
import { adjustTool, toolSpec, validTool, toolHtml, type LearningTool } from '../src/learning-tools';
import type { CurriculumQuestion } from '../src/curriculum';

const question = (visual: CurriculumQuestion['visual']): CurriculumQuestion => ({ unit: 'fraction', skill: '비교', prompt: '수를 비교해요', kind: 'choice', answer: '1/2', choices: [{ value: '1/2', label: '1/2' }, { value: '1/3', label: '1/3' }], hints: ['같은 전체예요', '조각을 비교해요', '다시 살펴봐요'], explanation: '같은 전체를 비교해요', visual });

test('17 saves retain completed and partial projects, grade, inventory and wrong records', () => {
  for (const grade of [1, 3, 6] as const) {
    const s = newSave('탐험가', 0, grade); s.berries = 123; s.adventure.completed = [0]; beginProject(s, 1); adjustProject(s, 0, 1);
    const old = JSON.parse(JSON.stringify(s)); old.version = 17; delete old.adventure.designs; delete old.adventure.tool; delete old.adventure.active.design; delete old.adventure.active.editing;
    const restored = validateSave(old);
    assert.equal(restored.version, 20); assert.equal(restored.berries, 123); assert.equal(restored.adventure.designs[0].grade, grade); assert.equal(restored.adventure.active!.values[0], 1);
    assert.deepEqual(restored.curriculum, s.curriculum); assert.deepEqual(restored.weapons, s.weapons);
  }
});
test('every offered flower layout finishes with exactly the same flower count and persists its design', () => {
  for (let grade = 1; grade <= 6; grade++) for (const rows of designOptions(0, grade as SchoolGrade)) {
    const s = newSave('탐험가', 0, grade as SchoolGrade); beginProject(s, 0); changeDesign(s, 'rows', rows); changeDesign(s, 'color', 2);
    const spec = workSpec(s.adventure.active!); assert.equal(spec.rows * spec.columns, spec.target);
    s.adventure.active!.values[0] = spec.target; assert.equal(finishProject(s), true); assert.equal(redesignProject(s, 0), true);
    assert.equal(finishProject(s), true); assert.equal(s.berries, 0); assert.equal(s.xp, 0);
    assert.equal(validateSave(s).adventure.designs[0].rows, rows); assert.equal(s.adventure.designs[0].color, 2);
  }
});
test('changing basket counts and moving fruit preserves inventory without solving unequal distribution', () => {
  const s = newSave('탐험가', 0, 6); s.adventure.completed = [0, 1]; beginProject(s, 2);
  for (let i = 0; i < 20; i++) adjustProject(s, 0, 1);
  assert.equal(changeDesign(s, 'baskets', 2), true); assert.deepEqual(s.adventure.active!.values, [20, 0]); assert.equal(finishProject(s), false);
  for (let i = 0; i < 10; i++) assert.equal(moveFruit(s, 0, 1), true);
  assert.equal(moveFruit(s, 0, 0), false); assert.equal(finishProject(s), true); assert.equal(validateSave(s).adventure.designs[2].baskets, 2);
  const young = newSave('탐험가', 0, 1); young.adventure.completed = [0, 1]; beginProject(young, 2); assert.equal(changeDesign(young, 'baskets', 3), false);
});
test('division manipulations preserve the total, cap each group, persist and never answer a question', () => {
  const q = question({ kind: 'groups', total: 17, divisor: 5, remainder: 2 }), tool: LearningTool = { key: 'division', question: q, values: [0, 0, 0, 0] };
  assert.equal((toolHtml(tool).match(/data-tool-drop=/g) ?? []).length, 1);
  for (let group = 0; group < 3; group++) for (let i = 0; i < 5; i++) assert.equal(adjustTool(tool, group, 1), true);
  assert.equal(adjustTool(tool, 0, 1), false); assert.equal(tool.values.reduce((a,b)=>a+b,0), 15); assert.equal(validTool(tool), true);
  const s = newSave('탐험가',0); s.adventure.tool = tool; assert.deepEqual(validateSave(s).adventure.tool, tool); assert.equal(s.learning.correct,0);
  assert.equal(toolSpec(question({ kind:'groups', total:31, divisor:5, remainder:1 })), null);
});
test('fraction bars use equal whole sizes and handle improper fractions; decimal includes 0 and 1', () => {
  const spec = toolSpec(question({kind:'fraction',numerator:7,denominator:4,compare:{numerator:7,denominator:3}}))!;
  assert.deepEqual(spec.limits,[8,9]); assert.deepEqual(spec.denominators,[4,3]);
  const q=question({kind:'decimal',tenths:0,compare:10}), tool:LearningTool={key:'decimal',question:q,values:[0,0]};
  assert.equal(adjustTool(tool,0,-1),false); for(let i=0;i<10;i++) adjustTool(tool,1,1); assert.equal(adjustTool(tool,1,1),false);
  assert.match(toolHtml(tool),/0\.0/); assert.match(toolHtml(tool),/1\.0/); assert.equal(validTool({...tool,values:[0,11]}),false);
  assert.equal(toolSpec(question({kind:'decimal',tenths:11,compare:2})),null);
});
test('malformed designs and saved tool state are rejected rather than altering protected progress', () => {
  const s=newSave('탐험가',0); s.adventure.designs[0].rows=0; assert.throws(()=>validateSave(s));
  const other=newSave('탐험가',0); (other.adventure as any).tool={key:'bad',question:null,values:[]}; assert.throws(()=>validateSave(other));
});
