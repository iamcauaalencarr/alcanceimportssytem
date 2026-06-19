import { jsPDF } from 'jspdf';
import type { Contract, ContractAudit } from '../types';

/**
 * Generates and downloads a beautifully styled A4 contract PDF client-side using jsPDF.
 * Implements proper margins, cards, borders, legal clauses, and dynamic footer page counts.
 */
export function generateContractPDF(contract: Contract, storeName: string): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageHeight = 297;
  const margin = 15;
  const contentWidth = 180;
  let y = 15;

  const paymentMethodLabels: Record<string, string> = {
    pix: 'PIX / Transferência Bancária',
    card: 'Cartão de Crédito',
    fiado: 'Fiado / A Prazo',
    custom: 'Misto / Personalizado'
  };

  const conditionLabels: Record<string, string> = {
    new: 'Novo (lacrado)',
    seminew: 'Seminovo (excelente)',
    good: 'Bom estado',
    regular: 'Estado regular',
    defective: 'Com defeito'
  };

  const formatDateBR = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const [year, month, day] = dateStr.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr || '—';
    }
  };

  const checkPageSpace = (neededHeight: number) => {
    // Leave 15mm margin at bottom for the page-number footer
    if (y + neededHeight > pageHeight - margin - 10) {
      doc.addPage();
      y = margin;
      drawSubsequentHeader();
    }
  };

  const drawSubsequentHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Contrato de Encomenda nº ${contract.id} | Loja: ${storeName}`, margin, y);
    y += 3;
    doc.setDrawColor(241, 245, 249); // slate-100 line
    doc.setLineWidth(0.2);
    doc.line(margin, y, 195, y);
    y += 8;
  };

  const drawMainHeader = () => {
    // Top primary accent block
    doc.setFillColor(30, 58, 138); // Navy blue #1E3A8A
    doc.rect(margin, y, contentWidth, 3, 'F');
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('CONTRATO DE ENCOMENDA', margin, y);

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.text(`IDENTIFICAÇÃO Nº: ${contract.id}`, margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 195, y, { align: 'right' });

    y += 5;
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Intermediadora: ${storeName}`, margin, y);

    y += 4;
    doc.setDrawColor(226, 232, 240); // slate-200 line
    doc.setLineWidth(0.25);
    doc.line(margin, y, 195, y);
    y += 8;
  };

  const drawSectionTitle = (title: string, color: [number, number, number] = [30, 58, 138]) => {
    checkPageSpace(15);
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(margin, y, 3, 5.5, 'F'); // left accent color block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(title, margin + 5, y + 4.2);
    y += 8;
  };

  const drawImageSafe = (
    docInstance: jsPDF,
    dataUrl: string | undefined,
    format: 'PNG' | 'JPEG',
    xPos: number,
    yPos: number,
    wSize: number,
    hSize: number
  ): boolean => {
    if (!dataUrl || !dataUrl.startsWith('data:')) return false;
    try {
      docInstance.addImage(dataUrl, format, xPos, yPos, wSize, hSize);
      return true;
    } catch (e) {
      console.error('Error drawing image in PDF:', e);
      return false;
    }
  };

  // --- BEGIN DOCUMENT GENERATION ---

  // 1. Title Page Header
  drawMainHeader();

  // 2. Client Details Section (Styled inside a Card)
  drawSectionTitle('DADOS DO CLIENTE');
  
  const wrappedAddr = doc.splitTextToSize(contract.clientAddress || '—', contentWidth - 30);
  const totalAddrLines = wrappedAddr.length;
  const clientCardHeight = 18 + (totalAddrLines * 4.5);
  
  checkPageSpace(clientCardHeight + 5);
  
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, contentWidth, clientCardHeight, 2, 2, 'FD');
  
  doc.setFontSize(9);
  
  // Left labels
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('Nome:', margin + 5, y + 5.5);
  doc.text('CPF / Documento:', margin + 5, y + 10.5);
  doc.text('WhatsApp:', margin + 5, y + 15.5);
  doc.text('Endereço:', margin + 5, y + 20.5);
  
  // Values
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(contract.clientName, margin + 35, y + 5.5);
  doc.text(contract.clientCPF, margin + 35, y + 10.5);
  doc.text(contract.clientPhone, margin + 35, y + 15.5);
  doc.text(wrappedAddr, margin + 35, y + 20.5);
  
  y += clientCardHeight + 8;

  // 3. Equipment ordered table (Modern Styled Grid)
  drawSectionTitle('EQUIPAMENTOS ENCOMENDADOS');
  checkPageSpace(25);

  // Table Headers
  doc.setFillColor(30, 58, 138); // Navy blue #1E3A8A
  doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  
  doc.text('Modelo', margin + 4, y + 4.8);
  doc.text('Capacidade', margin + 70, y + 4.8);
  doc.text('Cor', margin + 105, y + 4.8);
  doc.text('Qtd.', margin + 140, y + 4.8, { align: 'center' });
  doc.text('Preço Unit.', margin + 176, y + 4.8, { align: 'right' });
  y += 7.5;

  // Alternate backgrounds & rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  
  contract.items.forEach((item, idx) => {
    checkPageSpace(8);
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252); // slate-50 background
      doc.rect(margin, y, contentWidth, 7, 'F');
    }
    
    doc.text(item.model, margin + 4, y + 4.8);
    doc.text(item.storage, margin + 70, y + 4.8);
    doc.text(item.colorName, margin + 105, y + 4.8);
    doc.text(String(item.quantity), margin + 140, y + 4.8, { align: 'center' });
    doc.text(item.cashPrice, margin + 176, y + 4.8, { align: 'right' });
    
    y += 7.2;
    doc.setDrawColor(241, 245, 249); // slate-100 horizontal separator line
    doc.setLineWidth(0.2);
    doc.line(margin, y, 195, y);
  });
  y += 5;

  // 4. Contract values & terms (Styled Card)
  drawSectionTitle('VALORES E DADOS DE PAGAMENTO');
  
  const valuesList = [
    { label: 'Valor Total à Vista (PIX):', value: contract.cashTotal, isHighlight: true },
    { label: 'Forma de Pagamento:', value: paymentMethodLabels[contract.paymentMethod] || contract.paymentMethod },
    { label: 'Data de Início:', value: formatDateBR(contract.startDate) },
    { label: 'Previsão de Entrega:', value: formatDateBR(contract.deliveryDate) },
    { label: 'Expiração do Contrato:', value: formatDateBR(contract.expirationDate) },
  ];

  const valuesCardHeight = 4 + (valuesList.length * 5.2);
  checkPageSpace(valuesCardHeight + 5);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, contentWidth, valuesCardHeight, 2, 2, 'FD');

  let innerValuesY = y + 5;
  valuesList.forEach(info => {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', info.isHighlight ? 'bold' : 'normal');
    if (info.isHighlight) {
      doc.setTextColor(37, 99, 235); // Blue-600
    } else {
      doc.setTextColor(71, 85, 105); // slate-600
    }
    doc.text(info.label, margin + 5, innerValuesY);
    
    doc.setFont('helvetica', 'bold');
    if (info.isHighlight) {
      doc.setTextColor(37, 99, 235); // Blue-600
    } else {
      doc.setTextColor(15, 23, 42); // slate-900
    }
    doc.text(info.value, margin + 65, innerValuesY);
    innerValuesY += 5.2;
  });

  y += valuesCardHeight + 8;

  // Split visual observations and audit trail
  let visualObs = '';
  let auditTrailStr = '';
  if (contract.observations) {
    const parts = contract.observations.split('--- AUDITORIA DE ASSINATURA ---');
    visualObs = parts[0].trim();
    if (parts[1]) {
      auditTrailStr = parts[1].trim();
    }
  }

  if (visualObs) {
    checkPageSpace(15);
    const wrappedObs = doc.splitTextToSize(visualObs, contentWidth - 30);
    const obsHeight = 6 + (wrappedObs.length * 4.5);
    
    doc.setFillColor(254, 254, 254);
    doc.setDrawColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, obsHeight, 2, 2, 'FD');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Observações:', margin + 5, y + 5.5);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(wrappedObs, margin + 35, y + 5.5);
    y += obsHeight + 8;
  }

  // 5. LEGAL CLAUSES SECTION (As requested by user, styled formally)
  drawSectionTitle('CLÁUSULAS E DISPOSIÇÕES CONTRATUAIS', [15, 23, 42]); // slate-900 (Dark navy)

  const clauses = [
    {
      title: 'Cláusula 1ª — Das Partes',
      text: `CONTRATADA (Intermediadora): ${storeName}, responsável por prestar serviços de encomenda, importação e comercialização do produto.\nCONTRATANTE (Comprador): ${contract.clientName}, qualificado devidamente na seção "Dados do Cliente" deste contrato.`
    },
    {
      title: 'Cláusula 2ª — Do Objeto do Contrato',
      text: `O presente instrumento tem por objeto a encomenda, importação e subsequente entrega do(s) equipamento(s) eletrônico(s) discriminados na seção "Equipamentos Encomendados".`
    },
    {
      title: 'Cláusula 3ª — Dos Valores e Forma de Pagamento',
      text: contract.paymentMethod === 'pix'
        ? `O CONTRATANTE obriga-se a realizar o pagamento total à vista no valor de ${contract.cashTotal} mediante transferência bancária (PIX) em favor da CONTRATADA antes do despacho internacional do produto.`
        : contract.paymentMethod === 'card'
        ? `O CONTRATANTE obriga-se a realizar o pagamento total no valor de ${contract.installmentTotal} no cartão de crédito em até 12 parcelas, assumindo as taxas cobradas pela operadora do cartão.`
        : contract.paymentMethod === 'fiado'
        ? `A aquisição é pactuada sob o regime de parcelamento direto (fiado): entrada de ${contract.fiadoDownPayment || 'R$ 0,00'} na assinatura, e o saldo financiado em ${contract.installments?.length || 0} parcelas mensais sucessivas. O inadimplemento de qualquer parcela importará no vencimento antecipado do saldo total e incidência de multa moratória de 2% sobre o montante em atraso.`
        : `A aquisição dar-se-á mediante condições especiais / mistas de pagamento. O CONTRATANTE pagará os valores conforme as datas, parcelas e métodos acertados no cronograma de pagamentos.`
    }
  ];

  if (contract.hasTrade && contract.tradeDevice) {
    const trade = contract.tradeDevice;
    clauses.push({
      title: 'Cláusula 4ª — Da Permuta (Trade-In)',
      text: `Como parte de pagamento, o CONTRATANTE entrega à CONTRATADA o dispositivo usado: ${trade.brand} ${trade.model} ${trade.storage} (${trade.color}), IMEI: ${trade.imei}, avaliado de comum acordo em ${trade.evaluatedValue}. O CONTRATANTE atesta que o aparelho possui procedência lícita e é livre de registros de bloqueio, furto ou roubo.`
    });
  }

  const baseClauseNum = contract.hasTrade ? 5 : 4;

  clauses.push({
    title: `Cláusula ${baseClauseNum}ª — Do Prazo e Condições de Entrega`,
    text: `O prazo estimado para importação e entrega é até o dia ${formatDateBR(contract.deliveryDate)}. O contrato é vigente de ${formatDateBR(contract.startDate)} até ${formatDateBR(contract.expirationDate)}. Eventuais prorrogações motivadas por fiscalização aduaneira ou atraso na malha logística de transporte serão comunicadas.`
  });

  clauses.push({
    title: `Cláusula ${baseClauseNum + 1}ª — Da Garantia Legal e Contratual`,
    text: `O dispositivo importado possui garantia do fabricante (Apple Inc.) de 1 (um) ano internacional, iniciada e contada a partir do momento da primeira ativação e conexão del aparelho.`
  });

  clauses.push({
    title: `Cláusula ${baseClauseNum + 2}ª — Disposições Finais`,
    text: `${baseClauseNum + 2}.1. A rescisão do contrato após o despacho internacional por iniciativa do comprador sujeitará o mesmo a arcar com taxas de devolução aduaneiras.\n${baseClauseNum + 2}.2. As partes declaram a assinatura eletrônica deste instrumento juridicamente válida e equivalente à assinatura de próprio punho, nos termos da Medida Provisória nº 2.200-2/2001 e da Lei nº 14.063/2020.`
  });

  clauses.forEach(clause => {
    const wrappedClauseText = doc.splitTextToSize(clause.text, contentWidth);
    const clauseHeight = 4 + (wrappedClauseText.length * 3.6);
    checkPageSpace(clauseHeight + 6);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(clause.title, margin, y);
    y += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(wrappedClauseText, margin, y);
    y += (wrappedClauseText.length * 3.6) + 3.5;
  });
  y += 4;

  // 6. Trade-in Device Section (If exists)
  if (contract.hasTrade && contract.tradeDevice) {
    drawSectionTitle('PERMUTA DE APARELHO (TRADE-IN)', [124, 58, 237]); // Purple
    
    const trade = contract.tradeDevice;
    const tradeInfo = [
      { label: 'Aparelho Entregue:', value: `${trade.brand} ${trade.model} ${trade.storage} — ${trade.color}` },
      { label: 'IMEI / Serial:', value: trade.imei },
      { label: 'Estado de Conservação:', value: conditionLabels[trade.condition] || trade.condition },
      { label: 'Valor de Avaliação:', value: trade.evaluatedValue, isBold: true, color: [34, 197, 94] as [number, number, number] }
    ];

    const tradeCardHeight = 4 + (tradeInfo.length * 5.2) + (trade.photo ? 40 : 0) + (trade.description ? 10 : 0);
    checkPageSpace(tradeCardHeight + 5);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y, contentWidth, tradeCardHeight, 2, 2, 'FD');

    let innerTradeY = y + 5.5;
    tradeInfo.forEach(info => {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', info.isBold ? 'bold' : 'normal');
      doc.setTextColor(info.color ? info.color[0] : 71, info.color ? info.color[1] : 85, info.color ? info.color[2] : 105);
      doc.text(info.label, margin + 5, innerTradeY);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(info.color ? info.color[0] : 15, info.color ? info.color[1] : 23, info.color ? info.color[2] : 42);
      doc.text(info.value, margin + 65, innerTradeY);
      innerTradeY += 5.2;
    });

    if (trade.description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Observações Permuta:', margin + 5, innerTradeY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(trade.description, margin + 65, innerTradeY);
      innerTradeY += 6.5;
    }

    if (trade.photo) {
      drawImageSafe(doc, trade.photo, 'JPEG', margin + 65, innerTradeY + 1, 60, 32);
      innerTradeY += 35;
    }

    y += tradeCardHeight + 8;
  }

  // 7. Installments / Fiado Section (If exists)
  if (
    (contract.paymentMethod === 'fiado' || contract.paymentMethod === 'custom') &&
    contract.installments &&
    contract.installments.length > 0
  ) {
    const isCustom = contract.paymentMethod === 'custom';
    drawSectionTitle(isCustom ? 'CRONOGRAMA DE PAGAMENTO MISTO' : 'CRONOGRAMA DE PARCELAS (FIADO)', [217, 119, 6]);
    
    checkPageSpace(15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const downPayment = contract.fiadoDownPayment || 'R$ 0,00';
    doc.text(`Valor Pago em Entrada / Sinal: ${downPayment}`, margin + 2, y);
    y += 5;

    // Headers
    checkPageSpace(10);
    doc.setFillColor(30, 58, 138); // Navy
    doc.roundedRect(margin, y, contentWidth, 6, 1.5, 1.5, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(isCustom ? 'Parcela / Forma' : 'Parcela', margin + 4, y + 4.2);
    doc.text('Vencimento', margin + 60, y + 4.2, { align: 'center' });
    doc.text('Valor', margin + 100, y + 4.2, { align: 'right' });
    doc.text('Pago', margin + 140, y + 4.2, { align: 'right' });
    doc.text('Status', margin + 176, y + 4.2, { align: 'right' });
    y += 6.5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);

    contract.installments.forEach((inst, idx) => {
      checkPageSpace(8);
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 7, 'F');
      }
      
      const titleText = isCustom ? `${inst.id} — ${inst.method || 'Pagamento'}` : inst.id;
      doc.text(titleText, margin + 4, y + 4.8);
      doc.text(formatDateBR(inst.dueDate), margin + 60, y + 4.8, { align: 'center' });
      doc.text(inst.value, margin + 100, y + 4.8, { align: 'right' });
      doc.text(inst.paidValue || 'R$ 0,00', margin + 140, y + 4.8, { align: 'right' });
      
      let statusColor = [100, 116, 139];
      let statusLabel = 'Pendente';
      if (inst.status === 'paid') {
        statusColor = [22, 163, 74];
        statusLabel = 'Pago';
      } else if (inst.status === 'overdue') {
        statusColor = [220, 38, 38];
        statusLabel = 'Em atraso';
      }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(statusLabel, margin + 176, y + 4.8, { align: 'right' });
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      
      y += 7;
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(margin, y, 195, y);
    });
    y += 5;
  }

  // 8. Client Documents Section
  if (contract.documents && (contract.documents.rgFront || contract.documents.rgBack || contract.documents.addressProof)) {
    drawSectionTitle('DOCUMENTOS EM ANEXO');
    checkPageSpace(45);
    
    let xOffset = margin;
    const docWidth = 55;
    const docHeight = 35;
    const spacing = 7;

    const docsList = [
      { label: 'RG/CNH Frente', data: contract.documents.rgFront },
      { label: 'RG/CNH Verso', data: contract.documents.rgBack },
      { label: 'Comprovante de Residência', data: contract.documents.addressProof }
    ];

    docsList.forEach(item => {
      if (item.data) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(item.label, xOffset, y);
        
        const drew = drawImageSafe(doc, item.data, 'JPEG', xOffset, y + 2, docWidth, docHeight);
        if (drew) {
          xOffset += docWidth + spacing;
        }
      }
    });

    y += docHeight + 8;
  }

  // 9. Signature Digital Section
  if (contract.signature) {
    drawSectionTitle('ASSINATURA DIGITAL DO CLIENTE', [15, 23, 42]);
    checkPageSpace(42);
    
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.25);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');
    
    // Draw Signature Image
    drawImageSafe(doc, contract.signature, 'PNG', margin + 40, y + 2, 100, 18);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Assinado eletronicamente por: ${contract.clientName}`, margin + 5, y + 23);
    doc.text(`Data/Hora do Registro: ${new Date(contract.date).toLocaleString('pt-BR')}`, margin + 5, y + 27);
    doc.text(`Status do Registro: Validado`, margin + 5, y + 31);

    y += 38;
  }

  // 10. Audit and Security Section
  let audit: Partial<ContractAudit> | undefined = contract.audit;
  if (!audit && auditTrailStr) {
    try {
      const parsedAudit: Partial<ContractAudit> = {};
      const lines = auditTrailStr.split('\n');
      lines.forEach(line => {
        const [key, ...valParts] = line.split(':');
        if (key && valParts.length > 0) {
          const val = valParts.join(':').trim();
          const cleanKey = key.trim();
          if (cleanKey.includes('IP')) parsedAudit.ip = val;
          else if (cleanKey.includes('Localidade') || cleanKey.includes('Local')) parsedAudit.location = val;
          else if (cleanKey.includes('Navegador') || cleanKey.includes('User Agent')) parsedAudit.userAgent = val;
          else if (cleanKey.includes('Data') || cleanKey.includes('Timestamp')) parsedAudit.timestamp = val;
        }
      });
      if (parsedAudit.ip) {
        audit = parsedAudit as ContractAudit;
      }
    } catch (e) {
      console.warn('Error parsing audit trail string:', e);
    }
  }

  if (audit) {
    drawSectionTitle('HISTÓRICO DE AUDITORIA (VALIDADE JURÍDICA)', [22, 163, 74]); // green-600
    checkPageSpace(32);
    
    // Green validation box
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.setLineWidth(0.2);
    
    // Check if user-agent wraps to determine card size
    const wrappedUA = doc.splitTextToSize(audit.userAgent || '—', contentWidth - 52);
    const uaHeight = wrappedUA.length * 3.5;
    const boxExtraHeight = uaHeight > 3.5 ? uaHeight - 3.5 : 0;
    const auditCardHeight = 25 + boxExtraHeight;

    doc.roundedRect(margin, y, contentWidth, auditCardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52);
    doc.text('✓ Assinatura eletrônica vinculada e rastreada via metadados de rede:', margin + 5, y + 6);

    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Endereço IP público:`, margin + 5, y + 11.5);
    doc.setFont('helvetica', 'bold');
    doc.text(audit.ip || '—', margin + 45, y + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.text(`Localização aproximada:`, margin + 5, y + 16.5);
    doc.setFont('helvetica', 'bold');
    doc.text(audit.location || '—', margin + 45, y + 16.5);

    doc.setFont('helvetica', 'normal');
    doc.text(`Dispositivo / Navegador:`, margin + 5, y + 21.5);
    doc.setFont('helvetica', 'bold');
    doc.text(wrappedUA, margin + 45, y + 21.5);

    doc.setFont('helvetica', 'normal');
    doc.text(`Data/Hora da Assinatura:`, margin + 5, y + 25.5 + boxExtraHeight);
    doc.setFont('helvetica', 'bold');
    doc.text(audit.timestamp || formatDateBR(contract.startDate), margin + 45, y + 25.5 + boxExtraHeight);
    
    y += auditCardHeight + 8;
  }

  // --- DYNAMIC FOOTER (Add page numbers to all pages after rendering is done) ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Bottom separator line
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 12, 195, pageHeight - 12);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Via de caráter oficial em formato eletrônico. Validade respaldada pela MP nº 2.200-2/2001 e Lei 14.063/2020.`, margin, pageHeight - 8);
    doc.text(`Página ${i} de ${totalPages}`, 195, pageHeight - 8, { align: 'right' });
  }

  // Save the generated document
  const fileName = `Contrato_${contract.id}_${contract.clientName.trim().replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}
