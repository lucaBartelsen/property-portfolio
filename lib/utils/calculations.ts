// lib/utils/calculations.ts
import { BUNDESLAENDER } from '../constants';
import { ensureValidNumber } from './formatters';

export function calculateTotalCost(
  purchasePrice: number, 
  bundeslandCode: string, 
  notaryRate: number, 
  brokerRate: number,
  furnitureValue: number
): number {
  const selectedBundesland = BUNDESLAENDER.find(land => land.code === bundeslandCode) || BUNDESLAENDER[0];
  const grunderwerbsteuerRate = ensureValidNumber(selectedBundesland.taxRate, 0, 10, 3.5);
  const notaryRateSafe = ensureValidNumber(notaryRate, 0, 10, 1.5);
  const brokerRateSafe = ensureValidNumber(brokerRate, 0, 10, 3.0);
  
  const grunderwerbsteuer = (purchasePrice - furnitureValue) * (grunderwerbsteuerRate / 100);
  const notaryCosts = purchasePrice * (notaryRateSafe / 100);
  const brokerFee = purchasePrice * (brokerRateSafe / 100);
  const totalExtra = grunderwerbsteuer + notaryCosts + brokerFee;
  
  return Math.round(purchasePrice + totalExtra);
}