document.addEventListener('DOMContentLoaded', () => {

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

  // --- FORMATAÇÃO DE MOEDA ---
  function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // --- CÁLCULO BASE DE JUROS COMPOSTOS (REUTILIZÁVEL) ---
  function calcularRendimento(valorInicial, aporteMensal, taxaAnual, anos) {
    const meses = anos * 12;
    const taxaMensal = Math.pow(1 + (taxaAnual / 100), 1 / 12) - 1;
    let totalInvestido = valorInicial;
    let saldo = valorInicial;

    for (let m = 1; m <= meses; m++) {
      saldo = saldo * (1 + taxaMensal) + aporteMensal;
      totalInvestido += aporteMensal;
    }
    
    return { saldo, totalInvestido, totalJuros: saldo - totalInvestido };
  }

  // --- 1. CÁLCULO DE JUROS GERAIS ---
  document.getElementById('btnCalcularJuros').addEventListener('click', () => {
    const P = parseFloat(document.getElementById('valorInicial').value) || 0;
    const PMT = parseFloat(document.getElementById('aporteMensal').value) || 0;
    const taxaAno = parseFloat(document.getElementById('taxaJuros').value) || 0;
    const anos = parseInt(document.getElementById('periodoAnos').value) || 0;

    if (taxaAno <= 0 || anos <= 0) {
      alert("Preencha taxas e períodos válidos."); return;
    }

    const { saldo, totalInvestido, totalJuros } = calcularRendimento(P, PMT, taxaAno, anos);
    const resDiv = document.getElementById('resultadoJuros');
    resDiv.style.display = 'block';
    resDiv.innerHTML = `
      <p><strong>Valor Final Acumulado:</strong> ${formatarMoeda(saldo)}</p>
      <p><strong>Total Investido:</strong> ${formatarMoeda(totalInvestido)}</p>
      <p><strong>Total em Juros Ganho:</strong> ${formatarMoeda(totalJuros)}</p>
    `;
  });

  // --- 2. CÁLCULO DE FINANCIAMENTO ---
  document.getElementById('btnCalcularFinanciamento').addEventListener('click', () => {
    const valor = parseFloat(document.getElementById('valorEmprestimo').value) || 0;
    const taxaMensal = parseFloat(document.getElementById('taxaFinanciamento').value) || 0;
    const n = parseInt(document.getElementById('numeroParcelas').value) || 0;

    if (valor <= 0 || taxaMensal <= 0 || n <= 0) {
      alert("Preencha todos os campos corretamente."); return;
    }

    const i = taxaMensal / 100;
    const parcela = valor * ((i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1));
    const totalPago = parcela * n;
    const totalJuros = totalPago - valor;

    const resDiv = document.getElementById('resultadoFinanciamento');
    resDiv.style.display = 'block';
    resDiv.innerHTML = `
      <p><strong>Valor da Parcela Mensal:</strong> ${formatarMoeda(parcela)}</p>
      <p><strong>Total Pago ao Final:</strong> ${formatarMoeda(totalPago)}</p>
      <p><strong>Total de Juros do Financiamento:</strong> ${formatarMoeda(totalJuros)}</p>
    `;
  });

  // --- 3. CÁLCULO DE TESOURO SELIC ---
  document.getElementById('btnCalcularSelic').addEventListener('click', () => {
    const P = parseFloat(document.getElementById('valorInicialSelic').value) || 0;
    const PMT = parseFloat(document.getElementById('aporteMensalSelic').value) || 0;
    const taxaSelic = parseFloat(document.getElementById('taxaSelic').value) || 0;
    const anos = parseInt(document.getElementById('periodoAnosSelic').value) || 0;

    if (taxaSelic <= 0 || anos <= 0) {
      alert("Preencha a taxa e o período válidos."); return;
    }

    const { saldo, totalInvestido, totalJuros } = calcularRendimento(P, PMT, taxaSelic, anos);
    const resDiv = document.getElementById('resultadoSelic');
    resDiv.style.display = 'block';
    resDiv.innerHTML = `
      <p><strong>Bruto Acumulado (Selic):</strong> ${formatarMoeda(saldo)}</p>
      <p><strong>Total Investido:</strong> ${formatarMoeda(totalInvestido)}</p>
      <p><strong>Total em Juros Ganho:</strong> ${formatarMoeda(totalJuros)}</p>
      <p style="font-size: 0.8rem; color: #7f8c8d; margin-top: 10px;">*Valores brutos, sem desconto de Imposto de Renda e IOF.</p>
    `;
  });

  // --- 4. CÁLCULO DE RENDIMENTO CDI ---
  document.getElementById('btnCalcularCDI').addEventListener('click', () => {
    const P = parseFloat(document.getElementById('valorInicialCDI').value) || 0;
    const PMT = parseFloat(document.getElementById('aporteMensalCDI').value) || 0;
    const taxaCDI = parseFloat(document.getElementById('taxaCDI').value) || 0;
    const percentualCDI = parseFloat(document.getElementById('percentualCDI').value) || 0;
    const anos = parseInt(document.getElementById('periodoAnosCDI').value) || 0;

    if (taxaCDI <= 0 || percentualCDI <= 0 || anos <= 0) {
      alert("Preencha as taxas e o período válidos."); return;
    }

    // A Taxa efetiva é a (Taxa CDI * Percentual) / 100. Ex: 10.4 * 1.10 = 11.44% ao ano
    const taxaEfetivaAno = taxaCDI * (percentualCDI / 100);

    const { saldo, totalInvestido, totalJuros } = calcularRendimento(P, PMT, taxaEfetivaAno, anos);
    const resDiv = document.getElementById('resultadoCDI');
    resDiv.style.display = 'block';
    resDiv.innerHTML = `
      <p><strong>Rentabilidade Efetiva ao Ano:</strong> ${taxaEfetivaAno.toFixed(2)}%</p>
      <p><strong>Bruto Acumulado (CDB/LCI):</strong> ${formatarMoeda(saldo)}</p>
      <p><strong>Total Investido:</strong> ${formatarMoeda(totalInvestido)}</p>
      <p><strong>Total em Juros Ganho:</strong> ${formatarMoeda(totalJuros)}</p>
      <p style="font-size: 0.8rem; color: #7f8c8d; margin-top: 10px;">*Valores brutos. Fique atento às taxas de IR (exceto LCI/LCA que são isentas).</p>
    `;
  });

});