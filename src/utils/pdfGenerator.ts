import { jsPDF } from 'jspdf';
import type { Contract } from '../types';

/**
 * Generates and downloads a professional A4 contract PDF client-side using jsPDF.
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
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawSubsequentHeader();
    }
  };

  const drawSubsequentHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Contrato de Encomenda nº ${contract.id} | Loja: ${storeName}`, margin, y);
    doc.text(`Página ${doc.getNumberOfPages()}`, 195, y, { align: 'right' });
    y += 4;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, y, 195, y);
    y += 8;
  };

  const drawMainHeader = () => {
    // Top primary accent block
    doc.setFillColor(10, 132, 255); // #0A84FF
    doc.rect(margin, y, contentWidth, 3, 'F');
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(17, 17, 17); // #111111
    doc.text('CONTRATO DE ENCOMENDA', margin, y);

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(10, 132, 255); // #0A84FF
    doc.text(`CONTRATO Nº: ${contract.id}`, margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 195, y, { align: 'right' });

    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(85, 85, 85); // #555555
    doc.text(`Loja: ${storeName}`, margin, y);

    y += 4;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, y, 195, y);
    y += 8;
  };

  const drawSectionTitle = (title: string, color: [number, number, number] = [10, 132, 255]) => {
    checkPageSpace(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(title, margin, y);
    y += 3;
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, y, 195, y);
    y += 6;
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

  // 2. Client Details Section
  drawSectionTitle('DADOS DO CLIENTE');
  checkPageSpace(30);

  const clientInfo = [
    { label: 'Nome Completo:', value: contract.clientName },
    { label: 'CPF / Documento:', value: contract.clientCPF },
    { label: 'WhatsApp / Telefone:', value: contract.clientPhone },
    { label: 'E-mail:', value: contract.clientEmail || '—' },
  ];

  doc.setFontSize(9.5);
  clientInfo.forEach(info => {
    checkPageSpace(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(85, 85, 85);
    doc.text(info.label, margin, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(17, 17, 17);
    doc.text(info.value, margin + 45, y);
    y += 5.5;
  });

  // Wrapped Client Address
  checkPageSpace(8);
  const wrappedAddress = doc.splitTextToSize(contract.clientAddress || '—', contentWidth - 45);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(85, 85, 85);
  doc.text('Endereço:', margin, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 17, 17);
  doc.text(wrappedAddress, margin + 45, y);
  y += (wrappedAddress.length * 4.5) + 3;

  y += 2;

  // 3. Equipment ordered table
  drawSectionTitle('EQUIPAMENTOS ENCOMENDADOS');
  checkPageSpace(20);

  // Table Headers
  doc.setFillColor(245, 245, 247);
  doc.rect(margin, y, contentWidth, 7, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(85, 85, 85);
  
  doc.text('Modelo', margin + 2, y + 4.5);
  doc.text('Capacidade', margin + 70, y + 4.5);
  doc.text('Cor', margin + 105, y + 4.5);
  doc.text('Qtd.', margin + 140, y + 4.5, { align: 'center' });
  doc.text('Preço Unit.', margin + 178, y + 4.5, { align: 'right' });
  y += 7;

  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 17, 17);
  
  contract.items.forEach(item => {
    checkPageSpace(8);
    doc.text(item.model, margin + 2, y + 5);
    doc.text(item.storage, margin + 70, y + 5);
    doc.text(item.colorName, margin + 105, y + 5);
    doc.text(String(item.quantity), margin + 140, y + 5, { align: 'center' });
    doc.text(item.cashPrice, margin + 178, y + 5, { align: 'right' });
    
    y += 7;
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, y, 195, y);
  });
  y += 3;

  // 4. Contract values & terms
  drawSectionTitle('VALORES E DADOS DE PAGAMENTO');
  
  const valuesInfo = [
    { label: 'Valor Total à Vista (PIX):', value: contract.cashTotal, isBold: true, color: [10, 132, 255] as [number, number, number] },
    { label: 'Forma de Pagamento:', value: paymentMethodLabels[contract.paymentMethod] || contract.paymentMethod, isBold: false },
    { label: 'Data de Início:', value: formatDateBR(contract.startDate), isBold: false },
    { label: 'Previsão de Entrega:', value: formatDateBR(contract.deliveryDate), isBold: false },
    { label: 'Expiração do Contrato:', value: formatDateBR(contract.expirationDate), isBold: false },
  ];

  valuesInfo.forEach(info => {
    checkPageSpace(6);
    doc.setFont('helvetica', info.isBold ? 'bold' : 'normal');
    if (info.color) {
      doc.setTextColor(info.color[0], info.color[1], info.color[2]);
    } else {
      doc.setTextColor(85, 85, 85);
    }
    doc.text(info.label, margin, y);
    
    doc.setFont('helvetica', 'bold');
    if (info.color) {
      doc.setTextColor(info.color[0], info.color[1], info.color[2]);
    } else {
      doc.setTextColor(17, 17, 17);
    }
    doc.text(info.value, margin + 65, y);
    y += 5.5;
  });

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
    checkPageSpace(12);
    const wrappedObs = doc.splitTextToSize(visualObs, contentWidth - 65);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(85, 85, 85);
    doc.text('Observações:', margin, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(17, 17, 17);
    doc.text(wrappedObs, margin + 65, y);
    y += (wrappedObs.length * 4.5) + 3;
  }
  y += 4;

  // 5. Trade-in Device Section
  if (contract.hasTrade && contract.tradeDevice) {
    drawSectionTitle('PERMUTA DE APARELHO (TRADE-IN)', [124, 58, 237]); // Purple
    
    const trade = contract.tradeDevice;
    const tradeInfo = [
      { label: 'Aparelho Entregue:', value: `${trade.brand} ${trade.model} ${trade.storage} — ${trade.color}` },
      { label: 'IMEI / Serial:', value: trade.imei },
      { label: 'Estado de Conservação:', value: conditionLabels[trade.condition] || trade.condition },
      { label: 'Valor de Avaliação:', value: trade.evaluatedValue, isBold: true, color: [34, 197, 94] as [number, number, number] } // Green
    ];

    tradeInfo.forEach(info => {
      checkPageSpace(6);
      doc.setFont('helvetica', info.isBold ? 'bold' : 'normal');
      if (info.color) {
        doc.setTextColor(info.color[0], info.color[1], info.color[2]);
      } else {
        doc.setTextColor(85, 85, 85);
      }
      doc.text(info.label, margin, y);
      
      doc.setFont('helvetica', 'bold');
      if (info.color) {
        doc.setTextColor(info.color[0], info.color[1], info.color[2]);
      } else {
        doc.setTextColor(17, 17, 17);
      }
      doc.text(info.value, margin + 65, y);
      y += 5.5;
    });

    if (trade.description) {
      checkPageSpace(10);
      const wrappedDesc = doc.splitTextToSize(trade.description, contentWidth - 65);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(85, 85, 85);
      doc.text('Observações Permuta:', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(17, 17, 17);
      doc.text(wrappedDesc, margin + 65, y);
      y += (wrappedDesc.length * 4.5) + 3;
    }

    if (trade.photo) {
      checkPageSpace(45);
      const drew = drawImageSafe(doc, trade.photo, 'JPEG', margin, y, 60, 35);
      if (drew) {
        y += 38;
      }
    }
    y += 4;
  }

  // 6. Installments / Fiado Section
  if (
    (contract.paymentMethod === 'fiado' || contract.paymentMethod === 'custom') &&
    contract.installments &&
    contract.installments.length > 0
  ) {
    const isCustom = contract.paymentMethod === 'custom';
    drawSectionTitle(isCustom ? 'CRONOGRAMA DE PAGAMENTO MISTO' : 'CRONOGRAMA DE PARCELAS (FIADO)', [217, 119, 6]); // Amber
    
    checkPageSpace(12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(85, 85, 85);
    const downPayment = contract.fiadoDownPayment || 'R$ 0,00';
    doc.text(`Valor de Entrada / Sinal: ${downPayment}`, margin, y);
    y += 6;

    // Headers
    checkPageSpace(10);
    doc.setFillColor(245, 245, 247);
    doc.rect(margin, y, contentWidth, 6, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(85, 85, 85);
    doc.text(isCustom ? 'Parcela / Forma' : 'Parcela', margin + 2, y + 4.2);
    doc.text('Vencimento', margin + 60, y + 4.2, { align: 'center' });
    doc.text('Valor', margin + 100, y + 4.2, { align: 'right' });
    doc.text('Pago', margin + 140, y + 4.2, { align: 'right' });
    doc.text('Status', margin + 178, y + 4.2, { align: 'right' });
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(17, 17, 17);

    contract.installments.forEach(inst => {
      checkPageSpace(8);
      const titleText = isCustom ? `${inst.id} — ${inst.method || 'Pagamento'}` : inst.id;
      doc.text(titleText, margin + 2, y + 5);
      doc.text(formatDateBR(inst.dueDate), margin + 60, y + 5, { align: 'center' });
      doc.text(inst.value, margin + 100, y + 5, { align: 'right' });
      doc.text(inst.paidValue || 'R$ 0,00', margin + 140, y + 5, { align: 'right' });
      
      let statusColor = [136, 136, 136];
      let statusLabel = 'Pendente';
      if (inst.status === 'paid') {
        statusColor = [34, 197, 94];
        statusLabel = 'Pago';
      } else if (inst.status === 'overdue') {
        statusColor = [239, 68, 68];
        statusLabel = 'Em atraso';
      }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(statusLabel, margin + 178, y + 5, { align: 'right' });
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(17, 17, 17);
      
      y += 7;
      doc.setDrawColor(240, 240, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, y, 195, y);
    });
    y += 4;
  }

  // 7. Client Documents Section
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
        doc.setTextColor(120, 120, 120);
        doc.text(item.label, xOffset, y);
        
        const drew = drawImageSafe(doc, item.data, 'JPEG', xOffset, y + 2, docWidth, docHeight);
        if (drew) {
          xOffset += docWidth + spacing;
        }
      }
    });

    y += docHeight + 8;
  }

  // 8. Signature Digital Section
  if (contract.signature) {
    drawSectionTitle('ASSINATURA DIGITAL DO CLIENTE', [17, 17, 17]);
    checkPageSpace(42);
    
    // Draw Box
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.25);
    doc.rect(margin, y, contentWidth, 34);
    
    // Draw Signature Image
    drawImageSafe(doc, contract.signature, 'PNG', margin + 40, y + 2, 100, 18);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 120);
    doc.text(`Assinado em: ${new Date(contract.date).toLocaleString('pt-BR')}`, margin + 5, y + 26);
    doc.text(`Situação: Assinatura Eletrônica Registrada`, margin + 5, y + 30);

    y += 38;
  }

  // 9. Audit and Security Section
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
        audit = parsedAudit;
      }
    } catch (e) {
      console.warn('Error parsing audit trail string:', e);
    }
  }

  if (audit) {
    drawSectionTitle('HISTÓRICO DE AUDITORIA (VALIDADE JURÍDICA)', [34, 197, 94]); // Green
    checkPageSpace(32);
    
    // Green validation box
    doc.setFillColor(240, 253, 244);
    doc.rect(margin, y, contentWidth, 25, 'F');
    doc.setDrawColor(74, 222, 128);
    doc.rect(margin, y, contentWidth, 25);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(21, 128, 61);
    doc.text('✓ Assinatura eletrônica autenticada e vinculada aos metadados abaixo:', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(34, 100, 50);
    
    doc.text(`Endereço IP público:`, margin + 4, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.text(audit.ip || '—', margin + 45, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.text(`Localização (Cidade/UF):`, margin + 4, y + 14);
    doc.setFont('helvetica', 'bold');
    doc.text(audit.location || '—', margin + 45, y + 14);

    doc.setFont('helvetica', 'normal');
    doc.text(`Dispositivo / Navegador:`, margin + 4, y + 18);
    doc.setFont('helvetica', 'bold');
    const wrappedUA = doc.splitTextToSize(audit.userAgent || '—', contentWidth - 50);
    doc.text(wrappedUA, margin + 45, y + 18);

    doc.setFont('helvetica', 'normal');
    doc.text(`Data/Hora da Assinatura:`, margin + 4, y + 22);
    doc.setFont('helvetica', 'bold');
    doc.text(audit.timestamp || formatDateBR(contract.startDate), margin + 45, y + 22);
    
    y += 29;
  }

  // 10. Footer info
  checkPageSpace(15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(170, 170, 170);
  doc.text(`Este documento é uma via oficial emitida eletronicamente e possui validade jurídica respaldada pela MP nº 2.200-2/2001.`, margin, y);
  doc.text(`Página ${doc.getNumberOfPages()}`, 195, y, { align: 'right' });

  // Save the generated document
  const fileName = `Contrato_${contract.id}_${contract.clientName.trim().replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}
