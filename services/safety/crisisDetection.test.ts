import test from 'node:test';
import assert from 'node:assert/strict';
import { detectCrisis } from './crisisDetection';

const shouldTrigger = [
  'I want to kill myself',
  'I have been thinking about suicide',
  "I'm feeling suicidal",
  'I think I want to die',
  'I wanna die',
  "I don't want to live anymore",
  'I do not want to be alive',
  'there is no point in living',
  'no reason to go on',
  'everyone would be better off without me',
  "I'm better off dead",
  'I wish I was dead',
  'I wish I could just disappear forever',
  'I keep thinking about ending my life',
  'I want to end it all',
  'I have been hurting myself',
  'self-harm is the only thing that helps',
  'I started cutting myself again',
  'I’m planning to end it all', // curly apostrophe from the iOS keyboard
  'I don’t want to be here anymore',
  'KILL MYSELF',
];

const shouldNotTrigger = [
  "I'm dying to try the new restaurant",
  'this deadline is killing me',
  'I could die of embarrassment',
  'I want to kill it at the presentation',
  'my laptop is dead',
  'I killed time before the interview',
  'I want to live in a bigger city',
  "I don't want to live in the past",
  'I want to end the meeting early',
  'I am going to end the argument',
  'I hurt my knee running',
  'my goal is to take my life back into my own hands',
  'I want to take control of my life',
  'I am taking my life back',
  'I want to live in a bigger city and not live in fear of failing',
  '',
  '   ',
];

test('explicit statements about suicide or self-harm trigger the resources', () => {
  for (const text of shouldTrigger) {
    assert.equal(detectCrisis(text), true, `expected a match: ${text}`);
  }
});

test('everyday figures of speech do not trigger it', () => {
  for (const text of shouldNotTrigger) {
    assert.equal(detectCrisis(text), false, `expected no match: ${text}`);
  }
});

test('the word suicide on its own errs toward showing the resources', () => {
  // A deliberate false positive: a dismissible sheet is cheaper than missing someone
  assert.equal(detectCrisis('suicide prevention is an important cause I volunteer for'), true);
});

test('missing text is never a crisis', () => {
  assert.equal(detectCrisis(null), false);
  assert.equal(detectCrisis(undefined), false);
});

test('matching is case and apostrophe insensitive', () => {
  assert.equal(detectCrisis("I DON'T WANT TO LIVE"), true);
  assert.equal(detectCrisis('i don\u2019t want to live'), true);
});