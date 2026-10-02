// Dados fictícios atualizados do 8º Ano (Lista de Objetos)
const dadosBoletim = [
  { disciplina: "Língua Portuguesa", tri1: "7,2", tri2: "7,1", tri3: null, faltas: [2, 2, 0] },
  { disciplina: "Matemática", tri1: "5,3", tri2: "6,0", tri3: null, faltas: [4, 5, 0] },
  { disciplina: "Ciências", tri1: "7,7", tri2: "6,7", tri3: null, faltas: [2, 3, 0] },
  { disciplina: "História", tri1: "8,7", tri2: "9,0", tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Geografia", tri1: "4,4", tri2: "5,5", tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Língua Inglesa", tri1: "7,1", tri2: "5,1", tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Arte", tri1: "6,0", tri2: "8,0", tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: "8,1", tri2: "7,4", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Educação Digital", tri1: "6,0", tri2: "9,0", tri3: null, faltas: [2, 3, 0] },
  { disciplina: "Educação Financeira", tri1: "9,5", tri2: "9,0", tri3: null, faltas: [3, 3, 0] },
  { disciplina: "Estudo Orientado", tri1: "7,7", tri2: "8,1", tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: "6,5", tri2: "7,4", tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Pensamento Lógico", tri1: "10,0", tri2: "9,1", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,5", tri2: "7,5", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Práticas Experimentais", tri1: "6,5", tri2: "6,7", tri3: null, faltas: [3, 0, 0] }
];

// Frequência geral apenas demonstrativa (será tratada de outra forma no futuro)
const FREQUENCIA_DEMONSTRATIVA = 92;

// Função para normalizar qualquer valor de nota para a escala de 0 a 10
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null; // Nota ainda não lançada
  }

  // Converte texto com vírgula para número com ponto decimal
  let num = typeof valor === "string" ? parseFloat(valor.replace(",", ".")) : parseFloat(valor);

  if (isNaN(num)) return null; // Valor inválido

  // Se a nota for maior que 10 e menor/igual a 100 (ex: 82 ou 100), divide por 10
  if (num > 10 && num <= 100) {
    num = num / 10;
  }

  // Garante que a nota esteja dentro da escala válida de 0 a 10
  if (num >= 0 && num <= 10) {
    return num;
  }

  return null; // Fora do intervalo válido
}

// Função para formatar a exibição da nota na tabela
function formatarExibicaoNota(nota) {
  if (nota === null) return "—";
  return nota.toFixed(1).replace(".", ",");
}

// Função principal que constrói o boletim na tela
function renderizarBoletim() {
  const corpoTabela = document.getElementById("corpo-tabela");
  corpoTabela.innerHTML = "";

  let somaMediasValidas = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let qtdBomDesempenho = 0;
  let qtdAtencao = 0;

  // Passa por cada disciplina da lista
  dadosBoletim.forEach((item) => {
    // Normaliza as notas dos 3 trimestres
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Calcula a média usando apenas notas disponíveis
    const notasValidas = [n1, n2, n3].filter((n) => n !== null);
    let media = null;

    if (notasValidas.length > 0) {
      const soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
      media = soma / notasValidas.length;
      somaMediasValidas += media;
      qtdDisciplinasComMedia++;
    }

    // Soma as faltas da disciplina
    const totalFaltasDisciplina = item.faltas.reduce((acc, curr) => acc + curr, 0);
    totalFaltasGeral += totalFaltasDisciplina;

    // Define a situação da disciplina
    let situacaoTexto = "Nota ainda não disponível";
    let classeStatus = "status-indisponivel";

    if (media !== null) {
      if (media >= 6.0) {
        situacaoTexto = "Bom desempenho";
        classeStatus = "status-bom";
        qtdBomDesempenho++;
      } else {
        situacaoTexto = "Atenção";
        classeStatus = "status-atencao";
        qtdAtencao++;
      }
    }

    // Cria a linha da tabela (HTML) para a disciplina atual
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.disciplina}</strong></td>
      <td>${formatarExibicaoNota(n1)}</td>
      <td>${formatarExibicaoNota(n2)}</td>
      <td>${formatarExibicaoNota(n3)}</td>
      <td><strong>${formatarExibicaoNota(media)}</strong></td>
      <td>${totalFaltasDisciplina}</td>
      <td><span class="${classeStatus}">${situacaoTexto}</span></td>
    `;
    corpoTabela.appendChild(tr);
  });

  // Atualiza os Cards de Resumo no topo
  const mediaGeralFinal = qtdDisciplinasComMedia > 0 ? (somaMediasValidas / qtdDisciplinasComMedia).toFixed(1).replace(".", ",") : "—";
  
  document.getElementById("media-geral").textContent = mediaGeralFinal;
  document.getElementById("total-faltas").textContent = totalFaltasGeral;
  document.getElementById("qtd-bom-desempenho").textContent = qtdBomDesempenho;
  document.getElementById("qtd-atencao").textContent = qtdAtencao;
}

// Executa a função assim que a página carregar
document.addEventListener("DOMContentLoaded", renderizarBoletim);