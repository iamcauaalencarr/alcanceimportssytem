import { useState, useRef, useEffect } from 'react';
import { 
  X, Check, ArrowRight, ArrowLeft, ShieldCheck, 
  FileText, Clipboard, Phone, Sparkles, AlertCircle,
  Upload, Image as ImageIcon, Camera, CreditCard, RefreshCw,
  AlertTriangle, Package, Calendar, DollarSign
} from 'lucide-react';
import type { CartItem, Contract, ClientDocuments } from '../types';
import SignaturePad from './SignaturePad';

interface ContractSigningFlowProps {
  cart: CartItem[];
  cartTotals: { cash: string; installment: string; count: number };
  storeName: string;
  storeWhatsApp: string;
  onClose: () => void;
  onContractSigned: (contract: Contract) => void;
  presetContract?: Contract | null;
}

type Step = 'form' | 'terms' | 'docs' | 'sign' | 'success';

// Compress image file to base64 JPEG
const compressImageFile = (file: File, callback: (base64: string) => void) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = 600;
      const scale = Math.min(1, maxWidth / img.width);
      const width = img.width * scale;
      const height = img.height * scale;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.6));
      }
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const formatDateBR = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    // Parse as local date to avoid timezone offset
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

const conditionLabels: Record<string, string> = {
  new: 'Novo (lacrado)',
  seminew: 'Seminovo (excelente)',
  good: 'Bom estado',
  regular: 'Estado regular',
  defective: 'Com defeito'
};

export default function ContractSigningFlow({
  cart,
  cartTotals,
  storeName,
  storeWhatsApp,
  onClose,
  onContractSigned,
  presetContract = null
}: ContractSigningFlowProps) {
  // Determine initial step: preset contracts skip the personal form
  const [step, setStep] = useState<Step>(presetContract ? 'terms' : 'form');
  
  const [clientData, setClientData] = useState(() => {
    if (presetContract) {
      return {
        name: presetContract.clientName,
        cpf: presetContract.clientCPF,
        phone: presetContract.clientPhone,
        email: presetContract.clientEmail || '',
        address: presetContract.clientAddress,
        observations: presetContract.observations || ''
      };
    }
    return { name: '', cpf: '', phone: '', email: '', address: '', observations: '' };
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [generatedContractId, setGeneratedContractId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client-side document uploads (only used when presetContract doesn't have them)
  const [clientDocs, setClientDocs] = useState<ClientDocuments>({});
  const rgFrontRef = useRef<HTMLInputElement>(null);
  const rgBackRef = useRef<HTMLInputElement>(null);
  const proofRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when signing flow is active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = () => {
    const isDirty = 
      (!presetContract && (clientData.name !== '' || clientData.cpf !== '' || clientData.phone !== '' || clientData.address !== '')) ||
      signatureData !== null ||
      Object.keys(clientDocs).length > 0;

    if (isDirty && step !== 'success') {
      if (!window.confirm('Tem certeza que deseja sair? Os dados preenchidos serão perdidos.')) {
        return;
      }
    }
    onClose();
  };

  // Docs already uploaded by admin in draft?
  const adminDocs = presetContract?.documents;
  const needsRgFront = presetContract && !adminDocs?.rgFront;
  const needsRgBack = presetContract && !adminDocs?.rgBack;
  const needsProof = presetContract && !adminDocs?.addressProof;
  const needsAnyDoc = needsRgFront || needsRgBack || needsProof;

  // Active cart/totals based on source
  const activeCart = presetContract ? presetContract.items : cart;
  const activeTotals = presetContract ? {
    cash: presetContract.cashTotal,
    installment: presetContract.installmentTotal,
    count: presetContract.items.reduce((acc, curr) => acc + curr.quantity, 0)
  } : cartTotals;

  const formatCPF = (value: string) =>
    value.replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');

  const formatPhone = (value: string) =>
    value.replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');

  const handleInputChange = (field: string, value: string) => {
    if (presetContract) return;
    let formatted = value;
    if (field === 'cpf') formatted = formatCPF(value);
    else if (field === 'phone') formatted = formatPhone(value);
    setClientData(prev => ({ ...prev, [field]: formatted }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!clientData.name.trim()) newErrors.name = 'Nome completo é obrigatório';
    if (!clientData.cpf.trim() || clientData.cpf.replace(/\D/g, '').length !== 11) newErrors.cpf = 'Insira um CPF válido (11 dígitos)';
    if (!clientData.phone.trim() || clientData.phone.replace(/\D/g, '').length < 10) newErrors.phone = 'Insira um telefone/WhatsApp válido';
    if (!clientData.address.trim()) newErrors.address = 'Endereço de entrega é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>, key: keyof ClientDocuments) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImageFile(file, (base64) => {
      setClientDocs(prev => ({ ...prev, [key]: base64 }));
    });
  };

  const handleNextFromForm = () => { if (validateForm()) setStep('terms'); };
  const handleNextFromTerms = () => {
    if (needsAnyDoc) {
      setStep('docs');
    } else {
      setStep('sign');
    }
  };
  const handleNextFromDocs = () => setStep('sign');

  const handleSignAndSubmit = async () => {
    if (!signatureData || !agreedToTerms) return;
    setIsSubmitting(true);

    let updatedContract: Contract;

    if (presetContract) {
      // Merge client-uploaded docs with admin-uploaded docs
      const mergedDocs: ClientDocuments = {
        ...(adminDocs || {}),
        ...(clientDocs.rgFront ? { rgFront: clientDocs.rgFront } : {}),
        ...(clientDocs.rgBack ? { rgBack: clientDocs.rgBack } : {}),
        ...(clientDocs.addressProof ? { addressProof: clientDocs.addressProof } : {}),
      };

      updatedContract = {
        ...presetContract,
        signature: signatureData,
        status: 'signed',
        date: new Date().toISOString(),
        documents: Object.keys(mergedDocs).length > 0 ? mergedDocs : presetContract.documents
      };
    } else {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const year = new Date().getFullYear().toString().slice(-2);
      const contractId = `CTR-${year}${randomNum}`;

      updatedContract = {
        id: contractId,
        clientName: clientData.name,
        clientCPF: clientData.cpf,
        clientPhone: clientData.phone,
        clientEmail: clientData.email || undefined,
        clientAddress: clientData.address,
        items: activeCart,
        cashTotal: activeTotals.cash,
        installmentTotal: activeTotals.installment,
        signature: signatureData,
        date: new Date().toISOString(),
        status: 'signed',
        observations: clientData.observations || undefined,
        startDate: new Date().toISOString().slice(0, 10),
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        deliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        paymentMethod: 'pix',
        documents: Object.keys(clientDocs).length > 0 ? clientDocs : undefined
      };
    }

    onContractSigned(updatedContract);
    setGeneratedContractId(updatedContract.id);
    setIsSubmitting(false);
    setStep('success');
  };

  const getWhatsAppMessage = () => {
    let message = `*Olá ${storeName}! Assinei o Contrato de Encomenda nº ${generatedContractId}* ✍️\n\n`;
    message += `👤 *Cliente:* ${clientData.name}\n`;
    message += `🪪 *CPF:* ${clientData.cpf}\n`;
    message += `📞 *WhatsApp:* ${clientData.phone}\n`;
    if (clientData.address) message += `📍 *Endereço:* ${clientData.address}\n`;
    message += `\n📦 *Itens Encomendados:*\n`;
    activeCart.forEach(item => {
      message += `- ${item.quantity}x ${item.model} (${item.storage}) | Cor: ${item.colorName}\n`;
    });
    message += `\n💵 *Total à Vista (PIX):* ${activeTotals.cash}\n`;
    if (presetContract?.paymentMethod === 'fiado') {
      message += `📅 *Forma de Pagamento:* Fiado / A Prazo\n`;
      message += `💳 *Entrada:* ${presetContract.fiadoDownPayment || 'R$ 0,00'}\n`;
      message += `📋 *Parcelas:* ${presetContract.installments?.length || 0}x\n`;
    }
    if (presetContract?.paymentMethod === 'custom') {
      message += `📅 *Forma de Pagamento:* Misto / Personalizado\n`;
      if (presetContract.fiadoDownPayment && presetContract.fiadoDownPayment !== 'R$ 0,00') {
        message += `💳 *Entrada/Sinal:* ${presetContract.fiadoDownPayment}\n`;
      }
      message += `📋 *Parcelas:* ${presetContract.installments?.length || 0}x no cronograma\n`;
    }
    if (presetContract?.hasTrade) {
      message += `🔄 *Permuta:* ${presetContract.tradeDevice?.brand} ${presetContract.tradeDevice?.model} (${presetContract.tradeDevice?.evaluatedValue})\n`;
    }
    message += `\n*O contrato já foi assinado digitalmente e salvo no sistema. Aguardo a confirmação da encomenda!*`;
    return `https://wa.me/${storeWhatsApp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const formattedDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  // Steps for the step indicator
  const allSteps: { key: Step; num: number; label: string }[] = presetContract
    ? (needsAnyDoc
        ? [{ key: 'terms', num: 1, label: 'Termos' }, { key: 'docs', num: 2, label: 'Documentos' }, { key: 'sign', num: 3, label: 'Assinar' }]
        : [{ key: 'terms', num: 1, label: 'Termos' }, { key: 'sign', num: 2, label: 'Assinar' }])
    : [{ key: 'form', num: 1, label: 'Seus Dados' }, { key: 'terms', num: 2, label: 'Termos' }, { key: 'sign', num: 3, label: 'Assinar' }];

  const stepOrder = allSteps.map(s => s.key);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-0 overflow-hidden animate-fade-in font-sans"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white dark:bg-zinc-900 w-full h-full flex flex-col p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-150 dark:border-zinc-800 pb-4 mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-brand-secondary dark:text-white uppercase tracking-tight">
                {presetContract ? `Contrato ${presetContract.id}` : 'Contrato de Encomenda'}
              </h3>
              <p className="text-[10px] text-brand-muted dark:text-zinc-400 mt-0.5 uppercase tracking-wider font-bold">
                {presetContract ? storeName + ' — Assinatura Digital' : 'Assinatura Digital de Segurança'}
              </p>
            </div>
          </div>
          {step !== 'success' && !presetContract && (
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Indicators */}
        {step !== 'success' && (
          <div className={`grid gap-2 mb-6 flex-shrink-0`} style={{ gridTemplateColumns: `repeat(${allSteps.length}, 1fr)` }}>
            {allSteps.map((s) => {
              const curIdx = stepOrder.indexOf(step);
              const sIdx = stepOrder.indexOf(s.key);
              const isActive = step === s.key;
              const isCompleted = curIdx > sIdx;
              return (
                <div key={s.key} className={`flex flex-col md:flex-row md:items-center gap-1.5 pb-2 border-b-2 transition-colors ${
                  isActive ? 'border-brand-primary text-brand-secondary dark:text-white'
                    : isCompleted ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-gray-200 dark:border-zinc-800 text-brand-muted dark:text-zinc-500'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                    isActive ? 'bg-brand-primary text-white'
                      : isCompleted ? 'bg-green-500 text-white'
                      : 'bg-gray-100 dark:bg-zinc-800 text-brand-muted'
                  }`}>
                    {isCompleted ? <Check className="w-3 h-3" /> : s.num}
                  </span>
                  <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">{s.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto pr-1">

          {/* STEP: Personal Data Form (no preset) */}
          {step === 'form' && !presetContract && (
            <div className="space-y-4 py-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted dark:text-zinc-400">Nome Completo *</label>
                  <input type="text" placeholder="Ex: João da Silva" value={clientData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full text-xs bg-gray-50 dark:bg-zinc-800 border rounded-xl px-3 py-2.5 text-brand-secondary dark:text-white focus:outline-none ${errors.name ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700 focus:border-brand-primary'}`}
                  />
                  {errors.name && <p className="text-[10px] text-red-500 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted dark:text-zinc-400">CPF *</label>
                  <input type="text" placeholder="000.000.000-00" value={clientData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full text-xs bg-gray-50 dark:bg-zinc-800 border rounded-xl px-3 py-2.5 text-brand-secondary dark:text-white focus:outline-none ${errors.cpf ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700 focus:border-brand-primary'}`}
                  />
                  {errors.cpf && <p className="text-[10px] text-red-500 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.cpf}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted dark:text-zinc-400">WhatsApp / Celular *</label>
                  <input type="text" placeholder="(00) 00000-0000" value={clientData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full text-xs bg-gray-50 dark:bg-zinc-800 border rounded-xl px-3 py-2.5 text-brand-secondary dark:text-white focus:outline-none ${errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700 focus:border-brand-primary'}`}
                  />
                  {errors.phone && <p className="text-[10px] text-red-500 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted dark:text-zinc-400">E-mail (Opcional)</label>
                  <input type="email" placeholder="cliente@exemplo.com" value={clientData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-brand-secondary dark:text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted dark:text-zinc-400">Endereço de Entrega *</label>
                <input type="text" placeholder="Rua, número, bairro, cidade, CEP" value={clientData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  onClick={(e) => e.stopPropagation()}
                  className={`w-full text-xs bg-gray-50 dark:bg-zinc-800 border rounded-xl px-3 py-2.5 text-brand-secondary dark:text-white focus:outline-none ${errors.address ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700 focus:border-brand-primary'}`}
                />
                {errors.address && <p className="text-[10px] text-red-500 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.address}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted dark:text-zinc-400">Observações Adicionais</label>
                <textarea placeholder="Observações de entrega ou especificações..." value={clientData.observations}
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  rows={3} className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl px-3 py-2.5 text-brand-secondary dark:text-white focus:outline-none focus:border-brand-primary resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP: Contract Terms Preview */}
          {step === 'terms' && (
            <div className="space-y-3.5">
              {presetContract && (
                <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-2xl text-[11px] text-blue-900 leading-tight">
                  <span className="font-extrabold uppercase block text-[9.5px] tracking-wider mb-0.5 text-brand-primary">Instruções de Assinatura:</span>
                  Olá <strong>{clientData.name.split(' ')[0]}</strong>! Revise os detalhes do seu pedido e as cláusulas contratuais abaixo. Ao avançar, você seguirá para a coleta de documentos e assinatura digital.
                </div>
              )}

              {/* Contract Document */}
              <div className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-150 dark:border-zinc-800/80 rounded-2xl p-4 md:p-6 space-y-4 font-mono text-[11px] leading-relaxed text-brand-secondary dark:text-zinc-300 max-h-[50vh] overflow-y-auto responsive-scrollbar shadow-inner">
                
                <div className="text-center font-bold text-xs border-b border-gray-200 dark:border-zinc-700 pb-3 mb-4 space-y-1">
                  <div>CONTRATO DE PRESTAÇÃO DE SERVIÇOS E AQUISIÇÃO DE EQUIPAMENTO IMPORTADO</div>
                  {presetContract && (
                    <div className="text-[10px] text-brand-muted font-normal">Nº {presetContract.id}</div>
                  )}
                </div>

                {/* 1. Partes */}
                <div>
                  <strong className="text-brand-primary font-bold">1. DAS PARTES</strong>
                  <p className="mt-1">
                    <strong>CONTRATADA (Vendedora):</strong> {storeName}, responsável pela intermediação e importação.<br />
                    <strong>CONTRATANTE (Comprador):</strong> {clientData.name}, CPF nº {clientData.cpf}, residente em {clientData.address}, telefone {clientData.phone}.
                  </p>
                </div>

                {/* 2. Objeto */}
                <div>
                  <strong className="text-brand-primary font-bold">2. DO OBJETO DO CONTRATO</strong>
                  <p className="mt-1">O presente contrato tem por objeto a encomenda, importação e aquisição do(s) seguinte(s) equipamento(s) eletrônico(s):</p>
                  <div className="my-2 pl-3 border-l-2 border-brand-primary space-y-1 bg-white dark:bg-zinc-800 p-2 rounded-lg font-bold">
                    {activeCart.map((item, idx) => (
                      <div key={idx}>— {item.quantity}x {item.model} ({item.storage}) | Cor: {item.colorName}</div>
                    ))}
                  </div>
                </div>

                {/* 3. Valores e Pagamento */}
                <div>
                  <strong className="text-brand-primary font-bold">3. DOS VALORES E FORMA DE PAGAMENTO</strong>
                  {(!presetContract || presetContract.paymentMethod === 'pix') && (
                    <p className="mt-1">
                      O CONTRATANTE compromete-se a pagar o valor total de <strong>{activeTotals.cash}</strong> à vista mediante PIX ou transferência bancária à CONTRATADA antes do envio do pedido.
                    </p>
                  )}
                  {presetContract?.paymentMethod === 'card' && (
                    <p className="mt-1">
                      O CONTRATANTE compromete-se a pagar o valor total de <strong>{presetContract.installmentTotal}</strong> no cartão de crédito em até 12 (doze) parcelas, sujeito às taxas da operadora bancária.
                    </p>
                  )}
                  {presetContract?.paymentMethod === 'fiado' && presetContract.installments && (
                    <div className="mt-2 space-y-2">
                      <p>
                        A aquisição é efetuada mediante parcelamento direto com o lojista. O CONTRATANTE pagará uma entrada de <strong>{presetContract.fiadoDownPayment}</strong> no ato da assinatura, e o saldo remanescente dividido em <strong>{presetContract.installments.length}</strong> parcela(s) conforme cronograma abaixo. O não pagamento de qualquer parcela na data aprazada importará no vencimento antecipado do saldo devedor e incidência de multa de 2% sobre o montante em atraso.
                      </p>
                      {/* Installments table */}
                      <div className="mt-2">
                        <div className="grid grid-cols-3 text-[9.5px] font-bold text-brand-muted border-b border-gray-200 dark:border-zinc-700 pb-1 mb-1">
                          <span>Parcela</span>
                          <span className="text-center">Vencimento</span>
                          <span className="text-right">Valor</span>
                        </div>
                        {presetContract.installments.map((inst) => (
                          <div key={inst.id} className="grid grid-cols-3 text-[10px] py-0.5 border-b border-gray-100 dark:border-zinc-800/50">
                            <span className="font-bold text-brand-primary">{inst.id}</span>
                            <span className="text-center">{formatDateBR(inst.dueDate)}</span>
                            <span className="text-right font-bold">{inst.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {presetContract?.paymentMethod === 'custom' && presetContract.installments && (
                    <div className="mt-2 space-y-2">
                      <p>
                        A aquisição é efetuada mediante condições de pagamento personalizadas / mistas. O CONTRATANTE compromete-se a efetuar os pagamentos conforme as datas, valores e métodos especificados no cronograma abaixo. O não pagamento de qualquer parcela na data aprazada importará no vencimento antecipado do saldo devedor e incidência de multa de 2% sobre o montante em atraso.
                      </p>
                      {/* Installments table */}
                      <div className="mt-2">
                        <div className="grid grid-cols-3 text-[9.5px] font-bold text-brand-muted border-b border-gray-200 dark:border-zinc-700 pb-1 mb-1">
                          <span>Parcela / Forma</span>
                          <span className="text-center">Vencimento</span>
                          <span className="text-right">Valor</span>
                        </div>
                        {presetContract.installments.map((inst) => (
                          <div key={inst.id} className="grid grid-cols-3 text-[10px] py-0.5 border-b border-gray-100 dark:border-zinc-800/50">
                            <span className="font-bold text-brand-primary">{inst.id} — {inst.method || 'Pagamento'}</span>
                            <span className="text-center">{formatDateBR(inst.dueDate)}</span>
                            <span className="text-right font-bold">{inst.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Permuta (Trade-in) — rendered only if hasTrade */}
                {presetContract?.hasTrade && presetContract.tradeDevice && (
                  <div>
                    <strong className="text-brand-primary font-bold">4. DA PERMUTA DE APARELHO</strong>
                    <p className="mt-1">
                      O CONTRATANTE entrega à CONTRATADA um dispositivo usado como parte de pagamento, detalhado a seguir:
                      <br /><strong>Marca/Modelo:</strong> {presetContract.tradeDevice.brand} {presetContract.tradeDevice.model} ({presetContract.tradeDevice.storage}), cor {presetContract.tradeDevice.color}.
                      <br /><strong>IMEI:</strong> {presetContract.tradeDevice.imei}.
                      <br /><strong>Estado de Conservação:</strong> {conditionLabels[presetContract.tradeDevice.condition] || presetContract.tradeDevice.condition}.
                      {presetContract.tradeDevice.description && <><br /><strong>Obs.:</strong> {presetContract.tradeDevice.description}.</>}
                      <br /><strong>Valor de Avaliação:</strong> <span className="text-green-700 font-black">{presetContract.tradeDevice.evaluatedValue}</span> (deduzido do valor total da encomenda).
                      <br /><br />O CONTRATANTE declara, sob as penas da lei, ser o legítimo proprietário do bem ora entregue, livre de quaisquer ônus, restrições judiciais ou queixas de furto/roubo.
                    </p>
                    {presetContract.tradeDevice.photo && (
                      <div className="mt-2">
                        <p className="text-[9.5px] text-brand-muted font-bold mb-1">FOTO DO APARELHO PARA PERMUTA:</p>
                        <img 
                          src={presetContract.tradeDevice.photo} 
                          alt="Aparelho de Permuta"
                          className="max-h-32 rounded-xl border border-gray-200 dark:border-zinc-700 object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Prazo de Importação e Entrega */}
                <div>
                  <strong className="text-brand-primary font-bold">{presetContract?.hasTrade ? '5' : '4'}. DO PRAZO DE IMPORTAÇÃO E ENTREGA</strong>
                  <p className="mt-1">
                    {presetContract ? (
                      <>
                        O prazo de entrega estimado é até <strong>{formatDateBR(presetContract.deliveryDate)}</strong>. O contrato está vigente de <strong>{formatDateBR(presetContract.startDate)}</strong> a <strong>{formatDateBR(presetContract.expirationDate)}</strong>. A entrega será realizada no endereço fornecido: {clientData.address}.
                      </>
                    ) : (
                      <>
                        O prazo previsto de entrega é de 10 (dez) a 15 (quinze) dias úteis a partir da assinatura e confirmação de pagamento. A entrega será realizada em: {clientData.address}.
                      </>
                    )}
                    <br />Eventuais atrasos logísticos decorrentes de fiscalização aduaneira ou trâmites de transporte internacional serão prontamente comunicados ao comprador.
                  </p>
                </div>

                {/* 6. Garantia */}
                <div>
                  <strong className="text-brand-primary font-bold">{presetContract?.hasTrade ? '6' : '5'}. DA GARANTIA E ASSISTÊNCIA</strong>
                  <p className="mt-1">Os aparelhos comercializados são novos e gozam de garantia oficial da fabricante Apple Inc. pelo prazo de 1 (um) ano internacional, válida a partir da primeira ativação do dispositivo.</p>
                </div>

                {/* 7. Disposições Gerais */}
                <div>
                  <strong className="text-brand-primary font-bold">{presetContract?.hasTrade ? '7' : '6'}. DISPOSIÇÕES GERAIS</strong>
                  <p className="mt-1">
                    {presetContract?.hasTrade ? '7' : '6'}.1. O cancelamento da encomenda após o envio internacional poderá acarretar custos operacionais e de devolução ao fornecedor externo.<br />
                    {presetContract?.hasTrade ? '7' : '6'}.2. As partes elegem a assinatura digital através deste painel interativo como válida e vinculante para fins contratuais, nos termos do art. 10 da MP 2.200-2/2001 e da Lei 14.063/2020.
                  </p>
                </div>

                <div className="text-right border-t border-gray-200 dark:border-zinc-700 pt-3 mt-4 text-[9px] text-brand-muted">
                  Gerado digitalmente em {formattedDate}
                </div>
              </div>

              {/* Dates summary card (preset contracts only) */}
              {presetContract && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-xl p-2.5 text-center">
                    <Calendar className="w-3.5 h-3.5 text-brand-primary mx-auto mb-0.5" />
                    <div className="text-[9px] text-brand-muted font-bold uppercase">Início</div>
                    <div className="text-[11px] font-black text-brand-secondary dark:text-white">{formatDateBR(presetContract.startDate)}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-xl p-2.5 text-center">
                    <Package className="w-3.5 h-3.5 text-green-500 mx-auto mb-0.5" />
                    <div className="text-[9px] text-brand-muted font-bold uppercase">Entrega</div>
                    <div className="text-[11px] font-black text-brand-secondary dark:text-white">{formatDateBR(presetContract.deliveryDate)}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-xl p-2.5 text-center">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-500 mx-auto mb-0.5" />
                    <div className="text-[9px] text-brand-muted font-bold uppercase">Expiração</div>
                    <div className="text-[11px] font-black text-brand-secondary dark:text-white">{formatDateBR(presetContract.expirationDate)}</div>
                  </div>
                </div>
              )}

              {/* Trade-in & Fiado quick summary badges */}
              {presetContract && (presetContract.hasTrade || presetContract.paymentMethod === 'fiado' || presetContract.paymentMethod === 'custom') && (
                <div className="flex flex-wrap gap-2">
                  {presetContract.hasTrade && presetContract.tradeDevice && (
                    <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-full px-3 py-1.5 text-[10px] font-bold text-purple-800 dark:text-purple-300">
                      <RefreshCw className="w-3 h-3" />
                      Permuta: {presetContract.tradeDevice.brand} {presetContract.tradeDevice.model} — {presetContract.tradeDevice.evaluatedValue}
                    </div>
                  )}
                  {presetContract.paymentMethod === 'fiado' && (
                    <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-full px-3 py-1.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                      <CreditCard className="w-3 h-3" />
                      Fiado: Entrada {presetContract.fiadoDownPayment} + {presetContract.installments?.length}x parcelas
                    </div>
                  )}
                  {presetContract.paymentMethod === 'custom' && (
                    <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-full px-3 py-1.5 text-[10px] font-bold text-indigo-800 dark:text-indigo-300">
                      <CreditCard className="w-3 h-3" />
                      Misto: {presetContract.installments?.length} parcelas personalizadas
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP: Document Upload */}
          {step === 'docs' && (
            <div className="space-y-4 py-1">
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-[11px] text-amber-800 leading-snug">
                <span className="font-extrabold uppercase block text-[9.5px] tracking-wider mb-0.5 text-amber-700">Documentos Necessários</span>
                Para garantia jurídica do contrato, envie fotos legíveis dos seus documentos pessoais. As imagens são comprimidas e armazenadas de forma segura.
              </div>

              <div className="space-y-3">
                {/* RG Frente */}
                {needsRgFront && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted dark:text-zinc-400 flex items-center gap-1">
                      <Camera className="w-3 h-3" /> RG / CNH — Frente
                    </label>
                    <div className="flex items-center gap-3">
                      <div 
                        onClick={() => rgFrontRef.current?.click()}
                        className={`flex-1 border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${clientDocs.rgFront ? 'border-green-400 bg-green-50' : 'border-gray-200 dark:border-zinc-700 hover:border-brand-primary hover:bg-blue-50/30'}`}
                      >
                        {clientDocs.rgFront ? (
                          <>
                            <img src={clientDocs.rgFront} alt="RG Frente" className="max-h-24 rounded-xl object-cover" />
                            <span className="text-[10px] text-green-600 font-bold flex items-center gap-1"><Check className="w-3 h-3" />Enviado com sucesso!</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-brand-muted" />
                            <span className="text-[10px] font-bold text-brand-muted">Toque para enviar a frente do RG/CNH</span>
                          </>
                        )}
                      </div>
                      <input ref={rgFrontRef} type="file" accept="image/*" capture="environment" className="hidden"
                        onChange={(e) => handleDocUpload(e, 'rgFront')} />
                    </div>
                  </div>
                )}

                {/* RG Verso */}
                {needsRgBack && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted dark:text-zinc-400 flex items-center gap-1">
                      <Camera className="w-3 h-3" /> RG / CNH — Verso
                    </label>
                    <div 
                      onClick={() => rgBackRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${clientDocs.rgBack ? 'border-green-400 bg-green-50' : 'border-gray-200 dark:border-zinc-700 hover:border-brand-primary hover:bg-blue-50/30'}`}
                    >
                      {clientDocs.rgBack ? (
                        <>
                          <img src={clientDocs.rgBack} alt="RG Verso" className="max-h-24 rounded-xl object-cover" />
                          <span className="text-[10px] text-green-600 font-bold flex items-center gap-1"><Check className="w-3 h-3" />Enviado com sucesso!</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-brand-muted" />
                          <span className="text-[10px] font-bold text-brand-muted">Toque para enviar o verso do RG/CNH</span>
                        </>
                      )}
                    </div>
                    <input ref={rgBackRef} type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={(e) => handleDocUpload(e, 'rgBack')} />
                  </div>
                )}

                {/* Comprovante de Residência */}
                {needsProof && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted dark:text-zinc-400 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> Comprovante de Residência (últimos 90 dias)
                    </label>
                    <div 
                      onClick={() => proofRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${clientDocs.addressProof ? 'border-green-400 bg-green-50' : 'border-gray-200 dark:border-zinc-700 hover:border-brand-primary hover:bg-blue-50/30'}`}
                    >
                      {clientDocs.addressProof ? (
                        <>
                          <img src={clientDocs.addressProof} alt="Comprovante" className="max-h-24 rounded-xl object-cover" />
                          <span className="text-[10px] text-green-600 font-bold flex items-center gap-1"><Check className="w-3 h-3" />Enviado com sucesso!</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-brand-muted" />
                          <span className="text-[10px] font-bold text-brand-muted">Toque para enviar o comprovante de residência</span>
                        </>
                      )}
                    </div>
                    <input ref={proofRef} type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={(e) => handleDocUpload(e, 'addressProof')} />
                  </div>
                )}

                {/* Already uploaded docs summary */}
                {adminDocs && (adminDocs.rgFront || adminDocs.rgBack || adminDocs.addressProof) && (
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-3">
                    <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Documentos já vinculados pelo vendedor:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {adminDocs.rgFront && <span className="text-[10px] bg-white border border-green-200 rounded-full px-2 py-0.5 text-green-700 font-bold">RG Frente ✓</span>}
                      {adminDocs.rgBack && <span className="text-[10px] bg-white border border-green-200 rounded-full px-2 py-0.5 text-green-700 font-bold">RG Verso ✓</span>}
                      {adminDocs.addressProof && <span className="text-[10px] bg-white border border-green-200 rounded-full px-2 py-0.5 text-green-700 font-bold">Comprovante ✓</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP: Digital Signature */}
          {step === 'sign' && (
            <div className="space-y-5 py-1">
              {/* Summary card */}
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-2.5">
                <FileText className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5 text-blue-900">
                  <h4 className="font-extrabold">Resumo do Contrato</h4>
                  <p><strong>Comprador:</strong> {clientData.name} ({clientData.cpf})</p>
                  <p><strong>Total à Vista:</strong> {activeTotals.cash}</p>
                  {presetContract?.paymentMethod === 'fiado' && (
                    <>
                      <p><strong>Entrada Fiado:</strong> {presetContract.fiadoDownPayment}</p>
                      <p><strong>Parcelas:</strong> {presetContract.installments?.length}x de {presetContract.installments?.[0]?.value}</p>
                    </>
                  )}
                  {presetContract?.paymentMethod === 'custom' && (
                    <>
                      <p><strong>Método de Pagamento:</strong> Misto / Personalizado</p>
                      <p><strong>Parcelas:</strong> {presetContract.installments?.length} parcela(s) personalizada(s)</p>
                    </>
                  )}
                  {presetContract?.hasTrade && presetContract.tradeDevice && (
                    <p className="flex items-center gap-1"><RefreshCw className="w-3 h-3 text-purple-500" /> <strong>Permuta deduzida:</strong> {presetContract.tradeDevice.evaluatedValue}</p>
                  )}
                  {(presetContract?.paymentMethod === 'fiado' || presetContract?.paymentMethod === 'custom') && presetContract.installments && (
                    <p className="flex items-center gap-1 text-amber-700"><DollarSign className="w-3 h-3" /><strong>Saldo Total:</strong> {presetContract.cashTotal}</p>
                  )}
                </div>
              </div>

              <SignaturePad onSignatureChange={(data) => setSignatureData(data)} />

              <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-brand-secondary dark:text-zinc-350">
                <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary/40 focus:ring-2 cursor-pointer"
                />
                <span className="leading-tight">
                  Li, compreendi e concordo com todos os termos e cláusulas do contrato acima, incluindo os valores, prazos, {presetContract?.hasTrade ? 'termos de permuta, ' : ''}{presetContract?.paymentMethod === 'fiado' ? 'cronograma de parcelas do fiado, ' : presetContract?.paymentMethod === 'custom' ? 'cronograma de pagamentos personalizados, ' : ''}e demais disposições legais.
                </span>
              </label>
            </div>
          )}

          {/* STEP: Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center text-center py-6 space-y-6 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shadow-lg relative">
                <Check className="w-8 h-8" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 animate-ping opacity-75"></span>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-50 px-3 py-1 rounded-full">Contrato Assinado com Sucesso!</span>
                <h3 className="text-xl font-black text-brand-secondary dark:text-white mt-2">Obrigado, {clientData.name.split(' ')[0]}!</h3>
                <p className="text-xs text-brand-muted max-w-sm mx-auto leading-relaxed">
                  Sua assinatura digital foi registrada com sucesso e o lojista foi notificado em nosso sistema de vendas.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 max-w-sm w-full space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-brand-muted">Contrato ID:</span>
                  <span className="font-mono font-black text-brand-secondary flex items-center gap-1.5">
                    <Clipboard className="w-3.5 h-3.5 text-brand-primary" />
                    {generatedContractId}
                  </span>
                </div>
                <div className="border-t border-gray-200/50 my-2 pt-2 flex justify-between items-center text-xs">
                  <span className="font-bold text-brand-muted">Total:</span>
                  <span className="font-black text-brand-primary font-mono">{activeTotals.cash}</span>
                </div>
                {(presetContract?.paymentMethod === 'fiado' || presetContract?.paymentMethod === 'custom') && (
                  <div className="border-t border-gray-200/50 my-2 pt-2 flex justify-between items-center text-xs">
                    <span className="font-bold text-brand-muted">Parcelas:</span>
                    <span className="font-black text-amber-600 font-mono">{presetContract.installments?.length}x</span>
                  </div>
                )}
                {presetContract?.hasTrade && (
                  <div className="border-t border-gray-200/50 my-2 pt-2 flex justify-between items-center text-xs">
                    <span className="font-bold text-brand-muted">Permuta registrada:</span>
                    <span className="font-bold text-purple-600">{presetContract.tradeDevice?.brand} {presetContract.tradeDevice?.model}</span>
                  </div>
                )}
              </div>
              <div className="text-[10px] font-bold text-brand-muted flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                Clique no botão verde abaixo para notificar o vendedor no WhatsApp!
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="border-t border-gray-150 dark:border-zinc-800 pt-4 mt-5 flex-shrink-0 flex gap-3">
          {step === 'form' && !presetContract && (
            <>
              <button type="button" onClick={handleClose}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-brand-secondary text-xs font-bold rounded-xl transition-all cursor-pointer">
                Voltar ao Orçamento
              </button>
              <button type="button" onClick={handleNextFromForm}
                className="flex-1 py-3 bg-brand-primary hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer">
                Ver Contrato <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'terms' && (
            <>
              {!presetContract && (
                <button type="button" onClick={() => setStep('form')}
                  className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-brand-secondary text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer">
                  <ArrowLeft className="w-4 h-4" /> Dados
                </button>
              )}
              <button type="button" onClick={handleNextFromTerms}
                className="flex-1 py-3 bg-brand-primary hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer">
                {needsAnyDoc ? 'Enviar Documentos' : 'Prosseguir para Assinatura'} <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'docs' && (
            <>
              <button type="button" onClick={() => setStep('terms')}
                className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-brand-secondary text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Termos
              </button>
              <button type="button" onClick={handleNextFromDocs}
                className="flex-1 py-3 bg-brand-primary hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer">
                Prosseguir para Assinatura <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'sign' && (
            <>
              <button type="button" onClick={() => setStep(needsAnyDoc ? 'docs' : 'terms')}
                className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-brand-secondary text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> {needsAnyDoc ? 'Docs' : 'Termos'}
              </button>
              <button type="button" onClick={handleSignAndSubmit}
                disabled={!signatureData || !agreedToTerms || isSubmitting}
                className={`flex-1 py-3 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all ${
                  (!signatureData || !agreedToTerms || isSubmitting)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                    : 'bg-green-600 hover:bg-green-700 shadow-green-500/10'
                }`}>
                {isSubmitting ? 'Salvando...' : 'Confirmar e Assinar'} <Check className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'success' && (
            <>
              {!presetContract && (
                <button type="button" onClick={onClose}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-brand-secondary text-xs font-bold rounded-xl cursor-pointer">
                  Fechar e Voltar
                </button>
              )}
              <button type="button" onClick={() => window.open(getWhatsAppMessage(), '_blank')}
                className="flex-1 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/10 hover:shadow-green-500/20 transition-all cursor-pointer">
                <Phone className="w-4 h-4" /> Enviar no WhatsApp
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
