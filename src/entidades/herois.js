import dadosHerois from '../data/herois.json';
import { criarMiniatura } from './miniaturas.js';

export const herois = [];

export function criarHerois(scene) {
  for (const dados of dadosHerois) {
    criarMiniatura(dados, scene)
      .then((modelo) => herois.push(modelo))
      .catch((erro) => console.error(`Não consegui criar "${dados.nome}"`, erro));
  }
}