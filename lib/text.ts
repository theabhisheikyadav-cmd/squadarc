// Lowercase and strip accents so "sao" matches "São Paulo".
export function fold(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}
