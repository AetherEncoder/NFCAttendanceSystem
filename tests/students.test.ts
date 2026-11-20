import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { insertStudentSql, normalizeUid, registrationValues, studentSchema } from '../src/data/students.ts';

test('UID normalization preserves leading zeroes and byte order, and rejects unusable IDs', () => {
  assert.equal(normalizeUid('00:0a:02:ff'), '000A02FF');
  assert.equal(normalizeUid('00-0a-02-ff'), '000A02FF');
  for (const value of [undefined, '', '  ', '123', '0G', 'AA'.repeat(33)]) {
    assert.throws(() => normalizeUid(value));
  }
});

test('a saved registration survives closing and reopening the local database', () => {
  const directory = mkdtempSync(join(tmpdir(), 'nfc-prototype-test-'));
  const filename = join(directory, 'students.db');
  let db = new DatabaseSync(filename);
  try {
    db.exec(studentSchema);
    db.prepare(insertStudentSql).run(...registrationValues('00010203', 'Persistence Test', '00009', '', []));
    db.close();
    db = new DatabaseSync(filename);
    db.exec(studentSchema);
    assert.equal(db.prepare('SELECT full_name FROM students WHERE uid = ?').get('00010203')?.full_name, 'Persistence Test');
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('registrations persist, match scanned IDs, and cannot overwrite duplicate cards or numbers', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(studentSchema);
    const save = db.prepare(insertStudentSql);
    save.run(...registrationValues('00:0a:02:ff', '  Sample   Student  ', '00001', 'BSCS 1-A', ['android.nfc.tech.NfcA']));
    assert.equal(db.prepare('SELECT full_name FROM students WHERE uid = ?').get(normalizeUid('000a02ff'))?.full_name, 'Sample Student');
    assert.equal(db.prepare('SELECT student_number FROM students').get()?.student_number, '00001');
    assert.throws(() => save.run(...registrationValues('000A02FF', 'Other Student', '00002', '', [])));
    assert.throws(() => save.run(...registrationValues('000A0200', 'Other Student', '00001', '', [])));
    save.run(...registrationValues('000A0201', 'No Number One', '', '', []));
    save.run(...registrationValues('000A0202', 'No Number Two', '', '', []));
    save.run(...registrationValues('000A0203', "O'Brien 李", 'ABC-01', '', []));
    assert.throws(() => save.run(...registrationValues('000A0204', 'Duplicate', 'abc-01', '', [])));
    assert.equal(db.prepare('SELECT count(*) AS total FROM students').get()?.total, 4);
    assert.throws(() => registrationValues('000A0205', ' ', '', '', []));
    assert.throws(() => registrationValues('000A0205', 'A'.repeat(121), '', '', []));
  } finally {
    db.close();
  }
});
