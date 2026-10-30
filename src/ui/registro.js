export function registrar(texto) {
  const linha = document.createElement('p');
  linha.textContent = texto;
  document.getElementById('registro').prepend(linha);
}