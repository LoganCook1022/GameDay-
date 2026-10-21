'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const access = require('../../assets/js/admin-access');

test('a claim with admin=true grants global access to any school', () => {
  const result = access.resolveAccess({ claims: { admin: true }, schoolId: 'teton' });
  assert.equal(result.isAdmin, true);
  assert.equal(result.isGlobal, true);
  assert.equal(result.canApprove, true);
});

test('a schools array claim is scoped to the listed schools', () => {
  assert.equal(access.resolveAccess({ claims: { schools: ['teton', 'rigby'] }, schoolId: 'teton' }).isAdmin, true);
  assert.equal(access.resolveAccess({ claims: { schools: ['teton'] }, schoolId: 'madison' }).isAdmin, false);
});

test('a single school claim is honored', () => {
  assert.equal(access.resolveAccess({ claims: { school: 'madison' }, schoolId: 'madison' }).isAdmin, true);
  assert.equal(access.resolveAccess({ claims: { school: 'madison' }, schoolId: 'teton' }).isAdmin, false);
});

test('a super_admin roster entry grants global access without a claim', () => {
  const result = access.resolveAccess({
    roster: { approved: true, role: 'super_admin', schoolId: 'sugar-salem' },
    schoolId: 'teton'
  });
  assert.equal(result.isAdmin, true);
  assert.equal(result.isGlobal, true);
  assert.equal(result.canApprove, true);
});

test('an approved roster entry is scoped to its schoolId', () => {
  assert.equal(access.resolveAccess({
    roster: { approved: true, role: 'admin', schoolId: 'teton' },
    schoolId: 'teton'
  }).isAdmin, true);
  assert.equal(access.resolveAccess({
    roster: { approved: true, role: 'admin', schoolId: 'teton' },
    schoolId: 'rigby'
  }).isAdmin, false);
});

test('an unapproved roster entry grants nothing', () => {
  const result = access.resolveAccess({
    roster: { approved: false, role: 'super_admin', schoolId: 'sugar-salem' },
    schoolId: 'sugar-salem'
  });
  assert.equal(result.isAdmin, false);
  assert.equal(result.isGlobal, false);
  assert.equal(result.canApprove, false);
});

test('a missing roster and missing claims denies access', () => {
  const result = access.resolveAccess({ claims: {}, roster: null, schoolId: 'sugar-salem' });
  assert.equal(result.isAdmin, false);
  assert.equal(result.canApprove, false);
});

test('claims take precedence and still allow approval for any school', () => {
  const result = access.resolveAccess({ claims: { admin: true }, roster: { approved: true, role: 'admin', schoolId: 'sugar-salem' }, schoolId: 'madison' });
  assert.equal(result.isAdmin, true);
  assert.equal(result.isGlobal, true);
  assert.equal(result.canApprove, true);
});
