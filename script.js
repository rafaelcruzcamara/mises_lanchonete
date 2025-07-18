// Produtos da lanchonete com categorias
const produtos = [
  { id: 1, nome: "Pastel de carne", preco: 5.00, categoria: "pastel" },
  { id: 2, nome: "Pastel de queijo", preco: 5.00, categoria: "pastel" },
  { id: 3, nome: "Pastel de frango", preco: 5.00, categoria: "pastel" },
  { id: 4, nome: "Pastelão", preco: 10.00, categoria: "pastel" },
  { id: 5, nome: "Refrigerante Lata", preco: 5.00, categoria: "bebida" },
  { id: 6, nome: "Suco Natural", preco: 7.00, categoria: "bebida" },
  { id: 7, nome: "Açai", preco: 10.00, categoria: "sobremesa" }
];

// Variáveis globais
let pedido = [];
let relatorio = JSON.parse(localStorage.getItem('relatorioPedidos') || '[]');

// Função para atualizar a lista de produtos
function atualizarProdutos() {
  const prodDiv = document.getElementById('produtos');
  prodDiv.innerHTML = '';
  
  produtos.forEach(prod => {
    const el = document.createElement('div');
    el.className = 'produto-item';
    el.innerHTML = `
      <span class="produto-nome">${prod.nome}</span>
      <span class="produto-preco">R$ ${prod.preco.toFixed(2)}</span>
      <input type="number" min="1" value="1" id="qtd_${prod.id}" style="width:40px; margin-right: 8px;">

      <button onclick="adicionarAoPedido(${prod.id})">Adicionar</button>
    `;
    prodDiv.appendChild(el);
  });
}

// Funções para manipular o pedido
window.adicionarAoPedido = function(prodId) {
  const qtd = parseInt(document.getElementById('qtd_' + prodId).value) || 1;
  const prod = produtos.find(p => p.id === prodId);
  let item = pedido.find(i => i.id === prodId);
  
  if (item) {
    item.qtd += qtd;
  } else {
    pedido.push({ ...prod, qtd });
  }
  
  atualizarPedido();
};

window.removerDoPedido = function(prodId) {
  pedido = pedido.filter(i => i.id !== prodId);
  atualizarPedido();
};

function atualizarPedido() {
  const pedDiv = document.getElementById('pedido');
  pedDiv.innerHTML = '';
  let total = 0;
  
  pedido.forEach(item => {
    const subtotal = item.preco * item.qtd;
    total += subtotal;
    
    const el = document.createElement('div');
    el.className = 'pedido-item';
    el.innerHTML = `
      <span>${item.qtd}x ${item.nome}</span>
      <span>R$ ${subtotal.toFixed(2)}
        <button style="margin-left:8px;" onclick="removerDoPedido(${item.id})">Remover</button>
      </span>
    `;
    pedDiv.appendChild(el);
  });
  
  document.getElementById('pedidoTotal').textContent = 'Total: R$ ' + total.toFixed(2);
};

window.limparPedido = function() {
  pedido = [];
  atualizarPedido();
};

// Função para imprimir notas fiscais
// Função principal de impressão - NOVA VERSÃO
window.imprimirNotaCompleta = function() {
  if (pedido.length === 0) {
    alert("Adicione produtos ao pedido!");
    return;
  }

  // 1. Agrupa os itens por categoria CORRETAMENTE
  const categorias = {};
  pedido.forEach(item => {
    // Verifica se a categoria existe no produto
    if (!item.categoria) {
      console.error("Produto sem categoria:", item);
      item.categoria = "outros"; // Categoria padrão se não existir
    }
    
    if (!categorias[item.categoria]) {
      categorias[item.categoria] = [];
    }
    categorias[item.categoria].push(item);
  });

  // 2. Prepara o conteúdo completo para impressão
  let conteudoCompleto = `
    <html>
      <head>
        <title>Nota Fiscal Completa</title>
        <style>
          @page { size: 58mm auto; margin: 0; }
          body { 
            width: 58mm;
            margin: 0;
            padding: 2mm;
            font-family: Arial;
            font-size: 13px;
          }
          .categoria {
            page-break-after: always;
            margin-bottom: 30mm;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
          .header {
            text-align: center;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
  `;

  // 3. Adiciona cada categoria ao conteúdo
  Object.keys(categorias).forEach(categoria => {
    const itens = categorias[categoria];
    const totalCategoria = itens.reduce((sum, item) => sum + (item.preco * item.qtd), 0);
    
    conteudoCompleto += `
  <div class="categoria" style="page-break-after: always; padding-bottom: 20mm; border-bottom: 1px dashed #000; margin-bottom: 10mm;">
    <div class="header">
      <h2 style="margin: 0; font-size: 16px;">${categoria.toUpperCase()}</h2>
      <div style="font-size: 12px; margin-bottom: 5px;">${new Date().toLocaleString()}</div>
    </div>
    
    ${itens.map(item => `
      <div class="item">
        <span>${item.qtd}x ${item.nome}</span>
        <span>R$ ${(item.preco * item.qtd).toFixed(2)}</span>
      </div>
    `).join('')}  
    
    <div style="text-align:right;font-weight:bold;margin-top:8px;">
      Total: R$ ${totalCategoria.toFixed(2)} <br> <br> <br> 
    </div>

    <div style="margin-top: 15px; text-align: center; font-size: 10px;">
       .<br> 
      .<br>
      <br>
    --------------------------
      <br> 
      .<br>
      .<br> 
      *<br> 
    </div> 
  </div>
`;

  });

  conteudoCompleto += `</body></html>`;

  // 4. Imprime tudo de uma vez
  const win = window.open('', '_blank', 'width=58mm,height=600');
  win.document.write(conteudoCompleto);
  win.document.close();

  // 5. Atualiza o relatório
  const data = new Date();
  relatorio.push({
    data: data.toLocaleString(),
    itens: [...pedido],
    total: pedido.reduce((sum, item) => sum + (item.preco * item.qtd), 0)
  });
  localStorage.setItem('relatorioPedidos', JSON.stringify(relatorio));
  atualizarRelatorio();

  // 6. Limpa o pedido após impressão
  setTimeout(() => {
    win.print();
    setTimeout(() => {
      win.close();
      limparPedido();
    }, 500);
  }, 1000);
};

function adicionarAoRelatorio() {
  const data = new Date();
  relatorio.push({
    data: data.toLocaleString(),
    itens: [...pedido],
    total: pedido.reduce((sum, item) => sum + (item.preco * item.qtd), 0)
  });
  localStorage.setItem('relatorioPedidos', JSON.stringify(relatorio));
  atualizarRelatorio();
}

function imprimirCategoria(categoria, itens) {
  const total = itens.reduce((sum, item) => sum + (item.preco * item.qtd), 0);
  const win = window.open('', '_blank', 'width=58mm,height=400');
  
  win.document.write(`
    <html>
      <head>
        <title>Nota ${categoria}</title>
        <style>
          body {
            width: 58mm;
            margin: 0;
            padding: 5px;
            font-family: Arial;
            font-size: 14px;
            line-height: 1.4;
          }
          h2 {
            text-align: center;
            color: #c62828;
            margin: 5px 0;
            font-size: 16px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
          }
          .total {
            font-weight: bold;
            text-align: right;
            margin-top: 10px;
            border-top: 1px dashed #000;
            padding-top: 5px;
          }
          .data {
            text-align: center;
            font-size: 12px;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <h2>LANCHONETE MISES</h2>
        <h2>${categoria.toUpperCase()}</h2>
        <div class="data">${new Date().toLocaleString()}</div>
        
        ${itens.map(item => `
          <div class="item">
            <span>${item.qtd}x ${item.nome}</span>
            <span>R$ ${(item.preco * item.qtd).toFixed(2)}</span>
          </div>
        `).join('')}
        
        <div class="total">TOTAL: R$ ${total.toFixed(2)}</div>
        
        <script>
          setTimeout(() => {
            window.print();
            setTimeout(() => window.close(), 300);
          }, 500);
        </script>
      </body>
    </html>
  `);
  win.document.close();
}

// Funções do relatório
function atualizarRelatorio() {
  const relDiv = document.getElementById('relatorio');
  
  if (relatorio.length === 0) {
    relDiv.innerHTML = '<em>Nenhum pedido registrado ainda.</em>';
    document.getElementById('relatorioTotal').textContent = 'Total do Dia: R$ 0,00';
    return;
  }
  
  let html = '';
  let totalDia = 0;
  
  relatorio.forEach((p, i) => {
    totalDia += p.total;
    html += `
      <div style="margin-bottom:15px;">
        <div><strong>#${i+1}</strong> - ${p.data}</div>
        <div>${p.itens.map(item => `${item.qtd}x ${item.nome}`).join(', ')}</div>
        <div style="font-weight:bold;">Total: R$ ${p.total.toFixed(2)}</div>
      </div>
    `;
  });
  
  relDiv.innerHTML = html;
  document.getElementById('relatorioTotal').textContent = 'Total do Dia: R$ ' + totalDia.toFixed(2);
}

window.imprimirRelatorio = function() {
  if (relatorio.length === 0) {
    alert('Nenhum pedido registrado ainda.');
    return;
  }

  let totalDia = relatorio.reduce((sum, pedido) => sum + pedido.total, 0);
  let win = window.open('', '_blank', 'width=600,height=800');
  
  win.document.write(`
    <html>
      <head>
        <title>Relatório do Dia</title>
        <style>
          body { font-family: Arial; margin: 20px; }
          h2 { color: #c62828; text-align: center; }
          .pedido { margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
          .total { font-weight: bold; text-align: right; margin-top: 20px; font-size: 18px; }
        </style>
      </head>
      <body>
        <h2>Relatório do Dia - Lanchonete Mises</h2>
        
        ${relatorio.map((pedido, i) => `
          <div class="pedido">
            <div><strong>Pedido #${i+1}</strong> - ${pedido.data}</div>
            <div>${pedido.itens.map(item => `${item.qtd}x ${item.nome}`).join(', ')}</div>
            <div><strong>Total:</strong> R$ ${pedido.total.toFixed(2)}</div>
          </div>
        `).join('')}
        
        <div class="total">TOTAL DO DIA: R$ ${totalDia.toFixed(2)}</div>
        
        <script>
          setTimeout(() => {
            window.print();
            setTimeout(() => window.close(), 300);
          }, 500);
        </script>
      </body>
    </html>
  `);
  win.document.close();
};

window.limparRelatorio = function() {
  if (confirm("Tem certeza que deseja limpar o relatório do dia?")) {
    relatorio = [];
    localStorage.removeItem('relatorioPedidos');
    atualizarRelatorio();
  }
};

// Inicialização
atualizarProdutos();
atualizarPedido();
atualizarRelatorio();

// Fecha modal ao clicar fora
document.getElementById('modalNota').onclick = function(e) {
  if (e.target === this) fecharModal();
};

window.fecharModal = function() {
  document.getElementById('modalNota').style.display = 'none';
};
