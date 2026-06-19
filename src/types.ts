export interface ColorOption {
  name: string;
  hex: string;
  img: string;
}

export interface Product {
  category: string;
  model: string;
  storage: string;
  cashPrice: string;
  installmentPrice: string;
  selectedColorIdx: number;
  colors: ColorOption[];
}

export interface SectionMetadata {
  id: string;
  title: string;
  icon: string;
  modelHeader: string;
}

export interface CartItem {
  id: string; // unique combination: model + storage + colorName
  model: string;
  category: string;
  storage: string;
  colorName: string;
  colorHex: string;
  img: string;
  cashPrice: string;
  installmentPrice: string;
  quantity: number;
}

export interface Installment {
  id: string; // e.g. "P1", "P2"
  dueDate: string; // ISO String (date only YYYY-MM-DD)
  value: string; // formatted price
  status: 'pending' | 'paid' | 'overdue';
  paidValue?: string; // total amount paid so far
  paymentDate?: string; // payment confirmation date
  payments?: { date: string; value: string }[]; // payment details history
  method?: string; // e.g. "PIX", "Cartão", "A Prazo"
}

export interface TradeDevice {
  brand: string;
  model: string;
  color: string;
  storage: string;
  imei: string;
  condition: 'new' | 'seminew' | 'good' | 'regular' | 'defective';
  description?: string;
  evaluatedValue: string;
  photo?: string; // Base64 compressed image
}

export interface ClientDocuments {
  rgFront?: string; // Base64
  rgBack?: string; // Base64
  cpfDoc?: string; // Base64
  addressProof?: string; // Base64
}

export interface Contract {
  id: string;
  clientName: string;
  clientCPF: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress: string;
  items: CartItem[];
  cashTotal: string;
  installmentTotal: string;
  signature: string; // Base64 PNG signature image
  date: string; // ISO string creation date
  status: 'pending' | 'signed' | 'approved' | 'delivered' | 'cancelled' | 'active' | 'expired' | 'overdue' | 'completed';
  observations?: string;

  // Expanded fields
  startDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  paymentMethod: 'pix' | 'card' | 'fiado' | 'custom';
  
  // Trade-in details
  hasTrade?: boolean;
  tradeDevice?: TradeDevice;
  
  // Fiado installments details
  installments?: Installment[];
  fiadoDownPayment?: string;
  
  // Client Documents
  documents?: ClientDocuments;
}
