// Rola um dado de N lados: rolar(20) → 1 a 20
export function rolar(lados) {
  return Math.floor(Math.random() * lados) + 1;
}

// Rola uma expressão como "2d6" (dois dados de 6 lados) e soma
export function rolarDano(expressao) {
  const [quantidade, lados] = expressao.split('d').map(Number); // "2d6" → [2, 6]
  let soma = 0;
  for (let i = 0; i < quantidade; i++) {
    soma += rolar(lados);
  }
  return soma;
}