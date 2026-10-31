import { rolar, rolarDano } from '../dados/rolagem.js';

// Recebe os DADOS do atacante e do alvo (não os modelos 3D).
// Altera a vida do alvo e devolve o que aconteceu.
export function atacar(atacante, alvo) {
  const d20 = rolar(20);
  const total = d20 + atacante.ataque.bonus;
  const critico = d20 === 20;
  const falhaCritica = d20 === 1;
  const acertou = critico || (!falhaCritica && total >= alvo.defesa);

  let dano = 0;
  if (acertou) {
    dano = rolarDano(atacante.ataque.dano);
    if (critico) dano += rolarDano(atacante.ataque.dano); // crítico: rola o dano duas vezes
    alvo.vidaAtual = Math.max(0, alvo.vidaAtual - dano); // nunca fica negativa
  }

  return { d20, total, acertou, critico, falhaCritica, dano, derrotado: alvo.vidaAtual === 0 };
}