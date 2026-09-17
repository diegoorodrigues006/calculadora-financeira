# 💰 Calculadora Financeira

Uma aplicação web moderna, responsiva e interativa desenvolvida com **Vanilla JavaScript, HTML5 e CSS3**, projetada para auxiliar em tomadas de decisão de investimentos, financiamentos e planejamento financeiro pessoal.

![Badge HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Badge CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Badge JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Badge Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chart.js&logoColor=white)

---

## 🚀 Funcionalidades Principais

* **📈 Simulador de Juros Compostos (Investimentos Gerais):** Projeção de crescimento patrimonial considerando valor inicial, aportes mensais recorrentes e taxa de juros anual.
* **🏠 Simulação de Financiamentos:** Cálculo da tabela Price/SAC para parcelas mensais, montante total pago e juros acumulados do empréstimo.
* **🏛️ Tesouro Selic & IPCA:** Simulação de rendimento com desconto automatizado da alíquota regressiva do **Imposto de Renda** e cálculo opcional do **Poder de Compra Real** ajustado pela inflação.
* **💼 Rendimentos atrelados ao CDI (CDB / LCI):** Simulação de investimentos baseados na taxa CDI e percentual contratado (ex: 110% do CDI), incluindo IR e IPCA.
* **📊 Gráficos Dinâmicos:** Geração de gráficos interativos empilhados por ano (Valor Investido vs. Juros Ganhos) utilizando a biblioteca **Chart.js**.
* **🕒 Histórico Recente:** Armazenamento automático das últimas simulações utilizando o **LocalStorage** do navegador.
* **🧮 Calculadora Aritmética Integrada:** Uma mini-calculadora na barra lateral com suporte completo a cliques do mouse e **entrada via teclado** (números, operadores, `Enter`, `Backspace` e `Esc`).
* **🌙 Dark Mode Dinâmico:** Alternância de tema fluida com animação personalizada, imagens de fundo adaptativas e persistência da escolha do usuário.

---

## 🛠️ Tecnologias Utilizadas

* **HTML5 Semantic** (Estruturação de abas e formulários)
* **CSS3 Moderno** (Variáveis CSS customizadas, Flexbox, Grid Layout, Media Queries)
* **Vanilla JavaScript (ES6+)** (Manipulação de DOM, algoritmos financeiros, eventos de teclado/mouse)
* **Chart.js** (Renderização de gráficos de barras empilhadas)

---

## 📂 Estrutura do Projeto

```text
calculadora-financeira/
│
├── public/
│   └── assets/
│       └── black-theme.jpg
│
├── src/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── script.js
│
├── index.html
└── README.md

 ```
## 🖥️ Como Executar o Projeto Localmente

Basta ter um navegador web moderno (Chrome, Firefox, Edge, Safari).

1. Clone o repositório para a sua máquina:
   ```bash
   git clone https://github.com/diegoorodrigues006/calculadora-financeira

👨‍💻 Autor

Desenvolvido por Diego Rodrigues.

Sinta-se à vontade para abrir issues ou enviar pull requests com melhorias!
