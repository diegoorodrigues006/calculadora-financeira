document.addEventListener('DOMContentLoaded', () => {

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

  function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // --- NOVA FUNÇÃO: Tabela Regressiva de Imposto de Renda ---
  function obterAliquotaIR(meses) {
    if (meses <= 6) return 0.225;       // Até 180 dias: 22,5%
    if (meses <= 12) return 0.20;       // De 181 a 360 dias: 20%
    if (meses <= 24) return 0.175;      // De 361 a 720 dias: 17,5%
    return 0.15;                        // Acima de 720 dias: 15%
  }

  let graficos = {};

  function gerarGrafico(canvasId, labelsAnos, dadosInvestido, dadosJuros) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (graficos[canvasId]) graficos[canvasId].destroy();

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
    let labelsAnos = [];
    let dadosInvestido = [];
    let dadosJuros = [];

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

  // --- 1. JUROS GERAIS ---
  document.getElementById('btnCalcularJuros').addEventListener('click', () => {
    const P = parseFloat(document.getElementById('valorInicial').value) || 0;
    const PMT = parseFloat(document.getElementById('aporteMensal').value) || 0;
    const taxaAno = parseFloat(document.getElementById('taxaJuros').value) || 0;
    const anos = parseInt(document.getElementById('periodoAnos').value) || 0;

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
  });

  // --- 2. FINANCIAMENTO ---
  document.getElementById('btnCalcularFinanciamento').addEventListener('click', () => {
    const valor = parseFloat(document.getElementById('valorEmprestimo').value) || 0;
    const taxaMensal = parseFloat(document.getElementById('taxaFinanciamento').value) || 0;
    const n = parseInt(document.getElementById('numeroParcelas').value) || 0;

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
  });

  // --- 3. TESOURO SELIC (COM IR E IPCA) ---
  document.getElementById('btnCalcularSelic').addEventListener('click', () => {
    const P = parseFloat(document.getElementById('valorInicialSelic').value) || 0;
    const PMT = parseFloat(document.getElementById('aporteMensalSelic').value) || 0;
    const taxaSelic = parseFloat(document.getElementById('taxaSelic').value) || 0;
    const ipca = parseFloat(document.getElementById('ipcaSelic').value) || 0;
    const anos = parseInt(document.getElementById('periodoAnosSelic').value) || 0;

    if (taxaSelic <= 0 || anos <= 0) { alert("Preencha a taxa e o período válidos."); return; }

    const meses = anos * 12;
    const { saldo, totalInvestido, totalJuros, labelsAnos, dadosInvestido, dadosJuros } = calcularRendimento(P, PMT, taxaSelic, anos);
    
    // Lógica de Imposto de Renda
    const aliquotaIR = obterAliquotaIR(meses);
    const valorIR = totalJuros * aliquotaIR;
    const saldoLiquido = saldo - valorIR;

    // Lógica de Poder de Compra (Descontando IPCA)
    let infoIPCA = '';
    if (ipca > 0) {
      const poderDeCompra = saldoLiquido / Math.pow(1 + (ipca / 100), anos);
      infoIPCA = `<br><p style="color: #c0392b;"><strong>Poder de Compra Real (Líquido - Inflação):</strong> ${formatarMoeda(poderDeCompra)}</p>
                  <p class="hint">Este é o valor que o seu saldo líquido final representaria em "dinheiro de hoje".</p>`;
    }
    
    const resDiv = document.getElementById('resultadoSelic');
    resDiv.style.display = 'block';
    resDiv.querySelector('.textos-resultado').innerHTML = `
      <p><strong>Valor Bruto Acumulado:</strong> ${formatarMoeda(saldo)}</p>
      <p><strong>Total Investido:</strong> ${formatarMoeda(totalInvestido)}</p>
      <p><strong>Imposto de Renda (${(aliquotaIR * 100).toFixed(1)}% sobre o lucro):</strong> -${formatarMoeda(valorIR)}</p>
      <p style="color: #27ae60;"><strong>Saldo LÍQUIDO (Na sua conta):</strong> ${formatarMoeda(saldoLiquido)}</p>
      ${infoIPCA}
    `;
    gerarGrafico('graficoSelic', labelsAnos, dadosInvestido, dadosJuros);
  });

  // --- 4. RENDIMENTO CDI (COM IR E IPCA) ---
  document.getElementById('btnCalcularCDI').addEventListener('click', () => {
    const P = parseFloat(document.getElementById('valorInicialCDI').value) || 0;
    const PMT = parseFloat(document.getElementById('aporteMensalCDI').value) || 0;
    const taxaCDI = parseFloat(document.getElementById('taxaCDI').value) || 0;
    const percentualCDI = parseFloat(document.getElementById('percentualCDI').value) || 0;
    const ipca = parseFloat(document.getElementById('ipcaCDI').value) || 0;
    const anos = parseInt(document.getElementById('periodoAnosCDI').value) || 0;

    if (taxaCDI <= 0 || percentualCDI <= 0 || anos <= 0) { alert("Preencha as taxas e o período válidos."); return; }

    const meses = anos * 12;
    const taxaEfetivaAno = taxaCDI * (percentualCDI / 100);
    const { saldo, totalInvestido, totalJuros, labelsAnos, dadosInvestido, dadosJuros } = calcularRendimento(P, PMT, taxaEfetivaAno, anos);
    
    // Lógica de Imposto de Renda
    const aliquotaIR = obterAliquotaIR(meses);
    const valorIR = totalJuros * aliquotaIR;
    const saldoLiquido = saldo - valorIR;

    // Lógica de Poder de Compra (Descontando IPCA)
    let infoIPCA = '';
    if (ipca > 0) {
      const poderDeCompra = saldoLiquido / Math.pow(1 + (ipca / 100), anos);
      infoIPCA = `<br><p style="color: #c0392b;"><strong>Poder de Compra Real (Líquido - Inflação):</strong> ${formatarMoeda(poderDeCompra)}</p>
                  <p class="hint">Este é o valor que o seu saldo líquido final representaria em "dinheiro de hoje".</p>`;
    }
    
    const resDiv = document.getElementById('resultadoCDI');
    resDiv.style.display = 'block';
    resDiv.querySelector('.textos-resultado').innerHTML = `
      <p><strong>Rentabilidade Bruta ao Ano:</strong> ${taxaEfetivaAno.toFixed(2)}%</p>
      <p><strong>Valor Bruto Acumulado:</strong> ${formatarMoeda(saldo)}</p>
      <p><strong>Total Investido:</strong> ${formatarMoeda(totalInvestido)}</p>
      <p><strong>Imposto de Renda (${(aliquotaIR * 100).toFixed(1)}% sobre o lucro):</strong> -${formatarMoeda(valorIR)}</p>
      <p style="color: #27ae60;"><strong>Saldo LÍQUIDO (Na sua conta):</strong> ${formatarMoeda(saldoLiquido)}</p>
      ${infoIPCA}
    `;
    gerarGrafico('graficoCDI', labelsAnos, dadosInvestido, dadosJuros);
  });

});