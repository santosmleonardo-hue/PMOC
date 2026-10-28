# ❄️ PMOC ClimaSync - Gestão de Manutenção de Ar-Condicionado via QR Code

Aplicativo completo, moderno e **100% autônomo** (independente de Base44 ou qualquer plataforma proprietária) para integração entre empresas de climatização/manutenção e seus clientes via leitura de QR Code.

---

## 🚀 Como Iniciar o Aplicativo

### Opção 1: Dois cliques (Mais rápido)
Dê um duplo clique no arquivo:
👉 `iniciar_app.bat`

### Opção 2: Pelo Terminal / Prompt de Comando
Abra a pasta `pmoc-app` no terminal e execute:
```bash
node server.js
```
O aplicativo iniciará em: **`http://localhost:3000`**

---

## 📱 Como Funciona o Fluxo do QR Code

1. **Adesivo no Equipamento**:
   - Cada ar-condicionado recebe uma etiqueta adesiva com seu QR Code único apontando para `http://seu-dominio.com/equipamento?id=ID_DO_AR`.
   - Você pode gerar e imprimir todas as etiquetas prontas na aba **"Imprimir Etiquetas"** do sistema.

2. **Leitura pelo Cliente (Visão Pública / Simplificada)**:
   - Ao escanear o QR Code pelo celular (ou alternar o perfil no topo para **"Cliente"**):
     - Exibe a TAG, Marca/Modelo, Localização e Nº de Série.
     - Indicador visual de status (*Operando Normal* / *Em Manutenção*).
     - **Última Manutenção** e **Próxima Manutenção Programada** (PMOC).
     - **Botão Rápido "Solicitar Suporte / Chamar Técnico"**: abre modal direto para relatar o problema.
     - **Botão "Chamar no WhatsApp"**: gera mensagem direta para o WhatsApp da equipe técnica com a TAG e dados do aparelho já pré-preenchidos.

3. **Leitura pelo Técnico / Admin (Visão Restrita)**:
   - Usuários com perfil **"Técnico"** ou **"Admin"** (selecionável no topo do app):
     - Ficha técnica completa de engenharia (Fluido R-410A/R-32, Voltagem, Tipo de Instalação, BTUs).
     - **Histórico Completo de Manutenções e O.S.** em formato Timeline com laudo técnico, data/hora e peças substituídas.
     - Botão **"+ Registrar Nova Manutenção (O.S.)"**:
       - Checklist de rotina PMOC (limpeza de serpentina, dreno, elétrica, medição de pressão, bactericida).
       - Relatório de serviço executado e peças trocadas.
       - Atualização automática da data da próxima manutenção e status do equipamento.

4. **Painel Geral (Dashboard Operacional)**:
   - Métricas em tempo real: Total de aparelhos, manutenções realizadas, chamados pendentes e contratos.
   - Tabela geral com busca instantânea e filtro por cliente/contrato.
   - Central de atendimento aos chamados de clientes (botão para marcar como concluído/resolvido).

---

## 🗄️ Estrutura do Banco de Dados (`data/db.json`)

Os dados estão estruturados e persistidos localmente no arquivo `data/db.json` em padrão JSON:

- **`clientes`**: Lista de contratos/empresas atendidas (ex: *Câmara Municipal de Itu*, *Vital Ambiental Jundiaí*, *Vital Ambiental Pedreira*).
- **`equipamentos`**: Lista de condicionadores de ar com TAG, número de série, cliente, especificações técnicas, datas de manutenção e status.
- **`manutencoes`**: Ordens de serviço e histórico técnico (Relacionamento N:1 com Equipamentos).
- **`chamados`**: Solicitações de reparo e suporte abertas pelos clientes.

---

## 🛠️ Tecnologias Utilizadas (Sem dependências externas pesadas)

- **Backend**: Node.js Nativo (sem necessidade de baixar milhares de pacotes `node_modules`).
- **Frontend**: HTML5, Tailwind CSS, Lucide Icons.
- **QR Code Generator**: QRCode.js embutido para renderização das etiquetas adesivas.
- **QR Code Scanner**: Html5-QRCode para leitura em tempo real via câmera de smartphones e notebooks.
