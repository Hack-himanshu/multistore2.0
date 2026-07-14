const { escapeRegex } = require('../../src/utils/escapeRegex');

describe('escapeRegex', () => {
  it('escapes regex special characters so they are treated literally', () => {
    const escaped = escapeRegex('a.b*c+d?e^f$g{h}i(j)k|l[m]n\\o');
    expect(escaped).toBe('a\\.b\\*c\\+d\\?e\\^f\\$g\\{h\\}i\\(j\\)k\\|l\\[m\\]n\\\\o');
  });

  it('neutralizes a classic catastrophic-backtracking (ReDoS) pattern', () => {
    const malicious = '(a+)+$';
    const escaped = escapeRegex(malicious);
    // Must not throw when compiled, and must not match greedily like the
    // original pattern would — it should only match the literal string.
    expect(() => new RegExp(escaped, 'i')).not.toThrow();
    const re = new RegExp(escaped, 'i');
    expect(re.test('(a+)+$')).toBe(true); // matches the literal text
    expect(re.test('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaX')).toBe(false); // does NOT pattern-match
  });

  it('leaves ordinary search text unchanged', () => {
    expect(escapeRegex('customer@example.com')).toBe('customer@example\\.com');
    expect(escapeRegex('MS-12345')).toBe('MS-12345');
  });

  it('still lets a normal case-insensitive substring search work after escaping', () => {
    const safe = escapeRegex('john@example.com');
    const re = new RegExp(safe, 'i');
    expect(re.test('Contact: JOHN@EXAMPLE.COM please')).toBe(true);
    expect(re.test('jane@example.com')).toBe(false);
  });
});
