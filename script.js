
// Configuração Fixa do Aluno
const CONFIG_ALUNO = {
  turma: "8C",
  numeroChamada: 7,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// Variável para armazenar o PIN apenas em memória durante a sessão
let pinSessao = "";
let modoEdicao = false;

// Variáveis para instâncias dos gráficos do Chart.js
let graficoMedias = null;
let graficoEvolucao = null;
let graficoFaltas = null;

// Dados fictícios padrão do 8º Ano (caso a API não retorne dados salvos)
let dadosBoletim = [
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

// Frequência geral apenas demonstrativa (não é calculada pelas faltas)
const FREQUENCIA_DEMONSTRATIVA = 92;

// Normalização para os DADOS ANTIGOS / DADOS BRUTOS LOCAIS
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  let num = typeof valor === "string" ? parseFloat(valor.replace(",", ".")) : parseFloat(valor);

  if (isNaN(num)) return null;

  if (num > 10 && num <= 100) {
    num = num / 10;
  }

  if (num >= 0 && num <= 10) {
    return num;
  }

  return null;
}

// Formatação para exibição simples das notas
function formatarExibicaoNota(nota) {
  if (nota === null || nota === undefined) return "—";
  if (typeof nota === "number") return nota.toFixed(1).replace(".", ",");
  
  const num = normalizarNota(nota);
  if (num === null) return "—";
  return num.toFixed(1).replace(".", ",");
}

// Validação para NOTAS DIGITADAS NO EDITOR (Regras estritas: 0 a 10, ponto/vírgula ou vazio)
function validarNotaDigitada(valorStr) {
  if (valorStr === null || valorStr === undefined || valorStr.trim() === "") {
    return { valido: true, valor: null };
  }

  const strLimpa = valorStr.trim().replace(",", ".");
  const num = parseFloat(strLimpa);

  // Rejeita valores inválidos, letras ou fora da escala de 0 a 10 (ex: 75, 82, 100, -1, 11)
  if (isNaN(num) || num < 0 || num > 10) {
    return { valido: false, valor: null };
  }

  return { valido: true, valor: num };
}

// Validação para FALTAS DIGITADAS NO EDITOR (Inteiro >= 0)
function validarFaltaDigitada(valorStr) {
  if (valorStr === null || valorStr === undefined || valorStr.trim() === "") {
    return { valido: false, valor: null };
  }

  const strLimpa = valorStr.trim();
  const num = Number(strLimpa);

  if (isNaN(num) || !Number.isInteger(num) || num < 0) {
    return { valido: false, valor: null };
  }

  return { valido: true, valor: num };
}

// Função de Login por PIN via API
async function fazerLogin() {
  const inputPin = document.getElementById("input-pin");
  const msgLogin = document.getElementById("mensagem-login");
  const pinDigitado = inputPin.value.trim();

  if (!pinDigitado) {
    msgLogin.textContent = "Digite seu PIN.";
    msgLogin.className = "mensagem-status mensagem-erro";
    return;
  }

  msgLogin.textContent = "Conectando...";
  msgLogin.className = "mensagem-status";

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (resposta.status === 401) {
      msgLogin.textContent = "Turma, chamada ou PIN inválidos.";
      msgLogin.className = "mensagem-status mensagem-erro";
      return;
    }

    if (resposta.status === 429) {
      msgLogin.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
      msgLogin.className = "mensagem-status mensagem-erro";
      return;
    }

    if (!resposta.ok) {
      msgLogin.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
      msgLogin.className = "mensagem-status mensagem-erro";
      return;
    }

    const resJson = await resposta.json();

    // Login com sucesso: guarda o PIN apenas em memória
    pinSessao = pinDigitado;
    inputPin.value = ""; // Limpa o campo por segurança

    // Esconde tela de login e exibe o boletim
    document.getElementById("area-login").style.display = "none";
    document.getElementById("conteudo-boletim").style.display = "block";

    // Regra: DADOS DA API > DADOS LOCAIS
    if (resJson && resJson.dados && Array.isArray(resJson.dados.disciplinas)) {
      dadosBoletim = resJson.dados.disciplinas;
    }

    renderizarBoletim();
    atualizarGraficos();

  } catch (erro) {
    msgLogin.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
    msgLogin.className = "mensagem-status mensagem-erro";
  }
}

// Constrói ou atualiza a tabela e os cards sem duplicar
function renderizarBoletim() {
  const corpoTabela = document.getElementById("corpo-tabela");
  corpoTabela.textContent = ""; // Limpeza segura

  let somaMediasValidas = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let qtdBomDesempenho = 0;
  let qtdAtencao = 0;

  dadosBoletim.forEach((item, index) => {
    let n1, n2, n3, faltasTri;

    if (Array.isArray(item.faltas)) {
      faltasTri = [...item.faltas];
    } else {
      faltasTri = [item.f1 || 0, item.f2 || 0, item.f3 || 0];
    }

    if (modoEdicao) {
      // No modo de edição, exibe campos de input
      const tr = document.createElement("tr");

      const tdNome = document.createElement("td");
      const strongNome = document.createElement("strong");
      strongNome.textContent = item.disciplina;
      tdNome.appendChild(strongNome);
      tr.appendChild(tdNome);

      // Função para criar inputs de nota e falta
      const criarInputNota = (val, idCampo) => {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.type = "text";
        input.className = "input-edicao";
        input.id = `${idCampo}-${index}`;
        input.value = val === null || val === undefined ? "" : val;
        td.appendChild(input);
        return td;
      };

      const criarInputFalta = (val, idCampo) => {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.type = "text";
        input.className = "input-edicao";
        input.id = `${idCampo}-${index}`;
        input.value = val === undefined || val === null ? "0" : val;
        td.appendChild(input);
        return td;
      };

      tr.appendChild(criarInputNota(item.tri1 !== undefined ? item.tri1 : item.n1, "input-n1"));
      tr.appendChild(criarInputNota(item.tri2 !== undefined ? item.tri2 : item.n2, "input-n2"));
      tr.appendChild(criarInputNota(item.tri3 !== undefined ? item.tri3 : item.n3, "input-n3"));

      const tdMedia = document.createElement("td");
      tdMedia.textContent = "—";
      tr.appendChild(tdMedia);

      tr.appendChild(criarInputFalta(faltasTri[0], "input-f1"));
      tr.appendChild(criarInputFalta(faltasTri[1], "input-f2"));
      tr.appendChild(criarInputFalta(faltasTri[2], "input-f3"));

      const tdSit = document.createElement("td");
      tdSit.textContent = "Em edição";
      tr.appendChild(tdSit);

      corpoTabela.appendChild(tr);

    } else {
      // Modo de visualização normal
      n1 = item.tri1 !== undefined ? normalizarNota(item.tri1) : normalizarNota(item.n1);
      n2 = item.tri2 !== undefined ? normalizarNota(item.tri2) : normalizarNota(item.n2);
      n3 = item.tri3 !== undefined ? normalizarNota(item.tri3) : normalizarNota(item.n3);

      const notasValidas = [n1, n2, n3].filter((n) => n !== null);
      let media = null;

      if (notasValidas.length > 0) {
        const soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
        media = soma / notasValidas.length;
        somaMediasValidas += media;
        qtdDisciplinasComMedia++;
      }

      const totalFaltasDisc = faltasTri.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
      totalFaltasGeral += totalFaltasDisc;

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

      const tr = document.createElement("tr");

      const tdNome = document.createElement("td");
      const strongNome = document.createElement("strong");
      strongNome.textContent = item.disciplina;
      tdNome.appendChild(strongNome);

      const tdN1 = document.createElement("td");
      tdN1.textContent = formatarExibicaoNota(n1);

      const tdN2 = document.createElement("td");
      tdN2.textContent = formatarExibicaoNota(n2);

      const tdN3 = document.createElement("td");
      tdN3.textContent = formatarExibicaoNota(n3);

      const tdMedia = document.createElement("td");
      const strongMedia = document.createElement("strong");
      strongMedia.textContent = formatarExibicaoNota(media);
      tdMedia.appendChild(strongMedia);

      const tdFaltas = document.createElement("td");
      tdFaltas.textContent = totalFaltasDisc;

      const tdSituacao = document.createElement("td");
      const spanStatus = document.createElement("span");
      spanStatus.className = classeStatus;
      spanStatus.textContent = situacaoTexto;
      tdSituacao.appendChild(spanStatus);

      tr.appendChild(tdNome);
      tr.appendChild(tdN1);
      tr.appendChild(tdN2);
      tr.appendChild(tdN3);
      tr.appendChild(tdMedia);
      tr.appendChild(tdFaltas);
      tr.appendChild(tdSituacao);

      corpoTabela.appendChild(tr);
    }
  });

  // Atualização dos Cards de Resumo
  const mediaGeralFinal = qtdDisciplinasComMedia > 0 ? (somaMediasValidas / qtdDisciplinasComMedia).toFixed(1).replace(".", ",") : "—";

  document.getElementById("media-geral").textContent = mediaGeralFinal;
  document.getElementById("total-faltas").textContent = totalFaltasGeral;
  document.getElementById("qtd-bom-desempenho").textContent = qtdBomDesempenho;
  document.getElementById("qtd-atencao").textContent = qtdAtencao;
}

// Alterna entre o modo de visualização e edição
function alternarEdicao() {
  modoEdicao = !modoEdicao;
  const btnEditar = document.getElementById("btn-editar");
  const btnSalvar = document.getElementById("btn-salvar");
  const msgStatus = document.getElementById("mensagem-status-api");

  msgStatus.textContent = "";

  if (modoEdicao) {
    btnEditar.textContent = "Cancelar edição";
    btnSalvar.style.display = "inline-block";
  } else {
    btnEditar.textContent = "Alterar dados";
    btnSalvar.style.display = "none";
  }

  renderizarBoletim();
}

// Valida e envia as alterações para a API
async function salvarDados() {
  const msgStatus = document.getElementById("mensagem-status-api");
  msgStatus.textContent = "Validando dados...";
  msgStatus.className = "mensagem-status";

  let possuiErros = false;
  const novasDisciplinas = [];

  // Remove marcações de erro anteriores
  document.querySelectorAll(".input-edicao").forEach(inp => inp.classList.remove("campo-invalido"));

  dadosBoletim.forEach((item, index) => {
    const inpN1 = document.getElementById(`input-n1-${index}`);
    const inpN2 = document.getElementById(`input-n2-${index}`);
    const inpN3 = document.getElementById(`input-n3-${index}`);

    const inpF1 = document.getElementById(`input-f1-${index}`);
    const inpF2 = document.getElementById(`input-f2-${index}`);
    const inpF3 = document.getElementById(`input-f3-${index}`);

    const valN1 = validarNotaDigitada(inpN1.value);
    const valN2 = validarNotaDigitada(inpN2.value);
    const valN3 = validarNotaDigitada(inpN3.value);

    const valF1 = validarFaltaDigitada(inpF1.value);
    const valF2 = validarFaltaDigitada(inpF2.value);
    const valF3 = validarFaltaDigitada(inpF3.value);

    if (!valN1.valido) { inpN1.classList.add("campo-invalido"); possuiErros = true; }
    if (!valN2.valido) { inpN2.classList.add("campo-invalido"); possuiErros = true; }
    if (!valN3.valido) { inpN3.classList.add("campo-invalido"); possuiErros = true; }

    if (!valF1.valido) { inpF1.classList.add("campo-invalido"); possuiErros = true; }
    if (!valF2.valido) { inpF2.classList.add("campo-invalido"); possuiErros = true; }
    if (!valF3.valido) { inpF3.classList.add("campo-invalido"); possuiErros = true; }

    novasDisciplinas.push({
      disciplina: item.disciplina,
      tri1: valN1.valor,
      tri2: valN2.valor,
      tri3: valN3.valor,
      faltas: [valF1.valor || 0, valF2.valor || 0, valF3.valor || 0]
    });
  });

  if (possuiErros) {
    msgStatus.textContent = "Por favor, corrija os campos destacados em vermelho (Notas de 0 a 10 e faltas números inteiros).";
    msgStatus.className = "mensagem-status mensagem-erro";
    return;
  }

  msgStatus.textContent = "Salvando...";

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: novasDisciplinas
        }
      })
    });

    if (!resposta.ok) {
      msgStatus.textContent = "Falha ao salvar as alterações. Tente novamente.";
      msgStatus.className = "mensagem-status mensagem-erro";
      return;
    }

    // Sucesso no salvamento
    dadosBoletim = novasDisciplinas;
    modoEdicao = false;

    document.getElementById("btn-editar").textContent = "Alterar dados";
    document.getElementById("btn-salvar").style.display = "none";

    renderizarBoletim();
    atualizarGraficos();

    msgStatus.textContent = "Dados salvos com sucesso!";
    msgStatus.className = "mensagem-status mensagem-sucesso";

  } catch (erro) {
    msgStatus.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
    msgStatus.className = "mensagem-status mensagem-erro";
  }
}

// ==========================================================================
// FUNÇÕES EXCLUSIVAS DOS GRÁFICOS (SOMENTE LEITURA DO ESTADO)
// ==========================================================================

function atualizarGraficoMedias() {
  const canvas = document.getElementById("graficoMediasDisciplinas");
  if (!canvas) return;

  if (graficoMedias) {
    graficoMedias.destroy();
  }

  const rotulos = [];
  const valoresMedias = [];

  dadosBoletim.forEach(item => {
    rotulos.push(item.disciplina);

    const n1 = item.tri1 !== undefined ? normalizarNota(item.tri1) : normalizarNota(item.n1);
    const n2 = item.tri2 !== undefined ? normalizarNota(item.tri2) : normalizarNota(item.n2);
    const n3 = item.tri3 !== undefined ? normalizarNota(item.tri3) : normalizarNota(item.n3);

    const notasValidas = [n1, n2, n3].filter(n => n !== null);

    if (notasValidas.length > 0) {
      const soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
      const media = soma / notasValidas.length;
      valoresMedias.push(Number(media.toFixed(1)));
    } else {
      valoresMedias.push(null);
    }
  });

  const ctx = canvas.getContext("2d");
  graficoMedias = new Chart(ctx, {
    type: "bar",
    data: {
      labels: rotulos,
      datasets: [{
        label: "Média Atual",
        data: valoresMedias,
        backgroundColor: "#6c3483",
        borderColor: "#5b2c6f",
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: 0,
          max: 10,
          ticks: { stepSize: 1 }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.raw;
              if (val === null || val === undefined) return "Sem nota";
              return `Média: ${val.toFixed(1).replace(".", ",")}`;
            }
          }
        }
      }
    }
  });
}

function atualizarGraficoEvolucao() {
  const canvas = document.getElementById("graficoEvolucaoTrimestres");
  if (!canvas) return;

  if (graficoEvolucao) {
    graficoEvolucao.destroy();
  }

  let somaTri1 = 0, qtdTri1 = 0;
  let somaTri2 = 0, qtdTri2 = 0;
  let somaTri3 = 0, qtdTri3 = 0;

  dadosBoletim.forEach(item => {
    const n1 = item.tri1 !== undefined ? normalizarNota(item.tri1) : normalizarNota(item.n1);
    const n2 = item.tri2 !== undefined ? normalizarNota(item.tri2) : normalizarNota(item.n2);
    const n3 = item.tri3 !== undefined ? normalizarNota(item.tri3) : normalizarNota(item.n3);

    if (n1 !== null) { somaTri1 += n1; qtdTri1++; }
    if (n2 !== null) { somaTri2 += n2; qtdTri2++; }
    if (n3 !== null) { somaTri3 += n3; qtdTri3++; }
  });

  const mediaTri1 = qtdTri1 > 0 ? Number((somaTri1 / qtdTri1).toFixed(1)) : null;
  const mediaTri2 = qtdTri2 > 0 ? Number((somaTri2 / qtdTri2).toFixed(1)) : null;
  const mediaTri3 = qtdTri3 > 0 ? Number((somaTri3 / qtdTri3).toFixed(1)) : null;

  const ctx = canvas.getContext("2d");
  graficoEvolucao = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [{
        label: "Média Geral",
        data: [mediaTri1, mediaTri2, mediaTri3],
        borderColor: "#6c3483",
        backgroundColor: "rgba(108, 52, 131, 0.15)",
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: "#f1c40f",
        pointBorderColor: "#5b2c6f",
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: { stepSize: 1 }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.raw;
              if (val === null || val === undefined) return "Sem notas registradas";
              return `Média Geral: ${val.toFixed(1).replace(".", ",")}`;
            }
          }
        }
      }
    }
  });
}

function atualizarGraficoFaltas() {
  const canvas = document.getElementById("graficoFaltasTrimestres");
  const estadoContainer = document.getElementById("estadoFaltas");
  const cardFaltas = document.getElementById("card-faltas");

  if (!canvas) return;

  if (graficoFaltas) {
    graficoFaltas.destroy();
  }

  let faltasTri1 = 0;
  let faltasTri2 = 0;
  let faltasTri3 = 0;

  dadosBoletim.forEach(item => {
    let faltasTri;
    if (Array.isArray(item.faltas)) {
      faltasTri = item.faltas;
    } else {
      faltasTri = [item.f1 || 0, item.f2 || 0, item.f3 || 0];
    }

    faltasTri1 += Number(faltasTri[0]) || 0;
    faltasTri2 += Number(faltasTri[1]) || 0;
    faltasTri3 += Number(faltasTri[2]) || 0;
  });

  const totalFaltasAcumuladas = faltasTri1 + faltasTri2 + faltasTri3;
  const LIMITE_REFERENCIA_INTERNA = 350;

  // Avaliação interna de risco
  if (estadoContainer && cardFaltas) {
    estadoContainer.textContent = "";
    if (totalFaltasAcumuladas >= LIMITE_REFERENCIA_INTERNA) {
      const badge = document.createElement("span");
      badge.className = "badge-perigo";
      badge.textContent = "Perigo";
      estadoContainer.appendChild(badge);
      cardFaltas.classList.add("card-perigo");
    } else {
      cardFaltas.classList.remove("card-perigo");
    }
  }

  const ctx = canvas.getContext("2d");
  graficoFaltas = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [{
        label: "Faltas do Trimestre",
        data: [faltasTri1, faltasTri2, faltasTri3],
        backgroundColor: "#f1c40f",
        borderColor: "#d4ac0d",
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Faltas: ${context.raw}`;
            }
          }
        }
      }
    }
  });
}

function atualizarGraficos() {
  atualizarGraficoMedias();
  atualizarGraficoEvolucao();
  atualizarGraficoFaltas();
}