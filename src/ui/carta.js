export function mostrarCarta(dados) {
  document.getElementById('carta-nome').textContent = dados.nome;
  document.getElementById('carta-descricao').textContent = dados.descricao;
  document.getElementById('carta-vida').textContent = `${dados.vidaAtual} / ${dados.vida}`;
  document.getElementById('carta-defesa').textContent = dados.defesa;
  document.getElementById('carta-ataque').textContent =
    `+${dados.ataque.bonus} (${dados.ataque.dano})`;
  document.getElementById('carta').classList.remove('escondida');
}

export function esconderCarta() {
  document.getElementById('carta').classList.add('escondida');
}