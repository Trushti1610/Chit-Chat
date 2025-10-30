export const toCapitalize = (str) => {
  if (typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str) => {
  if (typeof str !== "string") return "";
  return str
    .split(" ")
    .map((word) => toCapitalize(word))
    .join(" ");
};