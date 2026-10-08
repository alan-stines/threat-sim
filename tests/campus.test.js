const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/campus.js'), 'utf8'), context);
const Scenario = vm.runInContext('CampusScenario', context);

test('90-second exercise progresses through every stage and stops at recovery', () => {
  const scenario = new Scenario();
  scenario.toggle();
  assert.equal(scenario.stage, 1);
  for (let stage = 2; stage <= 6; stage++) {
    scenario.tick(18);
    assert.equal(scenario.stage, stage);
  }
  assert.equal(scenario.running, false);
  assert.equal(scenario.elapsed, 90);
  scenario.tick(100);
  assert.equal(scenario.elapsed, 90);
});

test('pause preserves elapsed time, resume continues, reset clears progress', () => {
  const scenario = new Scenario();
  scenario.toggle();
  scenario.tick(12);
  scenario.toggle();
  scenario.tick(80);
  assert.equal(scenario.elapsed, 12);
  scenario.toggle();
  scenario.tick(6);
  assert.equal(scenario.stage, 2);
  scenario.reset();
  assert.equal(scenario.stage, 0);
  assert.equal(scenario.elapsed, 0);
  assert.equal(scenario.running, false);
});

test('manual stepping stays paused, completes safely, and replay starts fresh', () => {
  const scenario = new Scenario();
  for (let i = 0; i < 8; i++) scenario.next();
  assert.equal(scenario.stage, 6);
  assert.equal(scenario.elapsed, 90);
  assert.equal(scenario.running, false);
  scenario.toggle();
  assert.equal(scenario.stage, 1);
  assert.equal(scenario.elapsed, 0);
  assert.equal(scenario.running, true);
});

test('delayed timer reaches recovery without overrunning the timeline', () => {
  const scenario = new Scenario();
  scenario.toggle();
  scenario.tick(200);
  assert.equal(scenario.stage, 6);
  assert.equal(scenario.elapsed, 90);
  assert.equal(scenario.running, false);
});
