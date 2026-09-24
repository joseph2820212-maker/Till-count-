import { constantTimeEquals, isWeakPin } from '../security';

describe('constantTimeEquals', () => {
  it('returns true for equal strings', () => {
    expect(constantTimeEquals('1234', '1234')).toBe(true);
    expect(constantTimeEquals('AAAA-BBBB-CCCC-DDDD', 'AAAA-BBBB-CCCC-DDDD')).toBe(true);
  });

  it('returns false for a single-character difference', () => {
    expect(constantTimeEquals('1234', '1235')).toBe(false);
    expect(constantTimeEquals('AAAA-BBBB-CCCC-DDDD', 'AAAA-BBBB-CCCC-DDDE')).toBe(false);
  });

  it('returns false for length differences', () => {
    expect(constantTimeEquals('1234', '12345')).toBe(false);
    expect(constantTimeEquals('12345', '1234')).toBe(false);
  });

  it('returns true for two empty strings', () => {
    expect(constantTimeEquals('', '')).toBe(true);
  });
});

describe('isWeakPin', () => {
  it('rejects all-same-digit PINs', () => {
    expect(isWeakPin('0000')).toBe(true);
    expect(isWeakPin('1111')).toBe(true);
    expect(isWeakPin('999999')).toBe(true);
  });

  it('rejects sequential runs', () => {
    expect(isWeakPin('1234')).toBe(true);
    expect(isWeakPin('4321')).toBe(true);
    expect(isWeakPin('123456')).toBe(true);
    expect(isWeakPin('654321')).toBe(true);
  });

  it('rejects common PINs', () => {
    expect(isWeakPin('1212')).toBe(true);
    expect(isWeakPin('6969')).toBe(true);
    expect(isWeakPin('112233')).toBe(true);
  });

  it('accepts non-trivial PINs', () => {
    expect(isWeakPin('2580')).toBe(false);
    expect(isWeakPin('8093')).toBe(false);
    expect(isWeakPin('4719')).toBe(false);
    expect(isWeakPin('837402')).toBe(false);
  });

  it('preserves leading zeros (string input)', () => {
    expect(isWeakPin('0137')).toBe(false);
    expect(isWeakPin('0123')).toBe(true); // sequential
  });
});
