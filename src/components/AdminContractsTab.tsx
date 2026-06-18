import { useState } from 'react';
import { 
  Search, FileText, Printer, Trash2, X, Eye, 
  TrendingUp, CheckCircle, Sparkles, Filter, 
  PlusCircle, Copy, Check, ExternalLink, Trash,
  Calendar, Upload, AlertTriangle, ShieldCheck
} from 'lucide-react';
import type { Contract, Product, CartItem, Installment } from '../types';

interface AdminContractsTabProps {
  contracts: Contract[];
  onUpdateContracts: (updatedContracts: Contract[]) => void;
  storeName: string;
  products: Product[];
}

interface DraftItem {
  productIdx: number;
  selectedColorIdx: number;
  quantity: number;
}

export default function AdminContractsTab({
  contracts,
  onUpdateContracts,
  storeName,
  products
}: AdminContractsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Contract creation states
  const [isCreating, setIsCreating] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    address: '',
    observations: '',
    startDate: new Date().toISOString().slice(0, 10),
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    deliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    paymentMethod: 'pix' as 'pix' | 'card' | 'fiado',
    fiadoDownPayment: 'R$ 0,00',
    fiadoInstallmentsCount: 1,
    hasTrade: false,
    tradeBrand: 'Apple',
    tradeModel: '',
    tradeColor: '',
    tradeStorage: '128GB',
    tradeIMEI: '',
    tradeCondition: 'good' as 'new' | 'seminew' | 'good' | 'regular' | 'defective',
    tradeDescription: '',
    tradeValue: 'R$ 0,00',
  });

  // Photo uploads state in form
  const [tradePhoto, setTradePhoto] = useState<string>('');
  const [rgFront, setRgFront] = useState<string>('');
  const [rgBack, setRgBack] = useState<string>('');
  const [addressProof, setAddressProof] = useState<string>('');

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [itemSelector, setItemSelector] = useState<DraftItem>({
    productIdx: 0,
    selectedColorIdx: 0,
    quantity: 1
  });

  // Installment payment registrar inline state
  const [payingInstallmentId, setPayingInstallmentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  // Generated link state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedLinkInfo, setGeneratedLinkInfo] = useState({
    link: '',
    clientName: '',
    clientPhone: '',
    contractId: ''
  });
  const [copied, setCopied] = useState(false);

  // Status labels & color maps
  const statusLabels: Record<string, string> = {
    pending: 'Aguardando Assinatura',
    signed: 'Assinado pelo Cliente',
    approved: 'Aprovado / Em Produção',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
    active: 'Contrato Ativo',
    expired: 'Expirado',
    overdue: 'Em atraso',
    completed: 'Finalizado'
  };

  const statusStyles: Record<string, string> = {
    pending: 'bg-zinc-150 text-zinc-700 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700/60',
    signed: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30',
    approved: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30',
    delivered: 'bg-green-50 text-green-700 border-green-100 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/30',
    cancelled: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30',
    expired: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30',
    overdue: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/50',
    completed: 'bg-zinc-200 text-zinc-800 border-zinc-300 dark:bg-zinc-700/50 dark:text-zinc-350 dark:border-zinc-600'
  };

  // Helper date calculations
  const getDaysRemaining = (expDateStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const exp = new Date(expDateStr);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Standard CPF and Phone masks
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const parsePrice = (priceStr: string): number => {
    if (!priceStr) return 0;
    const clean = priceStr.replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Form input change handlers
  const handleClientFormChange = (field: string, value: string) => {
    let formattedValue = value;
    if (field === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (field === 'phone') {
      formattedValue = formatPhone(value);
    } else if (field === 'tradeValue' || field === 'fiadoDownPayment') {
      // currency mask helper
      const digits = value.replace(/\D/g, '');
      const parsedDigits = parseFloat(digits) / 100;
      formattedValue = isNaN(parsedDigits) ? 'R$ 0,00' : formatPrice(parsedDigits);
    }
    
    setClientForm(prev => ({ ...prev, [field]: formattedValue }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Canvas-based image compression
  const compressImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 500; // max size in px for rg and trade images
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6); // jpeg compression
          callback(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'trade' | 'rgFront' | 'rgBack' | 'proof') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setter = {
      trade: setTradePhoto,
      rgFront: setRgFront,
      rgBack: setRgBack,
      proof: setAddressProof
    }[type];

    compressImage(file, setter);
  };

  // Metrics
  const totalRevenue = contracts
    .filter(c => c.status !== 'cancelled' && c.status !== 'pending')
    .reduce((acc, curr) => acc + parsePrice(curr.cashTotal), 0);

  const pendingCount = contracts.filter(c => c.status === 'signed' || c.status === 'approved' || c.status === 'active').length;
  const draftPendingSig = contracts.filter(c => c.status === 'pending').length;
  const deliveredCount = contracts.filter(c => c.status === 'delivered' || c.status === 'completed').length;

  // Filter & Search
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = 
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientCPF.includes(searchTerm) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    
    // Virtual status checks
    if (statusFilter === 'overdue') {
      const hasOverdueInstallment = c.installments?.some(i => i.status === 'overdue') || false;
      matchesStatus = c.status === 'overdue' || hasOverdueInstallment;
    }

    return matchesSearch && matchesStatus;
  });

  // Add Item to Draft
  const handleAddItemToDraft = () => {
    if (itemSelector.productIdx < 0 || itemSelector.productIdx >= products.length) return;
    
    const existingIdx = draftItems.findIndex(
      item => item.productIdx === itemSelector.productIdx && 
              item.selectedColorIdx === itemSelector.selectedColorIdx
    );

    if (existingIdx >= 0) {
      setDraftItems(prev => prev.map((item, idx) => 
        idx === existingIdx 
          ? { ...item, quantity: item.quantity + itemSelector.quantity }
          : item
      ));
    } else {
      setDraftItems(prev => [...prev, { ...itemSelector }]);
    }
    
    setItemSelector(prev => ({ ...prev, quantity: 1 }));
  };

  const handleRemoveItemFromDraft = (index: number) => {
    setDraftItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Calculate Draft Totals
  const getDraftTotals = () => {
    let cashTotal = 0;
    let installmentTotal = 0;
    
    draftItems.forEach(item => {
      const prod = products[item.productIdx];
      if (prod) {
        cashTotal += parsePrice(prod.cashPrice) * item.quantity;
        installmentTotal += parsePrice(prod.installmentPrice) * item.quantity;
      }
    });

    // Subtrai o valor da permuta se ativada
    if (clientForm.hasTrade) {
      const tradeValueNum = parsePrice(clientForm.tradeValue);
      cashTotal = Math.max(0, cashTotal - tradeValueNum);
      installmentTotal = Math.max(0, installmentTotal - tradeValueNum);
    }

    return {
      cash: formatPrice(cashTotal),
      installment: formatPrice(installmentTotal),
      count: draftItems.reduce((acc, curr) => acc + curr.quantity, 0)
    };
  };

  // Submit Draft and Create Contract
  const handleCreateDraftContract = async () => {
    const newErrors: Record<string, string> = {};
    if (!clientForm.name.trim()) newErrors.name = 'Nome completo é obrigatório';
    if (!clientForm.cpf.trim() || clientForm.cpf.replace(/\D/g, '').length !== 11) {
      newErrors.cpf = 'Insira um CPF válido';
    }
    if (!clientForm.phone.trim() || clientForm.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Insira um telefone/WhatsApp';
    }
    if (!clientForm.address.trim()) newErrors.address = 'Endereço de entrega obrigatório';
    if (draftItems.length === 0) newErrors.items = 'Adicione produtos ao contrato';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const cartItems: CartItem[] = draftItems.map(item => {
      const prod = products[item.productIdx];
      const color = prod.colors[item.selectedColorIdx] || { name: 'Padrão', hex: '#FFFFFF', img: '' };
      return {
        id: `${prod.model}-${prod.storage}-${color.name}`,
        model: prod.model,
        category: prod.category,
        storage: prod.storage,
        colorName: color.name,
        colorHex: color.hex,
        img: color.img || '',
        cashPrice: prod.cashPrice,
        installmentPrice: prod.installmentPrice,
        quantity: item.quantity
      };
    });

    const totals = getDraftTotals();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const year = new Date().getFullYear().toString().slice(-2);
    const contractId = `CTR-${year}${randomNum}`;

    // Generate installments for fiado if selected
    let installments: Installment[] = [];
    if (clientForm.paymentMethod === 'fiado') {
      const count = clientForm.fiadoInstallmentsCount || 1;
      const cashTotalNum = parsePrice(totals.cash);
      const downPaymentNum = parsePrice(clientForm.fiadoDownPayment);
      const remainingBalance = Math.max(0, cashTotalNum - downPaymentNum);
      const valPerInstallment = remainingBalance / count;

      for (let i = 1; i <= count; i++) {
        const dueDate = new Date(clientForm.startDate);
        dueDate.setDate(dueDate.getDate() + (i * 30));
        installments.push({
          id: `P${i}`,
          dueDate: dueDate.toISOString().slice(0, 10),
          value: formatPrice(valPerInstallment),
          status: 'pending',
          paidValue: 'R$ 0,00',
          payments: []
        });
      }
    }

    const newContract: Contract = {
      id: contractId,
      clientName: clientForm.name,
      clientCPF: clientForm.cpf,
      clientPhone: clientForm.phone,
      clientEmail: clientForm.email || undefined,
      clientAddress: clientForm.address,
      items: cartItems,
      cashTotal: totals.cash,
      installmentTotal: totals.installment,
      signature: '',
      date: new Date().toISOString(),
      status: 'pending',
      observations: clientForm.observations || undefined,
      
      startDate: clientForm.startDate,
      expirationDate: clientForm.expirationDate,
      deliveryDate: clientForm.deliveryDate,
      paymentMethod: clientForm.paymentMethod,

      hasTrade: clientForm.hasTrade,
      tradeDevice: clientForm.hasTrade ? {
        brand: clientForm.tradeBrand,
        model: clientForm.tradeModel,
        color: clientForm.tradeColor,
        storage: clientForm.tradeStorage,
        imei: clientForm.tradeIMEI,
        condition: clientForm.tradeCondition,
        description: clientForm.tradeDescription || undefined,
        evaluatedValue: clientForm.tradeValue,
        photo: tradePhoto || undefined
      } : undefined,

      installments: clientForm.paymentMethod === 'fiado' ? installments : undefined,
      fiadoDownPayment: clientForm.paymentMethod === 'fiado' ? clientForm.fiadoDownPayment : undefined,

      documents: (rgFront || rgBack || addressProof) ? {
        rgFront: rgFront || undefined,
        rgBack: rgBack || undefined,
        addressProof: addressProof || undefined
      } : undefined
    };

    onUpdateContracts([...contracts, newContract]);

    const signLink = `${window.location.origin}${window.location.pathname}#sign-contract=${contractId}`;
    setGeneratedLinkInfo({
      link: signLink,
      clientName: clientForm.name,
      clientPhone: clientForm.phone,
      contractId: contractId
    });

    // Reset Form States
    setIsCreating(false);
    setClientForm({
      name: '',
      cpf: '',
      phone: '',
      email: '',
      address: '',
      observations: '',
      startDate: new Date().toISOString().slice(0, 10),
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      deliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      paymentMethod: 'pix',
      fiadoDownPayment: 'R$ 0,00',
      fiadoInstallmentsCount: 1,
      hasTrade: false,
      tradeBrand: 'Apple',
      tradeModel: '',
      tradeColor: '',
      tradeStorage: '128GB',
      tradeIMEI: '',
      tradeCondition: 'good',
      tradeDescription: '',
      tradeValue: 'R$ 0,00'
    });
    setTradePhoto('');
    setRgFront('');
    setRgBack('');
    setAddressProof('');
    setDraftItems([]);
    setErrors({});
    setShowLinkModal(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLinkInfo.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendLinkWhatsApp = () => {
    const textMessage = `*Olá ${generatedLinkInfo.clientName}!* ✍️\n\nElaboramos o Contrato de Encomenda do seu pedido na *${storeName}* (ID: ${generatedLinkInfo.contractId}).\n\nPor favor, acesse o link seguro abaixo para conferir os itens, ler as cláusulas e assinar digitalmente de forma simples e rápida:\n\n🔗 *Link para Assinar:* ${generatedLinkInfo.link}\n\nQualquer dúvida, estamos à disposição!`;
    const cleanPhone = generatedLinkInfo.clientPhone.replace(/[^\d]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(textMessage)}`, '_blank');
  };

  // Register a payment on a specific installment (supporting partial payments)
  const handleRegisterPayment = (installmentId: string) => {
    if (!selectedContract || !paymentAmount) return;

    const amountNum = parsePrice(paymentAmount);
    if (amountNum <= 0) return;

    const updatedInstallments = selectedContract.installments?.map(inst => {
      if (inst.id === installmentId) {
        const currentPaid = parsePrice(inst.paidValue || 'R$ 0,00');
        const newPaid = currentPaid + amountNum;
        const instVal = parsePrice(inst.value);
        const isCompleted = newPaid >= instVal;

        const updatedPayments = [...(inst.payments || [])];
        updatedPayments.push({
          date: new Date().toISOString(),
          value: formatPrice(amountNum)
        });

        return {
          ...inst,
          paidValue: formatPrice(newPaid),
          status: isCompleted ? 'paid' as const : 'pending' as const,
          paymentDate: isCompleted ? new Date().toISOString() : undefined,
          payments: updatedPayments
        };
      }
      return inst;
    }) || [];

    // Check if all installments are fully paid
    const allPaid = updatedInstallments.every(i => i.status === 'paid');
    const newStatus: Contract['status'] = allPaid ? 'completed' : selectedContract.status;

    const updatedContract: Contract = {
      ...selectedContract,
      installments: updatedInstallments,
      status: newStatus
    };

    const updatedContracts = contracts.map(c => 
      c.id === selectedContract.id ? updatedContract : c
    );

    onUpdateContracts(updatedContracts);
    setSelectedContract(updatedContract);
    setPayingInstallmentId(null);
    setPaymentAmount('');
  };

  // Get total amount received for a contract (Downpayment + payments)
  const getTotalAmountPaid = (c: Contract) => {
    let total = 0;
    if (c.paymentMethod === 'fiado') {
      total += parsePrice(c.fiadoDownPayment || 'R$ 0,00');
      c.installments?.forEach(inst => {
        total += parsePrice(inst.paidValue || 'R$ 0,00');
      });
    } else if (c.status !== 'pending' && c.status !== 'cancelled') {
      total = parsePrice(c.cashTotal);
    }
    return total;
  };

  const getRemainingDebt = (c: Contract) => {
    const cashTotal = parsePrice(c.cashTotal);
    const paid = getTotalAmountPaid(c);
    return Math.max(0, cashTotal - paid);
  };

  // Update the status of a contract
  const handleUpdateStatus = (contractId: string, newStatus: Contract['status']) => {
    const updatedContracts = contracts.map(c =>
      c.id === contractId ? { ...c, status: newStatus } : c
    );
    if (selectedContract?.id === contractId) {
      setSelectedContract(prev => prev ? { ...prev, status: newStatus } : null);
    }
    onUpdateContracts(updatedContracts);
  };

  // Delete a contract
  const handleDeleteContract = (contractId: string) => {
    if (!window.confirm('Confirma a exclusão permanente deste contrato? Esta ação não pode ser desfeita.')) return;
    const updatedContracts = contracts.filter(c => c.id !== contractId);
    if (selectedContract?.id === contractId) setSelectedContract(null);
    onUpdateContracts(updatedContracts);
  };

  // Print contract in a new clean window
  const handlePrintContract = (c: Contract) => {
    const condLabels: Record<string, string> = {
      new: 'Novo (lacrado)', seminew: 'Seminovo (excelente)', good: 'Bom estado',
      regular: 'Estado regular', defective: 'Com defeito'
    };
    const payLabels: Record<string, string> = {
      pix: 'PIX / Transferência Bancária',
      card: 'Cartão de Crédito',
      fiado: 'Fiado / A Prazo'
    };
    const fmtDate = (d?: string) => {
      if (!d) return '—';
      const [y, m, dd] = d.split('-');
      return `${dd}/${m}/${y}`;
    };

    const installmentRows = c.installments?.map(inst => `
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:6px 8px;font-weight:bold;color:#0A84FF">${inst.id}</td>
        <td style="padding:6px 8px;text-align:center">${fmtDate(inst.dueDate)}</td>
        <td style="padding:6px 8px;text-align:right;font-weight:bold">${inst.value}</td>
        <td style="padding:6px 8px;text-align:center">${inst.paidValue || 'R$ 0,00'}</td>
        <td style="padding:6px 8px;text-align:center;font-weight:bold;color:${inst.status === 'paid' ? '#22c55e' : inst.status === 'overdue' ? '#ef4444' : '#888'}">${inst.status === 'paid' ? 'Pago' : inst.status === 'overdue' ? 'Em atraso' : 'Pendente'}</td>
      </tr>
    `).join('') || '';

    const tradeSection = c.hasTrade && c.tradeDevice ? `
      <div style="border:1px solid #ddd;border-radius:8px;padding:16px;margin-top:16px">
        <h3 style="margin:0 0 8px;font-size:13px;color:#7c3aed">🔄 PERMUTA DE APARELHO</h3>
        <table style="width:100%;font-size:12px">
          <tr><td style="padding:3px 0;color:#666;width:140px">Aparelho Entregue:</td><td><strong>${c.tradeDevice.brand} ${c.tradeDevice.model} ${c.tradeDevice.storage} — ${c.tradeDevice.color}</strong></td></tr>
          <tr><td style="padding:3px 0;color:#666">IMEI:</td><td><strong>${c.tradeDevice.imei}</strong></td></tr>
          <tr><td style="padding:3px 0;color:#666">Estado:</td><td>${condLabels[c.tradeDevice.condition] || c.tradeDevice.condition}</td></tr>
          ${c.tradeDevice.description ? `<tr><td style="padding:3px 0;color:#666">Obs.:</td><td>${c.tradeDevice.description}</td></tr>` : ''}
          <tr><td style="padding:3px 0;color:#666">Valor Avaliado:</td><td><strong style="color:#22c55e">${c.tradeDevice.evaluatedValue}</strong></td></tr>
        </table>
        ${c.tradeDevice.photo ? `<img src="${c.tradeDevice.photo}" style="max-height:120px;border-radius:8px;margin-top:8px;border:1px solid #ddd" />` : ''}
      </div>
    ` : '';

    const fiadoSection = c.paymentMethod === 'fiado' && c.installments ? `
      <div style="border:1px solid #ddd;border-radius:8px;padding:16px;margin-top:16px">
        <h3 style="margin:0 0 8px;font-size:13px;color:#d97706">📅 CRONOGRAMA DE PARCELAS (FIADO)</h3>
        <p style="font-size:12px;margin:0 0 8px">Entrada: <strong>${c.fiadoDownPayment || 'R$ 0,00'}</strong> | Saldo Devedor: <strong style="color:#ef4444">${formatPrice(getRemainingDebt(c))}</strong></p>
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <thead><tr style="background:#f5f5f7;font-size:11px;font-weight:bold;color:#666">
            <th style="padding:6px 8px;text-align:left">Parc.</th>
            <th style="padding:6px 8px;text-align:center">Vencimento</th>
            <th style="padding:6px 8px;text-align:right">Valor</th>
            <th style="padding:6px 8px;text-align:center">Pago</th>
            <th style="padding:6px 8px;text-align:center">Status</th>
          </tr></thead>
          <tbody>${installmentRows}</tbody>
        </table>
      </div>
    ` : '';

    const docSection = c.documents ? `
      <div style="border:1px solid #ddd;border-radius:8px;padding:16px;margin-top:16px">
        <h3 style="margin:0 0 8px;font-size:13px;color:#0A84FF">📎 DOCUMENTOS DO CLIENTE</h3>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          ${c.documents.rgFront ? `<div><p style="font-size:10px;color:#666;margin:0 0 4px">RG/CNH Frente</p><img src="${c.documents.rgFront}" style="max-height:100px;border-radius:6px;border:1px solid #ddd" /></div>` : ''}
          ${c.documents.rgBack ? `<div><p style="font-size:10px;color:#666;margin:0 0 4px">RG/CNH Verso</p><img src="${c.documents.rgBack}" style="max-height:100px;border-radius:6px;border:1px solid #ddd" /></div>` : ''}
          ${c.documents.addressProof ? `<div><p style="font-size:10px;color:#666;margin:0 0 4px">Comprovante</p><img src="${c.documents.addressProof}" style="max-height:100px;border-radius:6px;border:1px solid #ddd" /></div>` : ''}
        </div>
      </div>
    ` : '';

    const sigSection = c.signature ? `
      <div style="border:1px solid #ddd;border-radius:8px;padding:16px;margin-top:16px;text-align:center">
        <h3 style="margin:0 0 8px;font-size:13px;color:#111">✍️ ASSINATURA DIGITAL DO CLIENTE</h3>
        <img src="${c.signature}" style="max-height:100px;border-radius:6px;border:1px solid #e5e7eb" />
        <p style="font-size:10px;color:#888;margin:6px 0 0">Assinado em: ${new Date(c.date).toLocaleString('pt-BR')}</p>
      </div>
    ` : '';

    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html lang="pt-BR"><head>
      <meta charset="UTF-8" /><title>Contrato ${c.id} — ${storeName}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111; padding: 32px; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
        h2 { font-size: 14px; font-weight: 800; color: #0A84FF; margin: 20px 0 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { padding: 8px; border: 1px solid #eee; }
        th { background: #f5f5f7; font-weight: bold; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; }
        @media print { button { display: none; } }
      </style>
    </head><body>
      <h1>CONTRATO DE ENCOMENDA — ${c.id}</h1>
      <p style="text-align:center;font-size:12px;color:#888;margin:0 0 24px">${storeName}</p>
      <h2>DADOS DO CLIENTE</h2>
      <table><tr><td style="width:140px;color:#666">Nome:</td><td><strong>${c.clientName}</strong></td></tr>
        <tr><td style="color:#666">CPF:</td><td>${c.clientCPF}</td></tr>
        <tr><td style="color:#666">Telefone:</td><td>${c.clientPhone}</td></tr>
        ${c.clientEmail ? `<tr><td style="color:#666">E-mail:</td><td>${c.clientEmail}</td></tr>` : ''}
        <tr><td style="color:#666">Endereço:</td><td>${c.clientAddress}</td></tr>
      </table>
      <h2>EQUIPAMENTOS</h2>
      <table><thead><tr><th>Modelo</th><th>Capacidade</th><th>Cor</th><th>Qtd.</th><th>Preço Unit.</th></tr></thead>
        <tbody>${c.items.map(i => `<tr><td>${i.model}</td><td>${i.storage}</td><td>${i.colorName}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right;font-weight:bold">${i.cashPrice}</td></tr>`).join('')}</tbody>
      </table>
      <h2>VALORES E DATAS</h2>
      <table>
        <tr><td style="width:180px;color:#666">Total à Vista (PIX):</td><td><strong style="color:#0A84FF">${c.cashTotal}</strong></td></tr>
        <tr><td style="color:#666">Forma de Pagamento:</td><td><strong>${payLabels[c.paymentMethod] || c.paymentMethod}</strong></td></tr>
        <tr><td style="color:#666">Início:</td><td>${fmtDate(c.startDate)}</td></tr>
        <tr><td style="color:#666">Entrega Estimada:</td><td>${fmtDate(c.deliveryDate)}</td></tr>
        <tr><td style="color:#666">Expiração do Contrato:</td><td>${fmtDate(c.expirationDate)}</td></tr>
        ${c.observations ? `<tr><td style="color:#666">Observações:</td><td>${c.observations}</td></tr>` : ''}
      </table>
      ${tradeSection}
      ${fiadoSection}
      ${docSection}
      ${sigSection}
      <p style="font-size:10px;color:#aaa;text-align:right;margin-top:32px">Gerado em: ${new Date().toLocaleString('pt-BR')} — ${storeName}</p>
      <div style="text-align:center;margin-top:16px"><button onclick="window.print()" style="padding:10px 24px;background:#0A84FF;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer">🖨️ Imprimir / Salvar PDF</button></div>
    </body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* Metric Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="premium-card p-5 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase tracking-wider">Faturamento Assinado</span>
          <span className="text-2xl font-black text-brand-secondary dark:text-white flex items-center gap-1.5 font-mono">
            <TrendingUp className="w-5 h-5 text-green-500" />
            {formatPrice(totalRevenue)}
          </span>
          <span className="text-[9px] text-brand-primary font-bold">exclui pendentes e cancelados</span>
        </div>
        <div className="premium-card p-5 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase tracking-wider">Aguardando Assinatura</span>
          <span className="text-2xl font-black text-brand-secondary dark:text-white flex items-center gap-1.5 font-mono">
            <FileText className="w-5 h-5 text-zinc-400" />
            {draftPendingSig}
          </span>
          <span className="text-[9px] text-brand-muted dark:text-zinc-400 font-bold">links de assinatura gerados</span>
        </div>
        <div className="premium-card p-5 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase tracking-wider">Contratos Ativos</span>
          <span className="text-2xl font-black text-brand-secondary dark:text-white flex items-center gap-1.5 font-mono">
            <CheckCircle className="w-5 h-5 text-blue-500" />
            {pendingCount}
          </span>
          <span className="text-[9px] text-brand-primary font-bold">assinados em andamento</span>
        </div>
        <div className="premium-card p-5 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase tracking-wider">Entregues / Concluídos</span>
          <span className="text-2xl font-black text-brand-secondary dark:text-white flex items-center gap-1.5 font-mono">
            <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
            {deliveredCount}
          </span>
          <span className="text-[9px] text-green-500 font-bold">pedidos finalizados</span>
        </div>
      </section>

      {/* Control Panel */}
      <div className="premium-card p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-extrabold text-brand-secondary dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-primary" />
            Base de Contratos
          </h3>
          <button
            onClick={() => setIsCreating(true)}
            className="py-1.5 px-3 bg-brand-primary hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Criar Contrato
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3 flex-grow md:max-w-2xl justify-end">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-muted" />
            <input 
              type="text" 
              placeholder="Pesquisar por Nome, CPF ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/60 rounded-xl pl-10 pr-4 py-2.5 text-brand-secondary dark:text-white focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="relative min-w-[150px]">
            <Filter className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-brand-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/60 rounded-xl pl-9 pr-8 py-2.5 text-brand-secondary dark:text-white focus:outline-none focus:border-brand-primary appearance-none cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Aguardando Assinatura</option>
              <option value="signed">Assinado pelo Cliente</option>
              <option value="approved">Aprovado</option>
              <option value="delivered">Entregue</option>
              <option value="completed">Finalizado</option>
              <option value="overdue">Em atraso / Fiado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="premium-card overflow-hidden">
        {filteredContracts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-brand-muted">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-brand-secondary dark:text-white uppercase">Nenhum Contrato Encontrado</h4>
              <p className="text-[11px] text-brand-muted dark:text-zinc-400 mt-1 max-w-sm">Use a barra de pesquisa ou mude os filtros para buscar outros registros.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto responsive-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-150 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/10 text-brand-muted dark:text-zinc-450 uppercase font-black tracking-wider text-[10px]">
                  <th className="p-4">Contrato ID</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Data Vencimento</th>
                  <th className="p-4">Valor Final PIX</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {filteredContracts.map((c) => {
                  const daysLeft = getDaysRemaining(c.expirationDate);
                  const isExpiringSoon = daysLeft >= 0 && daysLeft <= 3 && c.status !== 'completed' && c.status !== 'cancelled';
                  
                  return (
                    <tr 
                      key={c.id} 
                      className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/10 transition-colors"
                    >
                      <td className="p-4 font-mono font-bold text-brand-secondary dark:text-white">
                        <div className="flex flex-col">
                          <span>{c.id}</span>
                          {isExpiringSoon && (
                            <span className="text-[9px] text-amber-500 font-bold flex items-center gap-0.5 animate-pulse mt-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Vence em {daysLeft}d
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-extrabold text-brand-secondary dark:text-white">{c.clientName}</div>
                        <div className="text-[10px] text-brand-muted dark:text-zinc-455 mt-0.5 font-mono">CPF: {c.clientCPF}</div>
                      </td>
                      <td className="p-4 text-brand-secondary dark:text-zinc-300">
                        {new Date(c.expirationDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 font-mono font-bold text-brand-primary">
                        {c.cashTotal}
                        {c.paymentMethod === 'fiado' && (
                          <div className="text-[9px] text-red-500 font-semibold mt-0.5 font-sans">
                            Restam: {formatPrice(getRemainingDebt(c))}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <span className={`px-2.5 py-1 text-[10px] font-black rounded-full border ${statusStyles[c.status]}`}>
                            {statusLabels[c.status]}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedContract(c)}
                            className="p-1.5 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors cursor-pointer"
                            title="Visualizar Contrato"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {c.status === 'pending' && (
                            <button
                              onClick={() => {
                                const signLink = `${window.location.origin}${window.location.pathname}#sign-contract=${c.id}`;
                                setGeneratedLinkInfo({
                                  link: signLink,
                                  clientName: c.clientName,
                                  clientPhone: c.clientPhone,
                                  contractId: c.id
                                });
                                setShowLinkModal(true);
                              }}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-955/20 rounded-lg transition-colors cursor-pointer"
                              title="Obter Link de Assinatura"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handlePrintContract(c)}
                            className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-zinc-450 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Imprimir"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContract(c.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Contrato"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contract Detail View Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl relative border border-gray-100 dark:border-zinc-800 flex flex-col my-8 max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-150 dark:border-zinc-800 pb-4 mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-primary" />
                <div>
                  <h3 className="text-sm font-black text-brand-secondary dark:text-white uppercase">Detalhes do Contrato</h3>
                  <p className="text-[10px] text-brand-muted dark:text-zinc-400 font-mono mt-0.5">{selectedContract.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedContract(null)}
                className="text-gray-400 hover:text-gray-655 dark:hover:text-zinc-350 p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-grow overflow-y-auto pr-1 space-y-5">
              
              {/* Status Controller Card */}
              <div className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner text-xs">
                <div>
                  <span className="font-bold text-brand-muted dark:text-zinc-400 block mb-0.5">Alterar Status do Contrato:</span>
                  <p className="text-[10px] text-brand-muted dark:text-zinc-450 leading-tight">Altere o status para andamento e encerramento do contrato.</p>
                </div>
                <select
                  value={selectedContract.status}
                  onChange={(e) => handleUpdateStatus(selectedContract.id, e.target.value as Contract['status'])}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border appearance-none focus:outline-none cursor-pointer ${statusStyles[selectedContract.status]}`}
                >
                  <option value="pending">Aguardando Assinatura</option>
                  <option value="signed">Assinado pelo Cliente</option>
                  <option value="approved">Aprovado / Produção</option>
                  <option value="active">Contrato Ativo</option>
                  <option value="delivered">Entregue</option>
                  <option value="completed">Finalizado</option>
                  <option value="expired">Expirado</option>
                  <option value="overdue">Em atraso</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              {/* Personal details & Address grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="premium-card p-4 space-y-2">
                  <h4 className="font-black text-brand-primary uppercase text-[10px] tracking-wide flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Dados do Cliente</h4>
                  <div className="space-y-1 text-brand-secondary dark:text-zinc-300">
                    <p><strong>Nome:</strong> {selectedContract.clientName}</p>
                    <p><strong>CPF:</strong> {selectedContract.clientCPF}</p>
                    <p><strong>WhatsApp:</strong> {selectedContract.clientPhone}</p>
                    {selectedContract.clientEmail && <p><strong>Email:</strong> {selectedContract.clientEmail}</p>}
                  </div>
                </div>

                <div className="premium-card p-4 space-y-2">
                  <h4 className="font-black text-brand-primary uppercase text-[10px] tracking-wide flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Datas e Logística</h4>
                  <div className="space-y-1 text-brand-secondary dark:text-zinc-300">
                    <p><strong>Início:</strong> {new Date(selectedContract.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                    <p><strong>Prazo Entrega:</strong> {new Date(selectedContract.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                    <p><strong>Vencimento:</strong> {new Date(selectedContract.expirationDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              {/* Trade-in Device section */}
              {selectedContract.hasTrade && selectedContract.tradeDevice && (
                <div className="premium-card p-4 space-y-3 text-xs">
                  <h4 className="font-black text-brand-primary uppercase text-[10px] tracking-wide">🔄 Aparelho Recebido na Permuta</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 text-brand-secondary dark:text-zinc-300">
                      <p><strong>Aparelho:</strong> {selectedContract.tradeDevice.brand} {selectedContract.tradeDevice.model} ({selectedContract.tradeDevice.storage})</p>
                      <p><strong>Cor:</strong> {selectedContract.tradeDevice.color}</p>
                      <p><strong>IMEI:</strong> <span className="font-mono">{selectedContract.tradeDevice.imei}</span></p>
                      <p><strong>Conservação:</strong> <span className="capitalize">{selectedContract.tradeDevice.condition}</span></p>
                      {selectedContract.tradeDevice.description && <p><strong>Detalhes:</strong> {selectedContract.tradeDevice.description}</p>}
                      <p className="text-green-500 font-bold"><strong>Valor Abatido:</strong> {selectedContract.tradeDevice.evaluatedValue}</p>
                    </div>
                    {selectedContract.tradeDevice.photo && (
                      <div className="border border-gray-150 dark:border-zinc-800 rounded-xl p-2 flex items-center justify-center bg-gray-50/50 dark:bg-zinc-800/30 max-h-32">
                        <img src={selectedContract.tradeDevice.photo} alt="Foto Permuta" className="max-h-full max-w-full object-contain rounded-lg" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="premium-card p-4 space-y-3">
                <h4 className="font-black text-brand-primary uppercase text-[10px] tracking-wide">📦 Produtos do Contrato</h4>
                <div className="space-y-2">
                  {selectedContract.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs border-b border-gray-100 dark:border-zinc-800/60 pb-2 last:border-0 last:pb-0">
                      <div>
                        <span className="font-extrabold text-brand-secondary dark:text-white">{item.model}</span>
                        <div className="text-[10px] text-brand-muted dark:text-zinc-400 mt-0.5">
                          {item.storage} | Cor: {item.colorName}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-brand-secondary dark:text-white">{item.quantity}x {item.cashPrice}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-150 dark:border-zinc-800 pt-3 mt-2 flex flex-col md:flex-row justify-between text-xs gap-2">
                  <div>
                    <span className="text-[10px] text-brand-muted dark:text-zinc-400 block">Valor Final PIX:</span>
                    <span className="font-mono font-black text-brand-primary text-base">{selectedContract.cashTotal}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-brand-muted dark:text-zinc-400 block">Forma de Pagamento:</span>
                    <span className="font-bold text-brand-secondary dark:text-white uppercase">{selectedContract.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Fiado Installments Amortization Module */}
              {selectedContract.paymentMethod === 'fiado' && (
                <div className="premium-card p-4 space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b border-gray-150 dark:border-zinc-800 pb-2">
                    <h4 className="font-black text-brand-primary uppercase text-[10px] tracking-wide">💳 Parcelamento Fiado / A Prazo</h4>
                    <div className="flex gap-4 font-mono font-bold text-[11px]">
                      <div>Entrada: <span className="text-brand-secondary dark:text-white">{selectedContract.fiadoDownPayment || 'R$ 0,00'}</span></div>
                      <div className="text-red-500">Saldo Devedor: <span>{formatPrice(getRemainingDebt(selectedContract))}</span></div>
                    </div>
                  </div>

                  {/* Installment Grid */}
                  <div className="space-y-2">
                    {selectedContract.installments?.map((inst) => {
                      const isOverdue = new Date(inst.dueDate) < new Date() && inst.status === 'pending';
                      return (
                        <div 
                          key={inst.id} 
                          className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-gray-50/50 dark:bg-zinc-800/20 border border-gray-100 dark:border-zinc-800 rounded-xl gap-2 hover:border-gray-250 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary font-black flex items-center justify-center text-[10px]">{inst.id}</span>
                            <div>
                              <div className="font-extrabold text-brand-secondary dark:text-white">Parcela {inst.id.replace('P', '')} - {inst.value}</div>
                              <div className="text-[10px] text-brand-muted dark:text-zinc-450 mt-0.5">Vencimento: {new Date(inst.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 justify-between md:justify-end">
                            <div className="text-right">
                              <span className={`px-2 py-0.5 text-[9px] font-black rounded border uppercase ${
                                inst.status === 'paid' 
                                  ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-950/20 dark:text-green-400' 
                                  : isOverdue 
                                    ? 'bg-red-50 text-red-700 border-red-150 dark:bg-red-955/20 dark:text-red-400 animate-pulse'
                                    : 'bg-zinc-100 text-zinc-650 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                              }`}>
                                {inst.status === 'paid' ? 'Pago' : isOverdue ? 'Atrasado' : 'Pendente'}
                              </span>
                              {parsePrice(inst.paidValue || 'R$ 0,00') > 0 && inst.status !== 'paid' && (
                                <div className="text-[9px] text-green-500 font-bold mt-0.5 font-mono">Pago: {inst.paidValue}</div>
                              )}
                            </div>

                            {inst.status !== 'paid' && (
                              <div>
                                {payingInstallmentId === inst.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      placeholder="R$ 0,00"
                                      value={paymentAmount}
                                      onChange={(e) => {
                                        const digits = e.target.value.replace(/\D/g, '');
                                        const val = parseFloat(digits) / 100;
                                        setPaymentAmount(isNaN(val) ? 'R$ 0,00' : formatPrice(val));
                                      }}
                                      className="w-24 text-xs px-2.5 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg font-mono focus:outline-none"
                                    />
                                    <button
                                      onClick={() => handleRegisterPayment(inst.id)}
                                      className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                                    >
                                      Salvar
                                    </button>
                                    <button
                                      onClick={() => setPayingInstallmentId(null)}
                                      className="p-1 text-gray-400 hover:text-gray-655 cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setPayingInstallmentId(inst.id);
                                      // Default amount to remaining installment value
                                      const val = parsePrice(inst.value) - parsePrice(inst.paidValue || 'R$ 0,00');
                                      setPaymentAmount(formatPrice(val));
                                    }}
                                    className="px-2.5 py-1.5 bg-brand-secondary hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-lg font-bold text-[10px] cursor-pointer border border-brand-secondary dark:border-zinc-700"
                                  >
                                    Receber
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Payment History */}
                  {selectedContract.installments?.some(i => i.payments && i.payments.length > 0) && (
                    <div className="space-y-1.5 border-t border-gray-100 dark:border-zinc-800 pt-2.5">
                      <span className="font-bold text-[9px] text-brand-muted uppercase tracking-wider block">Histórico de Recebimentos</span>
                      <div className="bg-gray-50/20 dark:bg-zinc-850/20 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800/80">
                        <table className="w-full text-left text-[10px] border-collapse font-mono">
                          <thead>
                            <tr className="bg-gray-50/30 dark:bg-zinc-800/30 border-b border-gray-100 dark:border-zinc-850 font-bold">
                              <th className="p-2">Data / Hora</th>
                              <th className="p-2">Parcela</th>
                              <th className="p-2 text-right">Valor Pago</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/40">
                            {selectedContract.installments
                              .flatMap(inst => (inst.payments || []).map(p => ({ ...p, instId: inst.id })))
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((p, idx) => (
                                <tr key={idx}>
                                  <td className="p-2 text-brand-muted">{new Date(p.date).toLocaleString('pt-BR')}</td>
                                  <td className="p-2 font-sans font-bold">Parcela {p.instId.replace('P', '')}</td>
                                  <td className="p-2 text-right text-green-500 font-bold">{p.value}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Customer uploaded document cards */}
              {selectedContract.documents && (
                <div className="premium-card p-4 space-y-3 text-xs">
                  <h4 className="font-black text-brand-primary uppercase text-[10px] tracking-wide">📷 Documentos do Cliente (RG / CPF)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedContract.documents.rgFront && (
                      <div className="space-y-1 text-center">
                        <span className="text-[9px] text-brand-muted uppercase font-bold">RG Frente</span>
                        <div className="border border-gray-100 dark:border-zinc-850 bg-gray-50/20 dark:bg-zinc-800/10 rounded-xl p-1.5 flex items-center justify-center max-h-24 overflow-hidden">
                          <img src={selectedContract.documents.rgFront} alt="RG Frente" className="max-h-20 object-contain rounded-lg" />
                        </div>
                      </div>
                    )}
                    {selectedContract.documents.rgBack && (
                      <div className="space-y-1 text-center">
                        <span className="text-[9px] text-brand-muted uppercase font-bold">RG Verso</span>
                        <div className="border border-gray-100 dark:border-zinc-850 bg-gray-50/20 dark:bg-zinc-800/10 rounded-xl p-1.5 flex items-center justify-center max-h-24 overflow-hidden">
                          <img src={selectedContract.documents.rgBack} alt="RG Verso" className="max-h-20 object-contain rounded-lg" />
                        </div>
                      </div>
                    )}
                    {selectedContract.documents.addressProof && (
                      <div className="space-y-1 text-center">
                        <span className="text-[9px] text-brand-muted uppercase font-bold">Residência</span>
                        <div className="border border-gray-100 dark:border-zinc-850 bg-gray-50/20 dark:bg-zinc-800/10 rounded-xl p-1.5 flex items-center justify-center max-h-24 overflow-hidden">
                          <img src={selectedContract.documents.addressProof} alt="Residência" className="max-h-20 object-contain rounded-lg" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Observations */}
              {selectedContract.observations && (
                <div className="premium-card p-4 space-y-1 text-xs">
                  <h4 className="font-black text-brand-primary uppercase text-[10px] tracking-wide">Observações do Contrato</h4>
                  <p className="text-brand-secondary dark:text-zinc-350 italic">{selectedContract.observations}</p>
                </div>
              )}

              {/* Client Digital Signature Box */}
              <div className="premium-card p-4 flex flex-col items-center justify-center space-y-2">
                <h4 className="font-black text-brand-primary uppercase text-[10px] w-full text-left">Assinatura Digital</h4>
                {selectedContract.signature ? (
                  <>
                    <div className="border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/20 rounded-2xl p-4 w-full max-w-md flex justify-center shadow-inner">
                      <img 
                        src={selectedContract.signature} 
                        alt={`Assinatura de ${selectedContract.clientName}`} 
                        className="max-h-24 object-contain invert dark:invert-0" 
                      />
                    </div>
                    <span className="text-[9px] text-brand-muted dark:text-zinc-455 uppercase tracking-wide font-mono">
                      Autenticação: {selectedContract.id.replace('CTR-', '')}-{new Date(selectedContract.date).getTime()}
                    </span>
                  </>
                ) : (
                  <div className="border border-dashed border-gray-300 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/10 rounded-2xl py-6 px-4 w-full text-center text-xs text-brand-muted dark:text-zinc-450 font-bold italic">
                    Aguardando assinatura digital do cliente. Link de assinatura ativo.
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="border-t border-gray-150 dark:border-zinc-800 pt-4 mt-5 flex-shrink-0 flex gap-3">
              <button
                type="button"
                onClick={() => { setSelectedContract(null); setPayingInstallmentId(null); }}
                className="flex-grow py-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-brand-secondary dark:text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Voltar à Lista
              </button>
              <button
                type="button"
                onClick={() => handlePrintContract(selectedContract)}
                className="py-3 px-5 bg-brand-primary hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Imprimir / PDF
              </button>
              <button
                type="button"
                onClick={() => handleDeleteContract(selectedContract.id)}
                className="py-3 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-955/20 dark:hover:bg-red-955/40 text-red-500 rounded-xl transition-all cursor-pointer"
                title="Excluir Contrato"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE DRAFT CONTRACT MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl relative border border-gray-150 dark:border-zinc-800 flex flex-col my-8 max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-150 dark:border-zinc-800 pb-4 mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-brand-primary" />
                <div>
                  <h3 className="text-base font-black text-brand-secondary dark:text-white uppercase tracking-tight">Criar Novo Contrato</h3>
                  <p className="text-[10px] text-brand-muted dark:text-zinc-400 font-bold uppercase tracking-wider">Novo rascunho com prazos e formas de pagamento</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreating(false)}
                className="text-gray-400 hover:text-gray-655 dark:hover:text-zinc-350 p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-grow overflow-y-auto pr-1 space-y-6 text-xs">
              
              {/* Part 1: Client Personal Details */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-brand-primary tracking-wider">1. Dados do Cliente</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Nome Completo *</label>
                    <input
                      type="text"
                      placeholder="Ex: Ana Souza"
                      value={clientForm.name}
                      onChange={(e) => handleClientFormChange('name', e.target.value)}
                      className={`w-full text-xs bg-gray-50 dark:bg-zinc-800 border rounded-xl px-3 py-2.5 focus:outline-none ${errors.name ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700 focus:border-brand-primary'}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">CPF *</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={clientForm.cpf}
                      onChange={(e) => handleClientFormChange('cpf', e.target.value)}
                      className={`w-full text-xs bg-gray-50 dark:bg-zinc-800 border rounded-xl px-3 py-2.5 focus:outline-none ${errors.cpf ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700 focus:border-brand-primary'}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">WhatsApp * (com DDD)</label>
                    <input
                      type="text"
                      placeholder="Ex: (68) 99999-9999"
                      value={clientForm.phone}
                      onChange={(e) => handleClientFormChange('phone', e.target.value)}
                      className={`w-full text-xs bg-gray-50 dark:bg-zinc-800 border rounded-xl px-3 py-2.5 focus:outline-none ${errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700 focus:border-brand-primary'}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">E-mail</label>
                    <input
                      type="email"
                      placeholder="cliente@exemplo.com"
                      value={clientForm.email}
                      onChange={(e) => handleClientFormChange('email', e.target.value)}
                      className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Endereço de Entrega Completo *</label>
                  <input
                    type="text"
                    placeholder="Rua, número, bairro, cidade, CEP"
                    value={clientForm.address}
                    onChange={(e) => handleClientFormChange('address', e.target.value)}
                    className={`w-full text-xs bg-gray-50 dark:bg-zinc-800 border rounded-xl px-3 py-2.5 focus:outline-none ${errors.address ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700 focus:border-brand-primary'}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Observações Internas</label>
                  <input
                    type="text"
                    placeholder="Observações ou cláusulas adicionais..."
                    value={clientForm.observations}
                    onChange={(e) => handleClientFormChange('observations', e.target.value)}
                    className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              {/* Part 2: Dates and Deadlines */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-brand-primary tracking-wider">2. Prazos e Validade</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Data de Início do Contrato</label>
                    <input
                      type="date"
                      value={clientForm.startDate}
                      onChange={(e) => handleClientFormChange('startDate', e.target.value)}
                      className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Prazo Estimado de Entrega</label>
                    <input
                      type="date"
                      value={clientForm.deliveryDate}
                      onChange={(e) => handleClientFormChange('deliveryDate', e.target.value)}
                      className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Vencimento do Contrato</label>
                    <input
                      type="date"
                      value={clientForm.expirationDate}
                      onChange={(e) => handleClientFormChange('expirationDate', e.target.value)}
                      className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 py-1.5 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Part 3: Equipments Selector */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-brand-primary tracking-wider">3. Equipamentos Encomendados</h4>
                
                <div className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-150 dark:border-zinc-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end shadow-inner">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Aparelho</label>
                    <select
                      value={itemSelector.productIdx}
                      onChange={(e) => setItemSelector(prev => ({ ...prev, productIdx: parseInt(e.target.value), selectedColorIdx: 0 }))}
                      className="w-full text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-2.5 py-2 text-brand-secondary dark:text-white focus:outline-none cursor-pointer"
                    >
                      {products.map((p, idx) => (
                        <option key={idx} value={idx}>{p.model} ({p.storage}) - {p.cashPrice}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Cor</label>
                    <select
                      value={itemSelector.selectedColorIdx}
                      onChange={(e) => setItemSelector(prev => ({ ...prev, selectedColorIdx: parseInt(e.target.value) }))}
                      className="w-full text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-2.5 py-2 text-brand-secondary dark:text-white focus:outline-none cursor-pointer"
                    >
                      {products[itemSelector.productIdx]?.colors.map((c, idx) => (
                        <option key={idx} value={idx}>{c.name}</option>
                      )) || <option value={0}>Padrão</option>}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Qtd</label>
                    <input
                      type="number"
                      min={1}
                      value={itemSelector.quantity}
                      onChange={(e) => setItemSelector(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                      className="w-full text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-brand-secondary dark:text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItemToDraft}
                    className="py-2.5 bg-brand-secondary dark:bg-zinc-800 hover:bg-zinc-950 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Adicionar Item
                  </button>
                </div>

                {/* Selected Items */}
                {draftItems.length > 0 ? (
                  <div className="border border-gray-150 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-inner">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-zinc-800/10 border-b border-gray-150 dark:border-zinc-800 text-[10px] text-brand-muted uppercase font-black tracking-wider">
                          <th className="p-3">Modelo</th>
                          <th className="p-3">Cor</th>
                          <th className="p-3 text-center">Quantidade</th>
                          <th className="p-3 text-right">Preço PIX</th>
                          <th className="p-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {draftItems.map((item, idx) => {
                          const prod = products[item.productIdx];
                          const color = prod?.colors[item.selectedColorIdx] || { name: 'Padrão' };
                          return (
                            <tr key={idx} className="hover:bg-gray-50/20 dark:hover:bg-zinc-800/5 transition-colors">
                              <td className="p-3 font-extrabold text-brand-secondary dark:text-white">
                                {prod?.model} <span className="text-[10px] text-brand-muted font-normal">({prod?.storage})</span>
                              </td>
                              <td className="p-3 text-brand-secondary dark:text-zinc-350">{color.name}</td>
                              <td className="p-3 text-center font-bold">{item.quantity}</td>
                              <td className="p-3 text-right font-mono font-bold text-brand-primary">{prod?.cashPrice}</td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemFromDraft(idx)}
                                  className="text-red-500 hover:text-red-655 p-1 hover:bg-red-50 dark:hover:bg-red-955/20 rounded transition-colors cursor-pointer"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl py-6 px-4 text-center text-brand-muted dark:text-zinc-455 font-bold italic bg-gray-50/20">
                    Selecione aparelhos no painel acima para incluir na encomenda.
                  </div>
                )}
              </div>

              {/* Part 4: Trade-in Device (Permuta) */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 font-black text-[10px] text-brand-primary uppercase tracking-wide cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={clientForm.hasTrade}
                    onChange={(e) => setClientForm(prev => ({ ...prev, hasTrade: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 dark:border-zinc-700 text-brand-primary"
                  />
                  🔄 Adicionar Aparelho como Parte de Pagamento (Permuta)
                </label>

                {clientForm.hasTrade && (
                  <div className="bg-gray-50/50 dark:bg-zinc-800/20 border border-gray-150 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-inner">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Marca / Fabricante</label>
                        <input
                          type="text"
                          value={clientForm.tradeBrand}
                          onChange={(e) => handleClientFormChange('tradeBrand', e.target.value)}
                          className="w-full text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Modelo do Aparelho *</label>
                        <input
                          type="text"
                          placeholder="Ex: iPhone 15 Pro Max"
                          value={clientForm.tradeModel}
                          onChange={(e) => handleClientFormChange('tradeModel', e.target.value)}
                          className="w-full text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Cor e Capacidade</label>
                        <input
                          type="text"
                          placeholder="Ex: Titânio Natural / 256GB"
                          value={clientForm.tradeColor}
                          onChange={(e) => handleClientFormChange('tradeColor', e.target.value)}
                          className="w-full text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Nº de Série / IMEI *</label>
                        <input
                          type="text"
                          placeholder="Ex: 354859654124587"
                          value={clientForm.tradeIMEI}
                          onChange={(e) => handleClientFormChange('tradeIMEI', e.target.value)}
                          className="w-full text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Estado de Conservação</label>
                        <select
                          value={clientForm.tradeCondition}
                          onChange={(e) => setClientForm(prev => ({ ...prev, tradeCondition: e.target.value as any }))}
                          className="w-full text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-2.5 py-2.5 text-brand-secondary dark:text-white focus:outline-none cursor-pointer"
                        >
                          <option value="new">Novo (Na caixa lacrado)</option>
                          <option value="seminew">Seminovo (Estado de novo)</option>
                          <option value="good">Bom (Riscos leves)</option>
                          <option value="regular">Regular (Riscos e pequenos amassados)</option>
                          <option value="defective">Com defeito / Tela Quebrada</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Valor de Avaliação (Abate) *</label>
                        <input
                          type="text"
                          placeholder="R$ 0,00"
                          value={clientForm.tradeValue}
                          onChange={(e) => handleClientFormChange('tradeValue', e.target.value)}
                          className="w-full text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Descrição de Defeitos / Detalhes de Avarias</label>
                        <input
                          type="text"
                          placeholder="Ex: Trincado leve na quina superior esquerda, saúde bateria 85%"
                          value={clientForm.tradeDescription}
                          onChange={(e) => handleClientFormChange('tradeDescription', e.target.value)}
                          className="w-full text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Foto do Aparelho (Permuta)</label>
                        <div className="flex items-center gap-2">
                          <label className="py-2.5 px-4 bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all">
                            <Upload className="w-4 h-4 text-brand-primary" />
                            <span>Selecionar Foto</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleFileUpload(e, 'trade')} 
                              className="hidden" 
                            />
                          </label>
                          {tradePhoto ? (
                            <span className="text-green-500 font-bold flex items-center gap-1"><Check className="w-4 h-4" /> Foto Carregada</span>
                          ) : (
                            <span className="text-brand-muted text-[10px]">Nenhuma foto selecionada</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Part 5: Payment Method & Fiado */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-brand-primary tracking-wider">4. Forma de Pagamento</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {['pix', 'card', 'fiado'].map((method) => {
                    const isSelected = clientForm.paymentMethod === method;
                    const labels: Record<string, string> = { pix: 'À Vista (PIX)', card: 'Cartão de Crédito', fiado: 'A Prazo / Fiado' };
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setClientForm(prev => ({ ...prev, paymentMethod: method as any }))}
                        className={`p-3.5 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' 
                            : 'border-gray-200 hover:bg-gray-50/50 dark:border-zinc-850 dark:hover:bg-zinc-800/20 text-brand-secondary dark:text-white'
                        }`}
                      >
                        {labels[method]}
                      </button>
                    );
                  })}
                </div>

                {/* Fiado configuration fields */}
                {clientForm.paymentMethod === 'fiado' && (
                  <div className="bg-gray-50/50 dark:bg-zinc-800/20 border border-gray-150 dark:border-zinc-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-inner">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Valor de Entrada (PIX/Dinheiro)</label>
                      <input
                        type="text"
                        value={clientForm.fiadoDownPayment}
                        onChange={(e) => handleClientFormChange('fiadoDownPayment', e.target.value)}
                        className="w-full text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 font-mono focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Número de Parcelas Fiado</label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={clientForm.fiadoInstallmentsCount}
                        onChange={(e) => setClientForm(prev => ({ ...prev, fiadoInstallmentsCount: Math.max(1, parseInt(e.target.value) || 1) }))}
                        className="w-full text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Part 6: Upload RG and Documents */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-brand-primary tracking-wider">5. Documentos do Cliente (RG / CPF)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* RG Frente */}
                  <div className="premium-card p-4 flex flex-col items-center justify-center text-center space-y-2.5 bg-gray-50/20">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-brand-muted dark:text-zinc-400">RG Frente</span>
                    <label className="py-2 px-3.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0">
                      <Upload className="w-3.5 h-3.5 text-brand-primary" />
                      <span>Upload Frente</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'rgFront')} className="hidden" />
                    </label>
                    {rgFront ? (
                      <div className="w-20 h-12 border border-gray-200/50 dark:border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                        <img src={rgFront} alt="RG Frente Preview" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="text-[9px] text-brand-muted italic">RG Frente pendente</div>
                    )}
                  </div>

                  {/* RG Verso */}
                  <div className="premium-card p-4 flex flex-col items-center justify-center text-center space-y-2.5 bg-gray-50/20">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-brand-muted dark:text-zinc-400">RG Verso</span>
                    <label className="py-2 px-3.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0">
                      <Upload className="w-3.5 h-3.5 text-brand-primary" />
                      <span>Upload Verso</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'rgBack')} className="hidden" />
                    </label>
                    {rgBack ? (
                      <div className="w-20 h-12 border border-gray-200/50 dark:border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                        <img src={rgBack} alt="RG Verso Preview" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="text-[9px] text-brand-muted italic">RG Verso pendente</div>
                    )}
                  </div>

                  {/* Residência */}
                  <div className="premium-card p-4 flex flex-col items-center justify-center text-center space-y-2.5 bg-gray-50/20">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-brand-muted dark:text-zinc-400">Comprovante Residência</span>
                    <label className="py-2 px-3.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0">
                      <Upload className="w-3.5 h-3.5 text-brand-primary" />
                      <span>Upload Residência</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'proof')} className="hidden" />
                    </label>
                    {addressProof ? (
                      <div className="w-20 h-12 border border-gray-200/50 dark:border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                        <img src={addressProof} alt="Residência Preview" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="text-[9px] text-brand-muted italic">Comprovante pendente</div>
                    )}
                  </div>

                </div>
              </div>

              {/* Error messages display */}
              {(errors.name || errors.cpf || errors.phone || errors.address || errors.items) && (
                <div className="bg-red-50 dark:bg-red-955/20 border border-red-150 dark:border-red-900/40 p-4 rounded-2xl text-[11px] text-red-600 dark:text-red-400 space-y-1 font-bold">
                  <span className="uppercase text-[9px] block font-black">Preencha os campos obrigatórios:</span>
                  {errors.name && <p>• {errors.name}</p>}
                  {errors.cpf && <p>• {errors.cpf}</p>}
                  {errors.phone && <p>• {errors.phone}</p>}
                  {errors.address && <p>• {errors.address}</p>}
                  {errors.items && <p>• {errors.items}</p>}
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="border-t border-gray-150 dark:border-zinc-800 pt-4 mt-5 flex-shrink-0 flex items-center justify-between gap-4">
              <div className="text-xs">
                {draftItems.length > 0 && (
                  <div>
                    <span className="text-brand-muted dark:text-zinc-450 uppercase block font-bold text-[9px] tracking-wide">Valor do Contrato PIX:</span>
                    <span className="font-mono font-black text-brand-primary text-lg leading-tight">{getDraftTotals().cash}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="py-3 px-5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-brand-secondary dark:text-zinc-350 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateDraftContract}
                  disabled={draftItems.length === 0}
                  className={`py-3 px-6 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                    draftItems.length === 0 
                      ? 'bg-gray-300 dark:bg-zinc-850 text-gray-500 dark:text-zinc-550 cursor-not-allowed shadow-none' 
                      : 'bg-brand-primary hover:bg-blue-600'
                  }`}
                >
                  Salvar e Gerar Link
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* GENERATED SIGNATURE LINK DIALOG */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 flex flex-col border border-gray-150 dark:border-zinc-800 animate-slide-in">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/20 text-brand-primary flex items-center justify-center shadow-inner">
                <ExternalLink className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-base font-black text-brand-secondary dark:text-white uppercase tracking-wider font-sans">Link de Assinatura Criado!</h3>
              <p className="text-xs text-brand-muted dark:text-zinc-400 leading-relaxed">
                Envie o link do contrato para **{generatedLinkInfo.clientName}** assinar digitalmente de forma simples.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={generatedLinkInfo.link}
                  className="flex-grow text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-205 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-brand-muted font-mono focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="py-2.5 px-3 bg-brand-secondary dark:bg-zinc-800 hover:bg-zinc-950 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 border border-brand-secondary dark:border-zinc-700"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-955/10 border border-blue-100 dark:border-blue-900/30 p-3.5 rounded-2xl text-[11px] text-blue-900 dark:text-blue-300 leading-relaxed font-sans">
                <strong>Status:</strong> Aguardando Assinatura. O contrato ficará salvo na aba "Contratos" e mudará para "Assinado" automaticamente após o cliente assinar.
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button 
                onClick={() => setShowLinkModal(false)}
                className="w-1/3 py-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-brand-secondary dark:text-zinc-350 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Fechar
              </button>
              <button 
                onClick={handleSendLinkWhatsApp}
                className="w-2/3 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/15 transition-all cursor-pointer"
              >
                Enviar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
