import { Decimal128 } from 'mongodb';
import { moneyToDecimal, serializeMoney } from './money';

describe('MongoDB money', () => {
  it.each([['0', '0.00'], ['0.1', '0.10'], ['19.99', '19.99'], ['9999999999.99', '9999999999.99'], ['1E+2', '100.00']])('round-trips %s exactly', (input, output) => {
    expect(serializeMoney(moneyToDecimal(input))).toBe(output);
  });
  it.each(['-1', '0.001', '10000000000', 'NaN', 'Infinity'])('rejects unsupported money %s', input => {
    expect(() => moneyToDecimal(input)).toThrow();
  });
  it('serializes BSON exponents without floating-point conversion', () => {
    expect(serializeMoney(Decimal128.fromString('1E-2'))).toBe('0.01');
  });
});
