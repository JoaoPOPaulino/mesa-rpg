// Verifica se alguma miniatura já ocupa a casa (x, z).
// Recebe uma lista de DADOS (não de modelos 3D): regra pura.
export function casaOcupada(x, z, todos) {
  // some() = "existe pelo menos um que..." (como anyMatch() do Java Stream)
  return todos.some((dados) => dados.casa.x === x && dados.casa.z === z);
}