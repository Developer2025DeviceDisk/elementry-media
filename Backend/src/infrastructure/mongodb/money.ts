import Decimal from 'decimal.js';
import { Decimal128 } from 'mongodb';

export function moneyToDecimal(value: string): Decimal128 {
  const decimal = new Decimal(value);
  if (!decimal.isFinite() || decimal.isNegative() || decimal.decimalPlaces() > 2 || decimal.gt('9999999999.99')) {
    throw new Error('Money must be nonnegative, have at most two decimal places, and fit the supported range');
  }
  return Decimal128.fromString(decimal.toFixed(2));
}
export function serializeMoney(value: Decimal128): string {
  return new Decimal(value.toString()).toFixed(2);
}
