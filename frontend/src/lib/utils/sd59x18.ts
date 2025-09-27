import { type BigNumber } from "ethers";

const DECIMALS = 18;
const ONE = BigInt(10) ** BigInt(DECIMALS);

/**
 * Converts a float to an SD59x18 fixed-point representation.
 * @param x The float to convert.
 * @returns The SD59x18 fixed-point representation as a BigInt.
 */
export function toSD59x18(x: number): bigint {
  return BigInt(Math.round(x * 10 ** DECIMALS));
}

/**
 * Converts an SD59x18 fixed-point representation to a float.
 * @param x The SD59x18 fixed-point representation as a BigInt or BigNumber.
 * @returns The float representation.
 */
export function fromSD59x18(x: bigint | BigNumber): number {
  return Number(BigInt(x.toString()) * BigInt(1000000) / ONE) / 1000000;
}
