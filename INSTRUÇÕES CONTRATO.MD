# 📜 SISTEMA DE CONTRATOS — ALCANCE IMPORTS
Manual operacional completo: links de acesso, fluxos de assinatura e clausulado jurídico.

---

## 🔗 LINKS DE ACESSO

### 👑 PAINEL DO ADMINISTRADOR (Você — Lojista)

| Situação | Link |
|----------|------|
| **Acesso local (desenvolvimento)** | `http://localhost:5173` |
| **Parâmetro para liberar botão Admin** | `http://localhost:5173?adm=true` |

> **Como entrar no painel Admin:**
> 1. Abra o link `http://localhost:5173?adm=true`
> 2. Um botão "Admin" aparecerá na barra do topo
> 3. Clique em Admin → Digite o PIN (padrão: **908077**)
> 4. Vá para a aba **Contratos** para gerenciar tudo

> **Atalho alternativo (sem parâmetro):** clique 5 vezes rápidas no logo da loja para revelar o botão Admin.

---

### 👤 LINK DO CLIENTE (Para assinar o contrato)

O link de assinatura é **único por contrato** e gerado automaticamente ao criar um rascunho:

```
http://localhost:5173/#sign-contract=CTR-XXXXXX
```

**Exemplo real:**
```
http://localhost:5173/#sign-contract=CTR-2699276
```

Quando o cliente abre esse link:
1. A tela de assinatura abre automaticamente com todos os dados do pedido
2. O cliente revisa itens, valores, datas e cláusulas
3. (Opcional) Envia documentos (RG/CNH + comprovante)
4. Assina digitalmente com o dedo ou mouse
5. Ao finalizar, o status muda para **`signed`** no painel Admin

---

### 📋 COMO GERAR O LINK DO CLIENTE (Passo a Passo)

```
Admin → Aba "Contratos" → Botão "Novo Contrato" (ícone +)
  └→ Preencher: Nome, CPF, Telefone, Endereço
  └→ Adicionar produtos ao contrato
  └→ Escolher: PIX / Cartão / Fiado
  └→ (Opcional) Ativar Permuta (Trade-in)
  └→ Clicar "Criar Rascunho"
       └→ Contrato criado com status PENDING
       └→ Aparece botão 🔗 (ícone de link) na linha do contrato
       └→ Clique no ícone → Modal com o link copiável
       └→ Envie o link pro cliente via WhatsApp
```

---

## 📊 MAPA DE STATUS DOS CONTRATOS

| Status | Significado | Próxima Ação |
|--------|-------------|--------------|
| `pending` | Aguardando assinatura do cliente | Enviar link ao cliente |
| `signed` | Cliente assinou digitalmente | Admin revisar e aprovar |
| `approved` | Aprovado, em importação | Aguardar chegada |
| `active` | Ativo com parcelas em andamento | Monitorar pagamentos |
| `delivered` | Aparelho entregue | Finalizar contrato |
| `completed` | Totalmente concluído e quitado | Arquivado |
| `overdue` | Parcela do fiado em atraso | Cobrar cliente |
| `cancelled` | Cancelado | — |

---

## 2. FLUXOS ESPECIAIS

### A. Permuta (Trade-In)
Ativado no rascunho pelo lojista. O valor do aparelho usado é **deduzido automaticamente** do total.

> **Cláusula inserida automaticamente no contrato:**
> *"O Contratante entrega à Contratada um dispositivo usado como parte de pagamento: **[Marca Modelo Capacidade]**, cor **[Cor]**, IMEI **[IMEI]**, estado **[Condição]**, avaliado em **[Valor]**. O Contratante declara ser o legítimo proprietário do bem, livre de ônus ou registros de furto/roubo."*

**Requisitos obrigatórios:**
- IMEI do aparelho a ser entregue
- Foto do aparelho (comprimida automaticamente em JPEG)

---

### B. Fiado / Venda a Prazo
O sistema gera um cronograma de parcelas com controle de amortização.

> **Cláusula inserida automaticamente:**
> *"A aquisição é efetuada mediante parcelamento direto com o lojista: entrada de **[Valor]** no ato da assinatura, saldo dividido em **[N]** parcelas mensais sucessivas. O não pagamento importará no vencimento antecipado e multa de 2% sobre o montante em atraso."*

**Recursos do Fiado:**
- Cronograma completo de parcelas exibido no contrato
- Lojista registra pagamentos parciais ou totais por parcela
- Saldo devedor atualizado em tempo real
- Histórico de pagamentos com data e valor

---

### C. Upload de Documentos
Pode ser feito **pelo Admin** (ao criar o rascunho) **OU** pelo **cliente** (na tela de assinatura).

| Documento | Quem pode enviar |
|-----------|-----------------|
| RG / CNH — Frente | Admin ou Cliente |
| RG / CNH — Verso | Admin ou Cliente |
| Comprovante de Residência | Admin ou Cliente |

> Imagens são comprimidas automaticamente (max 600px, JPEG 60%) antes de salvar.

---

## 3. ALERTAS AUTOMÁTICOS

- 🟡 **Vencimento próximo:** badge piscante quando faltam ≤ 3 dias para expirar o contrato
- 🔴 **Parcela em atraso:** badge na linha do contrato com fiado vencido
- 🖨️ **Imprimir/PDF:** botão disponível no detalhe de cada contrato (abre janela de impressão limpa)
- 🗑️ **Excluir contrato:** confirmação obrigatória antes de excluir

---

## 4. ARQUIVO DE DADOS

Os contratos são salvos em:
```
src/contracts-data.json
```

A cada assinatura ou atualização de status, o arquivo é sincronizado automaticamente via API local Vite (`/api/save-all-contracts`). Também há backup no `localStorage` do navegador.

---

## 5. CLAUSULADO PADRÃO COMPLETO

### Cláusula 1ª — Das Partes
- **Contratada:** Alcance Imports (Lojista/intermediador)
- **Contratante:** Cliente identificado por Nome, CPF, Telefone e Endereço

### Cláusula 2ª — Do Objeto
- Encomenda, importação e aquisição dos equipamentos eletrônicos especificados (modelo, capacidade, cor e quantidade)

### Cláusula 3ª — Dos Valores e Pagamento
- Valor total a ser pago conforme modalidade escolhida (PIX, Cartão ou Fiado)

### Cláusula 4ª — Do Prazo e Entrega
- Prazo de 10 a 15 dias úteis, entregue no endereço cadastrado

### Cláusula 5ª — Da Garantia
- Garantia oficial Apple de 1 ano internacional a partir da primeira ativação

### Cláusula 6ª — Disposições Gerais
- Cancelamento após envio internacional pode incorrer em custos operacionais
- Assinatura digital válida nos termos da MP 2.200-2/2001 e Lei 14.063/2020
