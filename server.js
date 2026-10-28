const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Database helper functions
function readDatabase() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler banco de dados:', err);
    return { clientes: [], equipamentos: [], manutencoes: [], chamados: [] };
  }
}

function writeDatabase(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Erro ao salvar banco de dados:', err);
    return false;
  }
}

// Request body parser
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('JSON Inválido'));
      }
    });
    req.on('error', reject);
  });
}

// Response helper
function sendJSON(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // --- API ROUTES ---
  if (pathname.startsWith('/api/')) {
    const db = readDatabase();

    // GET /api/stats
    if (pathname === '/api/stats' && method === 'GET') {
      const totalEquipamentos = db.equipamentos.length;
      const totalManutencoes = db.manutencoes.length;
      const chamadosAbertos = db.chamados.filter(c => c.status !== 'Concluído').length;
      const emManutencao = db.equipamentos.filter(e => e.status === 'Em Manutenção' || e.status === 'Defeito').length;

      return sendJSON(res, 200, {
        totalEquipamentos,
        totalManutencoes,
        chamadosAbertos,
        emManutencao,
        totalClientes: db.clientes.length
      });
    }

    // GET /api/clientes
    if (pathname === '/api/clientes' && method === 'GET') {
      return sendJSON(res, 200, db.clientes);
    }

    // GET /api/equipamentos
    if (pathname === '/api/equipamentos' && method === 'GET') {
      let result = db.equipamentos;
      if (parsedUrl.query.id) {
        result = result.filter(e => e.id.toLowerCase() === parsedUrl.query.id.toLowerCase());
      }
      if (parsedUrl.query.clienteId) {
        result = result.filter(e => e.clienteId === parsedUrl.query.clienteId);
      }
      return sendJSON(res, 200, result);
    }

    // GET /api/equipamentos/:id
    const eqMatch = pathname.match(/^\/api\/equipamentos\/([^/]+)$/);
    if (eqMatch && method === 'GET') {
      const eqId = decodeURIComponent(eqMatch[1]);
      const equipamento = db.equipamentos.find(e => e.id.toLowerCase() === eqId.toLowerCase() || e.tag.toLowerCase() === eqId.toLowerCase());
      if (!equipamento) {
        return sendJSON(res, 404, { error: 'Equipamento não encontrado' });
      }
      return sendJSON(res, 200, equipamento);
    }

    // POST /api/equipamentos (Cadastrar novo ar-condicionado)
    if (pathname === '/api/equipamentos' && method === 'POST') {
      try {
        const body = await parseBody(req);
        if (!body.tag || !body.clienteId) {
          return sendJSON(res, 400, { error: 'TAG e Cliente são obrigatórios' });
        }

        const cliente = db.clientes.find(c => c.id === body.clienteId);
        const newEq = {
          id: 'EQ-' + Date.now().toString(36).toUpperCase(),
          tag: body.tag.trim().toUpperCase(),
          clienteId: body.clienteId,
          clienteNome: cliente ? cliente.nome : 'Não especificado',
          marcaModelo: body.marcaModelo || 'Marca/Modelo não informado',
          capacidade: body.capacidade || '12.000 BTUs',
          gasRefrigerante: body.gasRefrigerante || 'R-410A',
          voltagem: body.voltagem || '220V',
          localizacao: body.localizacao || 'Setor Geral',
          numeroSerie: body.numeroSerie || 'N/A',
          status: body.status || 'Operando',
          dtUltimaManutencao: body.dtUltimaManutencao || new Date().toISOString().slice(0, 10),
          dtProximaManutencao: body.dtProximaManutencao || '',
          tipoInstalacao: body.tipoInstalacao || 'Split Hi-Wall',
          qrcodeUrl: ''
        };

        db.equipamentos.unshift(newEq);
        writeDatabase(db);
        return sendJSON(res, 201, newEq);
      } catch (err) {
        return sendJSON(res, 400, { error: err.message });
      }
    }

    // GET /api/manutencoes
    if (pathname === '/api/manutencoes' && method === 'GET') {
      let result = db.manutencoes;
      if (parsedUrl.query.equipamentoId) {
        result = result.filter(m => m.equipamentoId.toLowerCase() === parsedUrl.query.equipamentoId.toLowerCase());
      }
      // Ordena pelas mais recentes
      result.sort((a, b) => new Date(b.dataExecucao) - new Date(a.dataExecucao));
      return sendJSON(res, 200, result);
    }

    // POST /api/manutencoes (Registrar Nova Manutenção)
    if (pathname === '/api/manutencoes' && method === 'POST') {
      try {
        const body = await parseBody(req);
        if (!body.equipamentoId || !body.descricao) {
          return sendJSON(res, 400, { error: 'ID do equipamento e Descrição do serviço são obrigatórios' });
        }

        const now = new Date();
        const dataFormatada = now.getFullYear() + '-' +
          String(now.getMonth() + 1).padStart(2, '0') + '-' +
          String(now.getDate()).padStart(2, '0') + ' ' +
          String(now.getHours()).padStart(2, '0') + ':' +
          String(now.getMinutes()).padStart(2, '0');

        const newManutencao = {
          id: 'MAN-' + Date.now().toString(36).toUpperCase(),
          equipamentoId: body.equipamentoId,
          tecnicoNome: body.tecnicoNome || 'Técnico Responsável',
          dataExecucao: body.dataExecucao || dataFormatada,
          tipoManutencao: body.tipoManutencao || 'Preventiva (PMOC)',
          descricao: body.descricao,
          pecasTrocadas: body.pecasTrocadas || 'Nenhuma peça substituída',
          checklist: body.checklist || {
            limpezaFiltros: true,
            limpezaSerpentinas: true,
            desobstrucaoDreno: true,
            checagemEletrica: true,
            medicaoGas: true,
            aplicacaoBactericida: true
          },
          statusEquipamentoAposManutencao: body.statusEquipamentoAposManutencao || 'Operando'
        };

        db.manutencoes.unshift(newManutencao);

        // Atualiza os dados do equipamento correspondente
        const eq = db.equipamentos.find(e => e.id.toLowerCase() === body.equipamentoId.toLowerCase());
        if (eq) {
          eq.dtUltimaManutencao = newManutencao.dataExecucao.slice(0, 10);
          if (body.dtProximaManutencao) {
            eq.dtProximaManutencao = body.dtProximaManutencao;
          } else {
            // Default 30 dias para preventiva mensal PMOC
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + 30);
            eq.dtProximaManutencao = nextDate.toISOString().slice(0, 10);
          }
          eq.status = newManutencao.statusEquipamentoAposManutencao;
        }

        writeDatabase(db);
        return sendJSON(res, 201, { manutencao: newManutencao, equipamento: eq });
      } catch (err) {
        return sendJSON(res, 400, { error: err.message });
      }
    }

    // GET /api/chamados
    if (pathname === '/api/chamados' && method === 'GET') {
      let result = db.chamados;
      if (parsedUrl.query.equipamentoId) {
        result = result.filter(c => c.equipamentoId.toLowerCase() === parsedUrl.query.equipamentoId.toLowerCase());
      }
      return sendJSON(res, 200, result);
    }

    // POST /api/chamados (Solicitar Suporte / Chamar Técnico)
    if (pathname === '/api/chamados' && method === 'POST') {
      try {
        const body = await parseBody(req);
        if (!body.equipamentoId || !body.descricao) {
          return sendJSON(res, 400, { error: 'ID do equipamento e Descrição do problema são obrigatórios' });
        }

        const now = new Date();
        const dataFormatada = now.getFullYear() + '-' +
          String(now.getMonth() + 1).padStart(2, '0') + '-' +
          String(now.getDate()).padStart(2, '0') + ' ' +
          String(now.getHours()).padStart(2, '0') + ':' +
          String(now.getMinutes()).padStart(2, '0');

        const newChamado = {
          id: 'CHAM-' + Date.now().toString(36).toUpperCase(),
          equipamentoId: body.equipamentoId,
          solicitante: body.solicitante || 'Cliente Local',
          contato: body.contato || 'Não informado',
          descricao: body.descricao,
          dataAbertura: dataFormatada,
          status: 'Aberto',
          prioridade: body.prioridade || 'Normal'
        };

        db.chamados.unshift(newChamado);

        // Se o chamado for grave ou o cliente relatar parada, atualizamos o status do aparelho
        if (body.paradaEquipamento) {
          const eq = db.equipamentos.find(e => e.id.toLowerCase() === body.equipamentoId.toLowerCase());
          if (eq) eq.status = 'Em Manutenção';
        }

        writeDatabase(db);
        return sendJSON(res, 201, newChamado);
      } catch (err) {
        return sendJSON(res, 400, { error: err.message });
      }
    }

    // PATCH /api/chamados/:id (Mudar status do chamado)
    const chamadoMatch = pathname.match(/^\/api\/chamados\/([^/]+)$/);
    if (chamadoMatch && method === 'PATCH') {
      try {
        const chamadoId = chamadoMatch[1];
        const body = await parseBody(req);
        const chamado = db.chamados.find(c => c.id.toLowerCase() === chamadoId.toLowerCase());

        if (!chamado) {
          return sendJSON(res, 404, { error: 'Chamado não encontrado' });
        }

        if (body.status) chamado.status = body.status;
        writeDatabase(db);
        return sendJSON(res, 200, chamado);
      } catch (err) {
        return sendJSON(res, 400, { error: err.message });
      }
    }

    return sendJSON(res, 404, { error: 'Rota de API não encontrada' });
  }

  // --- STATIC FILE SERVING ---
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // If scanning via query like /equipamento?id=...
  if (pathname === '/equipamento' || pathname === '/equipamento/') {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA client-side routing
      const indexFallback = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexFallback, (errIndex, content) => {
        if (errIndex) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Página não encontrada');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (errFile, content) => {
      if (errFile) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Erro ao carregar arquivo');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 PMOC ClimaSync Server Iniciado com Sucesso!`);
  console.log(`📍 Endereço local: http://localhost:${PORT}`);
  console.log(`📱 Teste escaneando ou abrindo: http://localhost:${PORT}/equipamento?id=EQ-ITU-001`);
  console.log(`======================================================\n`);
});
