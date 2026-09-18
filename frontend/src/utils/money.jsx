// Money is stored and transported as integer minor units. It becomes a
// decimal only here, at the edge, so no arithmetic anywhere touches a float.

export function formatMoney(minor, currency = "INR") {
  const value = Number(minor ?? 0) / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export const rupeesToMinor = (rupees) => Math.round(rupees * 100);
export const minorToRupees = (minor) => minor / 100;
