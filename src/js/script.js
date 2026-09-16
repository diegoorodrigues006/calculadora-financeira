document.addEventListener('DOMContentLoaded', () => {

  // --- TEMA E DARK MODE ---
  const themeCheckbox = document.getElementById('themeToggleCheckbox');
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    themeCheckbox.checked = false;
  } else {
    themeCheckbox.checked = true;
  }
  themeCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    }
  });

  // --- HISTÓRICO (LOCAL STORAGE) ---
  let historico = JSON.parse(localStorage.getItem('calc_historico')) || [];

  function renderizarHistorico() {
    const lista = document.getElementById('listaHistorico');
    lista.innerHTML = '';
    if (historico.length === 0) {
      lista.innerHTML = '<p class="hint">Nenhum cálculo recente.</p>';
      return;
    }
    historico.forEach(item => {
      const li = document.createElement('li');
      li.className = 'historico-item';
      li.innerHTML = `
        <div class="historico-titulo">${item.tipo}</div>
        <div class="historico-data">${item.data}</div>
        <div class="historico-valor">${item.resumo}</div>
      `;
      lista.appendChild(li);
    });
  }

  function adicionarHistorico(tipo, resumo) {
    const data = new Date().toLocaleString('pt-BR');
    historico.unshift({ tipo, resumo, data });
    if (historico.length > 5) historico.pop(); // Mantém apenas os 5 últimos
    localStorage.setItem('calc_historico', JSON.stringify(historico));
    renderizarHistorico();
  }

  document.getElementById('btnLimparHistorico').addEventListener('click', () => {
    historico = [];
    localStorage.removeItem('calc_historico');
    renderizarHistorico();
  });

  renderizarHistorico(); // Chama ao carregar a página

  // --- GERAÇÃO DE PDF ---
  document.querySelectorAll('.btn-pdf').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const resultadoDiv = e.target.closest('.resultado');
      const btnElement = e.target;
      
      // Esconde o botão para que não apareça impresso no PDF
      btnElement.style.display = 'none'; 
      
      const opt = {
        margin:       10,
        filename:     'relatorio-calculo.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(resultadoDiv).save().then(() => {
        // Mostra o botão novamente após salvar
        btnElement.style.display = 'block'; 
      });
    });
  });

  // --- CONTROLE DAS ABAS ---
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });

  // --- MÁSCARA DE MOEDA (R$) ---
  document.querySelectorAll('.mascara-moeda').forEach(input => {
    input.addEventListener('input', (e) => {
      let valor = e.target.value.replace(/\D/g, "");
      if (valor === "") { e.target.value = ""; return; }
      valor = (valor / 100).toFixed(2) + ""; 
      valor = valor.replace(".", ",");
      valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
      e.target.value = "R$ " + valor;
    });
  });

  function lerValor(id) {
    const input = document.getElementById(id);
    if (!input.value) return 0;
    if (input.classList.contains('mascara-moeda')) {
      let numStr = input.value.replace('R$ ', '').replaceAll('.', '').replace(',', '.');
      return parseFloat(numStr) || 0;
    }
    return parseFloat(input.value) || 0;
  }

  // --- BOTÃO LIMPAR CAMPOS ---
  document.querySelectorAll('.btn-limpar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if(e.target.id === 'btnLimparHistorico') return; // Ignora o botão do histórico
      const abaAtual = e.target.closest('.tab-content');
      abaAtual.querySelectorAll('input').forEach(input => input.value = '');
      const resDiv = abaAtual.querySelector('.resultado');
      if(resDiv) resDiv.style.display = 'none';
      const canvas = abaAtual.querySelector('canvas');
      if (canvas && graficos[canvas.id]) {
        graficos[canvas.id].destroy();
        delete graficos[canvas.id];
      }
    });
  });

  // --- FUNÇÕES COMPARTILHADAS ---
  function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function obterAliquotaIR(meses) {
    if (meses <= 6) return 0.225;
    if (meses <= 12) return 0.20;
    if (meses <= 24) return 0.175;
    return 0.15;
  }

  let graficos = {};
  function gerarGrafico(canvasId, labelsAnos, dadosInvestido, dadosJuros) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (graficos[canvasId]) graficos[canvasId].destroy();

    const corTexto = document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#2c3e50';
    Chart.defaults.color = corTexto;

    graficos[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labelsAnos,
        datasets: [
          { label: 'Valor Investido', data: dadosInvestido, backgroundColor: '#3498db' },
          { label: 'Juros Ganhos', data: dadosJuros, backgroundColor: '#27ae60' }
        ]
      },
      options: { responsive: true, scales: { x: { stacked: true }, y: { stacked: true } } }
    });
  }

  function calcularRendimento(valorInicial, aporteMensal, taxaAnual, anos) {
    const meses = anos * 12;
    const taxaMensal = Math.pow(1 + (taxaAnual / 100), 1 / 12) - 1;
    let totalInvestido = valorInicial;
    let saldo = valorInicial;
    let labelsAnos = []; let dadosInvestido = []; let dadosJuros = [];

    for (let m = 1; m <= meses; m++) {
      saldo = saldo * (1 + taxaMensal) + aporteMensal;
      totalInvestido += aporteMensal;
      if (m % 12 === 0) {
        labelsAnos.push(`Ano ${m / 12}`);
        dadosInvestido.push(totalInvestido);
        dadosJuros.push(saldo - totalInvestido);
      }
    }
    return { saldo, totalInvestido, totalJuros: saldo - totalInvestido, labelsAnos, dadosInvestido, dadosJuros };
  }

  // --- CÁLCULOS ---
  document.getElementById('btnCalcularJuros').addEventListener('click', () => {
    const P = lerValor('valorInicial'); const PMT = lerValor('aporteMensal');
    const taxaAno = lerValor('taxaJuros'); const anos = lerValor('periodoAnos');
    if (taxaAno <= 0 || anos <= 0) { alert("Preencha taxas e períodos válidos."); return; }

    const { saldo, totalInvestido, totalJuros, labelsAnos, dadosInvestido, dadosJuros } = calcularRendimento(P, PMT, taxaAno, anos);
    
    const resDiv = document.getElementById('resultadoJuros');
    resDiv.style.display = 'block';
    resDiv.querySelector('.textos-resultado').innerHTML = `
      <p><strong>Valor Final Acumulado:</strong> ${formatarMoeda(saldo)}</p>
      <p><strong>Total Investido:</strong> ${formatarMoeda(totalInvestido)}</p>
      <p><strong>Total em Juros Ganho:</strong> ${formatarMoeda(totalJuros)}</p>
    `;
    gerarGrafico('graficoJuros', labelsAnos, dadosInvestido, dadosJuros);
    adicionarHistorico('Juros Compostos', `Saldo: ${formatarMoeda(saldo)}`);
  });

  document.getElementById('btnCalcularFinanciamento').addEventListener('click', () => {
    const valor = lerValor('valorEmprestimo'); const taxaMensal = lerValor('taxaFinanciamento'); const n = lerValor('numeroParcelas');
    if (valor <= 0 || taxaMensal <= 0 || n <= 0) { alert("Preencha corretamente."); return; }

    const i = taxaMensal / 100;
    const parcela = valor * ((i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1));
    const totalPago = parcela * n;
    
    const resDiv = document.getElementById('resultadoFinanciamento');
    resDiv.style.display = 'block';
    resDiv.querySelector('.textos-resultado').innerHTML = `
      <p><strong>Valor da Parcela Mensal:</strong> ${formatarMoeda(parcela)}</p>
      <p><strong>Total Pago ao Final:</strong> ${formatarMoeda(totalPago)}</p>
      <p><strong>Total de Juros do Financiamento:</strong> ${formatarMoeda(totalPago - valor)}</p>
    `;
    adicionarHistorico('Financiamento', `Parcela: ${formatarMoeda(parcela)}`);
  });

  document.getElementById('btnCalcularSelic').addEventListener('click', () => {
    const P = lerValor('valorInicialSelic'); const PMT = lerValor('aporteMensalSelic');
    const taxaSelic = lerValor('taxaSelic'); const ipca = lerValor('ipcaSelic'); const anos = lerValor('periodoAnosSelic');
    if (taxaSelic <= 0 || anos <= 0) { alert("Preencha a taxa e o período válidos."); return; }

    const meses = anos * 12;
    const { saldo, totalInvestido, totalJuros, labelsAnos, dadosInvestido, dadosJuros } = calcularRendimento(P, PMT, taxaSelic, anos);
    const aliquotaIR = obterAliquotaIR(meses); const valorIR = totalJuros * aliquotaIR; const saldoLiquido = saldo - valorIR;

    let infoIPCA = '';
    if (ipca > 0) infoIPCA = `<br><p style="color: #c0392b;"><strong>Poder de Compra Real:</strong> ${formatarMoeda(saldoLiquido / Math.pow(1 + (ipca / 100), anos))}</p>`;
    
    const resDiv = document.getElementById('resultadoSelic');
    resDiv.style.display = 'block';
    resDiv.querySelector('.textos-resultado').innerHTML = `
      <p><strong>Valor Bruto Acumulado:</strong> ${formatarMoeda(saldo)}</p>
      <p><strong>Total Investido:</strong> ${formatarMoeda(totalInvestido)}</p>
      <p><strong>Imposto de Renda (${(aliquotaIR * 100).toFixed(1)}%):</strong> -${formatarMoeda(valorIR)}</p>
      <p style="color: #27ae60;"><strong>Saldo LÍQUIDO:</strong> ${formatarMoeda(saldoLiquido)}</p>
      ${infoIPCA}
    `;
    gerarGrafico('graficoSelic', labelsAnos, dadosInvestido, dadosJuros);
    adicionarHistorico('Tesouro Selic', `Líquido: ${formatarMoeda(saldoLiquido)}`);
  });

  document.getElementById('btnCalcularCDI').addEventListener('click', () => {
    const P = lerValor('valorInicialCDI'); const PMT = lerValor('aporteMensalCDI');
    const taxaCDI = lerValor('taxaCDI'); const percentualCDI = lerValor('percentualCDI');
    const ipca = lerValor('ipcaCDI'); const anos = lerValor('periodoAnosCDI');
    if (taxaCDI <= 0 || percentualCDI <= 0 || anos <= 0) { alert("Preencha as taxas e o período válidos."); return; }

    const meses = anos * 12; const taxaEfetivaAno = taxaCDI * (percentualCDI / 100);
    const { saldo, totalInvestido, totalJuros, labelsAnos, dadosInvestido, dadosJuros } = calcularRendimento(P, PMT, taxaEfetivaAno, anos);
    const aliquotaIR = obterAliquotaIR(meses); const valorIR = totalJuros * aliquotaIR; const saldoLiquido = saldo - valorIR;

    let infoIPCA = '';
    if (ipca > 0) infoIPCA = `<br><p style="color: #c0392b;"><strong>Poder de Compra Real:</strong> ${formatarMoeda(saldoLiquido / Math.pow(1 + (ipca / 100), anos))}</p>`;
    
    const resDiv = document.getElementById('resultadoCDI');
    resDiv.style.display = 'block';
    resDiv.querySelector('.textos-resultado').innerHTML = `
      <p><strong>Rentabilidade Bruta ao Ano:</strong> ${taxaEfetivaAno.toFixed(2)}%</p>
      <p><strong>Valor Bruto Acumulado:</strong> ${formatarMoeda(saldo)}</p>
      <p><strong>Total Investido:</strong> ${formatarMoeda(totalInvestido)}</p>
      <p><strong>Imposto de Renda (${(aliquotaIR * 100).toFixed(1)}%):</strong> -${formatarMoeda(valorIR)}</p>
      <p style="color: #27ae60;"><strong>Saldo LÍQUIDO:</strong> ${formatarMoeda(saldoLiquido)}</p>
      ${infoIPCA}
    `;
    gerarGrafico('graficoCDI', labelsAnos, dadosInvestido, dadosJuros);
    adicionarHistorico('Rendimento CDI', `Líquido: ${formatarMoeda(saldoLiquido)}`);
  });
});