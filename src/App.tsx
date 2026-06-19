import { useState, useEffect, useRef, type SVGProps } from 'react';
import { 
  Settings, RotateCcw, Share2, Eye, Unlock, Phone, 
  LayoutGrid, List, Search, PlusCircle, Trash2, Image as ImageIcon, 
  Info, CheckCircle, X, Plus, Laptop, Tablet, Plug, 
  Smartphone, ShieldCheck, Lock, CreditCard, QrCode, Percent, Building,
  Watch, Monitor, ShoppingCart, Minus, LogOut, Download, Upload, ArrowLeft
} from 'lucide-react';
import type { Product, ColorOption, CartItem, Contract } from './types';
import ContractSigningFlow from './components/ContractSigningFlow';
import AdminContractsTab from './components/AdminContractsTab';
import { DEFAULT_PRODUCTS, SECTIONS_METADATA } from './constants';
import productsData from './products-data.json';
import { 
  fetchContracts, 
  saveAllContractsToSupabase, 
  deleteContractFromSupabase,
  fetchStoreConfig,
  saveStoreConfig 
} from './supabaseClient';

const typedSettingsData: Record<string, any> = {
  storeName: "ALCANCE IMPORTS",
  storeWhatsApp: "5568999027454",
  storeInstagram: "@alcance.imports",
  storeWebsite: "www.alcanceimports.com",
  adminPIN: "908077",
  cardTaxBase: 2.5,
  cardTaxMonthly: 1.2
};

const Instagram = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const loadInitialProducts = (): Product[] => {
  const hash = window.location.hash;
  if (hash && hash.startsWith("#data=")) {
    try {
      const base64Data = hash.substring(6);
      const decodedJson = decodeURIComponent(escape(atob(base64Data)));
      const parsedProducts = JSON.parse(decodedJson);
      if (Array.isArray(parsedProducts)) {
        return parsedProducts;
      }
    } catch (e) {
      console.error("Erro ao descriptografar catálogo compartilhado:", e);
    }
  }

  const stored = localStorage.getItem("alcance_imports_pricing_interactive_colors");
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Product[];
      let updated = false;

      DEFAULT_PRODUCTS.forEach(defProd => {
        const existing = parsed.find(
          p => p.category === defProd.category && 
               p.model === defProd.model && 
               p.storage === defProd.storage
        );
        if (!existing) {
          parsed.push({
            ...defProd,
            colors: defProd.colors.map(c => ({ ...c }))
          });
          updated = true;
        } else {
          if (existing.colors && existing.colors.length === 1 && existing.colors[0].name === "Estilo M5") {
            existing.colors = defProd.colors.map(c => ({ ...c }));
            existing.selectedColorIdx = 0;
            updated = true;
          } else if (existing.category === "macbookneo" && existing.colors && existing.colors.length === 2 && existing.colors[0].name === "Cinza Espacial") {
            existing.colors = defProd.colors.map(c => ({ ...c }));
            existing.selectedColorIdx = 0;
            updated = true;
          } else {
            defProd.colors.forEach((defColor, cIdx) => {
              if (existing.colors && existing.colors[cIdx]) {
                const currentImg = existing.colors[cIdx].img;
                const newImg = defColor.img;
                if (!currentImg || 
                    currentImg.includes("store.storeimages.apple.com") || 
                    currentImg.includes("-202403") || 
                    currentImg.includes("-202310") || 
                    (existing.category === "macbookair" && !currentImg.includes("202402") && !currentImg.includes("mlstatic"))) {
                  if (currentImg !== newImg) {
                    existing.colors[cIdx].img = newImg;
                    updated = true;
                  }
                }
              }
            });
          }
        }
      });

      if (updated) {
        localStorage.setItem("alcance_imports_pricing_interactive_colors", JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      console.error("Erro ao carregar dados do LocalStorage", e);
    }
  }

  if (Array.isArray(productsData) && productsData.length > 0) {
    return productsData as Product[];
  }

  return DEFAULT_PRODUCTS;
};

// Formatting helpers
const parsePrice = (priceStr: string): number => {
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

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => loadInitialProducts());
  const [currentView, setCurrentView] = useState<'client' | 'admin-login' | 'admin'>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('adm') === 'true' || params.get('admin') === 'true') ? 'admin-login' : 'client';
  });
  const [adminTab, setAdminTab] = useState<'products' | 'bulk-adjust' | 'settings' | 'contracts'>('products');
  
  const isInitialProductsLoad = useRef(true);
  const isInitialSettingsLoad = useRef(true);

  // Settings values (stored in LocalStorage or fall back to backend config)
  const [storeName, setStoreName] = useState(() => localStorage.getItem("alcance_imports_store_name") || typedSettingsData.storeName || "ALCANCE IMPORTS");
  const [storeWhatsApp, setStoreWhatsApp] = useState(() => localStorage.getItem("alcance_imports_store_whatsapp") || typedSettingsData.storeWhatsApp || "5568999027454");
  const [storeInstagram, setStoreInstagram] = useState(() => localStorage.getItem("alcance_imports_store_instagram") || typedSettingsData.storeInstagram || "@alcance.imports");
  const [storeWebsite, setStoreWebsite] = useState(() => localStorage.getItem("alcance_imports_store_website") || typedSettingsData.storeWebsite || "www.alcanceimports.com");
  const [adminPIN, setAdminPIN] = useState(() => localStorage.getItem("alcance_imports_admin_pin") || typedSettingsData.adminPIN || "908077");
  
  // Credit card installment rates
  const [cardTaxBase, setCardTaxBase] = useState(() => parseFloat(localStorage.getItem("alcance_imports_card_tax_base") || String(typedSettingsData.cardTaxBase || 2.5)));
  const [cardTaxMonthly, setCardTaxMonthly] = useState(() => parseFloat(localStorage.getItem("alcance_imports_card_tax_monthly") || String(typedSettingsData.cardTaxMonthly || 1.2)));

  // Dark Mode state removed (always false)
  const darkMode = false;

  // Navigation & Search
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Admin access control states
  const [showAdminBtn] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('adm') === 'true' || params.get('admin') === 'true';
  });
  
  // Passcode authentication state
  const [enteredPIN, setEnteredPIN] = useState("");
  const [pinError, setPinError] = useState(false);

  // Shopping Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem("alcance_imports_cart");
    return stored ? JSON.parse(stored) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartBouncing, setCartBouncing] = useState(false);
  const [showCopyOverlay, setShowCopyOverlay] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState("");

  // Product simulator state
  const [simulatingProduct, setSimulatingProduct] = useState<Product | null>(null);

  // Admin CRUD states
  const [newProduct, setNewProduct] = useState({
    category: "iphones",
    model: "",
    storage: "128GB",
    cashPrice: "R$ 0,00",
    installmentPrice: "R$ 0,00",
  });
  
  // Bulk Adjust Price state
  const [bulkCategory, setBulkCategory] = useState("all");
  const [bulkPercentage, setBulkPercentage] = useState(0);

  // Color Editor Modal State
  const [editingProductIdx, setEditingProductIdx] = useState<number | null>(null);
  const [modalColors, setModalColors] = useState<ColorOption[]>([]);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#FFFFFF");
  const [newColorImg, setNewColorImg] = useState("");

  // Contract States
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isContractFlowOpen, setIsContractFlowOpen] = useState(false);

  // Load contracts, products, and settings from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      // 1. Load contracts
      try {
        const data = await fetchContracts();
        setContracts(data);
        localStorage.setItem("alcance_imports_contracts", JSON.stringify(data));
      } catch (e) {
        console.warn("Falha ao buscar contratos do Supabase:", e);
        const stored = localStorage.getItem("alcance_imports_contracts");
        if (stored) {
          try {
            setContracts(JSON.parse(stored));
          } catch (err) {
            console.error("Erro ao carregar contratos do LocalStorage:", err);
          }
        }
      }

      // 2. Load products
      try {
        const dbProds = await fetchStoreConfig<Product[]>('products', []);
        if (dbProds && dbProds.length > 0) {
          setProducts(dbProds);
          localStorage.setItem("alcance_imports_pricing_interactive_colors", JSON.stringify(dbProds));
        }
      } catch (e) {
        console.warn("Falha ao buscar produtos do Supabase:", e);
      } finally {
        setTimeout(() => {
          isInitialProductsLoad.current = false;
        }, 100);
      }

      // 3. Load settings
      try {
        const fallbackSettings = {
          storeName: typedSettingsData.storeName || "ALCANCE IMPORTS",
          storeWhatsApp: typedSettingsData.storeWhatsApp || "5568999027454",
          storeInstagram: typedSettingsData.storeInstagram || "@alcance.imports",
          storeWebsite: typedSettingsData.storeWebsite || "www.alcanceimports.com",
          adminPIN: typedSettingsData.adminPIN || "908077",
          cardTaxBase: typedSettingsData.cardTaxBase || 2.5,
          cardTaxMonthly: typedSettingsData.cardTaxMonthly || 1.2
        };
        const dbSettings = await fetchStoreConfig('settings', fallbackSettings);
        if (dbSettings) {
          setStoreName(dbSettings.storeName || fallbackSettings.storeName);
          setStoreWhatsApp(dbSettings.storeWhatsApp || fallbackSettings.storeWhatsApp);
          setStoreInstagram(dbSettings.storeInstagram || fallbackSettings.storeInstagram);
          setStoreWebsite(dbSettings.storeWebsite || fallbackSettings.storeWebsite);
          setAdminPIN(dbSettings.adminPIN || fallbackSettings.adminPIN);
          setCardTaxBase(dbSettings.cardTaxBase ?? fallbackSettings.cardTaxBase);
          setCardTaxMonthly(dbSettings.cardTaxMonthly ?? fallbackSettings.cardTaxMonthly);

          localStorage.setItem("alcance_imports_store_name", dbSettings.storeName);
          localStorage.setItem("alcance_imports_store_whatsapp", dbSettings.storeWhatsApp);
          localStorage.setItem("alcance_imports_store_instagram", dbSettings.storeInstagram);
          localStorage.setItem("alcance_imports_store_website", dbSettings.storeWebsite);
          localStorage.setItem("alcance_imports_admin_pin", dbSettings.adminPIN);
          localStorage.setItem("alcance_imports_card_tax_base", String(dbSettings.cardTaxBase));
          localStorage.setItem("alcance_imports_card_tax_monthly", String(dbSettings.cardTaxMonthly));
        }
      } catch (e) {
        console.warn("Falha ao buscar configurações do Supabase:", e);
      } finally {
        setTimeout(() => {
          isInitialSettingsLoad.current = false;
        }, 100);
      }
    };
    loadData();
  }, []);

  const handleUpdateContracts = async (updatedList: Contract[]) => {
    const deletedContracts = contracts.filter(c => !updatedList.some(ul => ul.id === c.id));
    setContracts(updatedList);
    localStorage.setItem("alcance_imports_contracts", JSON.stringify(updatedList));
    try {
      await saveAllContractsToSupabase(updatedList);
      for (const c of deletedContracts) {
        await deleteContractFromSupabase(c.id);
      }
    } catch (e) {
      console.warn("Falha ao salvar contratos no Supabase:", e);
    }
  };

  // Active contract signing route via URL Hash (#sign-contract=CTR-XXXXXX)
  const [activeSignContract, setActiveSignContract] = useState<Contract | null>(null);

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#sign-contract=")) {
        const contractId = hash.split("=")[1];
        const found = contracts.find(c => c.id === contractId);
        if (found) {
          setActiveSignContract(found);
        } else {
          // Fetch directly from server if not in loaded list yet
          fetchContracts()
            .then(data => {
              if (Array.isArray(data)) {
                const c = data.find((item: Contract) => item.id === contractId);
                if (c) setActiveSignContract(c);
              }
            }).catch(err => console.warn("Erro ao buscar contrato por hash no Supabase:", err));
        }
      } else {
        setActiveSignContract(null);
      }
    };

    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, [contracts]);

  const handleContractSigned = (newContract: Contract) => {
    const exists = contracts.some(c => c.id === newContract.id);
    const updatedList = exists 
      ? contracts.map(c => c.id === newContract.id ? newContract : c)
      : [...contracts, newContract];
      
    handleUpdateContracts(updatedList);
    setCart([]); // Esvaziar carrinho após assinar contrato
  };

  // Sync state to local storage when products change and push to backend
  useEffect(() => {
    localStorage.setItem("alcance_imports_pricing_interactive_colors", JSON.stringify(products));
    
    if (isInitialProductsLoad.current) {
      return;
    }
    
    // Save to Supabase
    saveStoreConfig('products', products).catch(err => console.warn("Erro ao salvar produtos no Supabase:", err));
  }, [products]);

  // Ensure dark mode classes are removed from body and HTML
  useEffect(() => {
    document.body.classList.remove("dark");
    document.documentElement.classList.remove("dark");
    localStorage.removeItem("alcance_imports_dark_mode");
  }, []);

  // Sync settings values and push to backend
  useEffect(() => {
    localStorage.setItem("alcance_imports_store_name", storeName);
    localStorage.setItem("alcance_imports_store_whatsapp", storeWhatsApp);
    localStorage.setItem("alcance_imports_store_instagram", storeInstagram);
    localStorage.setItem("alcance_imports_store_website", storeWebsite);
    localStorage.setItem("alcance_imports_admin_pin", adminPIN);
    localStorage.setItem("alcance_imports_card_tax_base", String(cardTaxBase));
    localStorage.setItem("alcance_imports_card_tax_monthly", String(cardTaxMonthly));

    if (isInitialSettingsLoad.current) {
      return;
    }

    saveStoreConfig('settings', {
      storeName,
      storeWhatsApp,
      storeInstagram,
      storeWebsite,
      adminPIN,
      cardTaxBase,
      cardTaxMonthly
    }).catch(err => console.warn("Erro ao salvar configurações no Supabase:", err));
  }, [storeName, storeWhatsApp, storeInstagram, storeWebsite, adminPIN, cardTaxBase, cardTaxMonthly]);

  // Sync cart state to local storage
  useEffect(() => {
    localStorage.setItem("alcance_imports_cart", JSON.stringify(cart));
  }, [cart]);

  // Check URL Hash for shared data
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#data=")) {
        setProducts(loadInitialProducts());
        setCurrentView('client');
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleImageUpload = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 300; // max size in px
        
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
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          callback(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePinInput = (num: string) => {
    const pinLength = adminPIN.length || 6;
    if (enteredPIN.length < pinLength) {
      const nextPIN = enteredPIN + num;
      setEnteredPIN(nextPIN);
      
      if (nextPIN.length === pinLength) {
        if (nextPIN === adminPIN) {
          setTimeout(() => {
            setCurrentView('admin');
            setEnteredPIN("");
            setPinError(false);
            triggerToast("Acesso administrativo liberado!");
          }, 300);
        } else {
          setTimeout(() => {
            setPinError(true);
            setEnteredPIN("");
            setTimeout(() => setPinError(false), 500);
          }, 300);
        }
      }
    }
  };

  const deletePinDigit = () => {
    setEnteredPIN(prev => prev.slice(0, -1));
  };

  const clearPin = () => {
    setEnteredPIN("");
  };

  // Cart operations
  const addToCart = (product: Product) => {
    const color = product.colors[product.selectedColorIdx] || { name: "Padrão", hex: "#FFFFFF", img: "" };
    const cartItemId = `${product.model}-${product.storage}-${color.name}`;
    
    // Trigger bounce micro-animation
    setCartBouncing(true);
    setTimeout(() => setCartBouncing(false), 600);

    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      if (existing) {
        triggerToast(`${product.model} adicionado ao orçamento!`);
        return prev.map(item => 
          item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      triggerToast(`${product.model} adicionado ao orçamento!`);
      return [...prev, {
        id: cartItemId,
        model: product.model,
        category: product.category,
        storage: product.storage,
        colorName: color.name,
        colorHex: color.hex,
        img: color.img || "https://store.storeimages.apple.com/4982/as-images.apple.com/is/MHXH3?wid=150&hei=150&fmt=jpeg",
        cashPrice: product.cashPrice,
        installmentPrice: product.installmentPrice,
        quantity: 1
      }];
    });
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
    triggerToast("Item removido do orçamento.");
  };

  const getCartTotals = () => {
    let cashTotal = 0;
    let installmentTotal = 0;
    cart.forEach(item => {
      cashTotal += parsePrice(item.cashPrice) * item.quantity;
      installmentTotal += parsePrice(item.installmentPrice) * item.quantity;
    });
    return {
      cash: formatPrice(cashTotal),
      installment: formatPrice(installmentTotal),
      count: cart.reduce((acc, curr) => acc + curr.quantity, 0)
    };
  };

  // Helper for computing totals on arbitrary item lists
  const getItemsTotals = (items: CartItem[]) => {
    let cashTotal = 0;
    let installmentTotal = 0;
    items.forEach(item => {
      cashTotal += parsePrice(item.cashPrice) * item.quantity;
      installmentTotal += parsePrice(item.installmentPrice) * item.quantity;
    });
    return {
      cash: formatPrice(cashTotal),
      installment: formatPrice(installmentTotal),
      count: items.reduce((acc, curr) => acc + curr.quantity, 0)
    };
  };

  const sendCartToWhatsApp = () => {
    if (cart.length === 0) return;
    const url = getCartWhatsAppUrl();
    window.open(url, '_blank');
  };

  const getCartWhatsAppUrl = () => {
    let message = `*Olá ${storeName}! Gostaria de solicitar um orçamento para os seguintes itens:*\n\n`;
    
    const categoriesMap: Record<string, string> = {
      "iphones": "📱 iPhones",
      "watches": "⌚ Apple Watches",
      "macmini": "💻 Mac Mini",
      "macbookair": "💻 MacBook Air",
      "macbookneo": "💻 MacBook Neo",
      "macbookpro": "💻 MacBook Pro",
      "ipads": "📟 iPads",
      "accessories": "🔌 Acessórios"
    };

    Object.keys(categoriesMap).forEach(catKey => {
      const items = cart.filter(item => item.category === catKey);
      if (items.length > 0) {
        message += `*${categoriesMap[catKey]}*\n`;
        items.forEach(item => {
          message += `- ${item.quantity}x ${item.model} (${item.storage})\n  Cor: ${item.colorName} | PIX: ${item.cashPrice} un.\n`;
        });
        message += "\n";
      }
    });

    const totals = getCartTotals();
    message += `------------------------------------\n`;
    message += `*Total à Vista (PIX):* ${totals.cash}\n`;
    message += `*Total Parcelado:* ${totals.installment} (ou até 12x c/ juros)\n\n`;
    message += `_Enviei também a imagem do orçamento anexa (copiada para o seu clipboard, basta colar)._\n\n`;
    message += `Aguardando confirmação e contrato de encomenda. Obrigado!`;
    
    return `https://wa.me/${storeWhatsApp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
  };

  // Canvas visual receipt generator
  const generateVisualReceipt = async (items: CartItem[], skipImages = false): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      // Proportions
      const width = 500;
      const headerHeight = 130;
      const footerHeight = 170;
      const itemHeight = 85;
      const height = headerHeight + footerHeight + (items.length * itemHeight);
      
      canvas.width = width;
      canvas.height = height;

      // Draw Background
      ctx.fillStyle = darkMode ? "#16161A" : "#FFFFFF";
      ctx.fillRect(0, 0, width, height);

      // Card border
      ctx.strokeStyle = darkMode ? "#2D2D34" : "#E4E4E7";
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, width - 12, height - 12);

      // Draw Header Logo / Title
      ctx.fillStyle = darkMode ? "#0A84FF" : "#00284f";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(storeName, width / 2, 45);

      ctx.fillStyle = darkMode ? "#A1A1AA" : "#8E8E93";
      ctx.font = "900 9px sans-serif";
      ctx.fillText("RECIBO DE SOLICITAÇÃO DE ORÇAMENTO", width / 2, 65);

      // Dash line under header
      ctx.strokeStyle = darkMode ? "#2D2D34" : "#E4E4E7";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(15, 80);
      ctx.lineTo(width - 15, 80);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Load and draw items sequentially
      let currentY = 95;
      
      const drawItem = async (item: CartItem, y: number) => {
        // Draw background pill for item
        ctx.fillStyle = darkMode ? "#1F1F24" : "#F8F8FA";
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(20, y, width - 40, itemHeight - 12, 10);
        } else {
          ctx.rect(20, y, width - 40, itemHeight - 12);
        }
        ctx.fill();

        // Draw image or placeholder
        const imgSize = 50;
        const imgX = 35;
        const imgY = y + 12;

        if (skipImages) {
          ctx.fillStyle = darkMode ? "#2D2D34" : "#E4E4E7";
          ctx.fillRect(imgX, imgY, imgSize, imgSize);
          ctx.fillStyle = "#A1A1AA";
          ctx.font = "9px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("Sem Foto", imgX + imgSize/2, imgY + imgSize/2 + 3);
        } else {
          try {
            if (item.img) {
              const img = new Image();
              if (item.img.startsWith('http') || item.img.startsWith('//')) {
                img.crossOrigin = "anonymous";
              }
              await new Promise((imgResolve) => {
                img.onload = () => {
                  ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
                  imgResolve(true);
                };
                img.onerror = () => {
                  ctx.fillStyle = darkMode ? "#2D2D34" : "#E4E4E7";
                  ctx.fillRect(imgX, imgY, imgSize, imgSize);
                  ctx.fillStyle = "#A1A1AA";
                  ctx.font = "9px sans-serif";
                  ctx.textAlign = "center";
                  ctx.fillText("Sem Foto", imgX + imgSize/2, imgY + imgSize/2 + 3);
                  imgResolve(false);
                };
                img.src = item.img;
              });
            } else {
              ctx.fillStyle = darkMode ? "#2D2D34" : "#E4E4E7";
              ctx.fillRect(imgX, imgY, imgSize, imgSize);
            }
          } catch (e) {
            console.error("Erro ao desenhar imagem no canvas", e);
            ctx.fillStyle = darkMode ? "#2D2D34" : "#E4E4E7";
            ctx.fillRect(imgX, imgY, imgSize, imgSize);
          }
        }

        // Draw Texts
        ctx.textAlign = "left";
        ctx.fillStyle = darkMode ? "#FFFFFF" : "#111111";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(item.model, 100, y + 25);

        ctx.fillStyle = darkMode ? "#A1A1AA" : "#71717A";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText(`${item.storage} | Cor: ${item.colorName}`, 100, y + 42);

        ctx.fillStyle = "#0A84FF";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(`${item.quantity}x ${item.cashPrice} un.`, 100, y + 58);
      };

      const processItems = async () => {
        for (const item of items) {
          await drawItem(item, currentY);
          currentY += itemHeight;
        }

        // Dash line under items
        ctx.strokeStyle = darkMode ? "#2D2D34" : "#E4E4E7";
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(15, currentY + 5);
        ctx.lineTo(width - 15, currentY + 5);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash

        // Draw Totals
        const totals = getItemsTotals(items);
        const totalsY = currentY + 35;

        ctx.textAlign = "left";
        ctx.fillStyle = darkMode ? "#A1A1AA" : "#71717A";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("Total à Vista (PIX):", 25, totalsY);

        ctx.textAlign = "right";
        ctx.fillStyle = "#0A84FF";
        ctx.font = "black 18px sans-serif";
        ctx.fillText(totals.cash, width - 25, totalsY);

        ctx.textAlign = "left";
        ctx.fillStyle = darkMode ? "#A1A1AA" : "#71717A";
        ctx.font = "semibold 11px sans-serif";
        ctx.fillText("Total Parcelado:", 25, totalsY + 25);

        ctx.textAlign = "right";
        ctx.fillStyle = darkMode ? "#FFFFFF" : "#111111";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(`${totals.installment} (até 12x)`, width - 25, totalsY + 25);

        // Warranty info
        ctx.textAlign = "center";
        ctx.fillStyle = darkMode ? "#71717A" : "#8E8E93";
        ctx.font = "italic 9px sans-serif";
        ctx.fillText("Aparelhos Novos Sob Encomenda com Garantia 1 Ano Apple", width / 2, totalsY + 65);
        ctx.fillText("Comprovante gerado automaticamente.", width / 2, totalsY + 80);

        // Store Contact details
        const formattedPhone = storeWhatsApp.length === 13 
          ? `(${storeWhatsApp.substring(2, 4)}) ${storeWhatsApp.substring(4, 9)}-${storeWhatsApp.substring(9)}`
          : storeWhatsApp;

        ctx.fillStyle = darkMode ? "#0A84FF" : "#00284f";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText(`Contato: ${formattedPhone} | Insta: ${storeInstagram}`, width / 2, totalsY + 105);
        ctx.font = "9px sans-serif";
        ctx.fillStyle = darkMode ? "#71717A" : "#8E8E93";
        ctx.fillText(storeWebsite, width / 2, totalsY + 120);

        try {
          canvas.toBlob((blob) => {
            if (blob === null) {
              if (!skipImages) {
                console.warn("toBlob retornou null. Tentando novamente sem imagens...");
                generateVisualReceipt(items, true).then(resolve);
              } else {
                resolve(null);
              }
            } else {
              resolve(blob);
            }
          }, "image/png");
        } catch (toBlobError) {
          console.error("Erro ao converter canvas para blob (tainted):", toBlobError);
          if (!skipImages) {
            generateVisualReceipt(items, true).then(resolve);
          } else {
            resolve(null);
          }
        }
      };

      processItems();
    });
  };

  const copyReceiptToClipboardAndSend = async () => {
    const url = getCartWhatsAppUrl();
    setWhatsappLink(url);
    try {
      const blob = await generateVisualReceipt(cart);
      if (blob) {
        // Copy to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        // Open the guidance modal overlay
        setShowCopyOverlay(true);
        triggerToast("Comprovante copiado! Pronto para colar.");
      } else {
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error("Erro ao copiar comprovante:", err);
      // Fallback
      window.open(url, '_blank');
    }
  };

  const copySingleProductReceiptAndSend = async (product: Product) => {
    const color = product.colors[product.selectedColorIdx] || { name: "Padrão", hex: "#FFFFFF", img: "" };
    const singleCartItem: CartItem = {
      id: `${product.model}-${product.storage}-${color.name}`,
      model: product.model,
      category: product.category,
      storage: product.storage,
      colorName: color.name,
      colorHex: color.hex,
      img: color.img || "https://store.storeimages.apple.com/4982/as-images.apple.com/is/MHXH3?wid=150&hei=150&fmt=jpeg",
      cashPrice: product.cashPrice,
      installmentPrice: product.installmentPrice,
      quantity: 1
    };

    const activeColor = product.colors[product.selectedColorIdx] || { name: "Padrão" };
    let message = `Quero encomendar o *${product.model}* na cor *${activeColor.name}* com capacidade *${product.storage}* pelo preço à vista de *${product.cashPrice}*.\n\n`;
    message += `_Enviei também a imagem do orçamento anexa (copiada para o seu clipboard, basta colar)._`;
    const url = `https://wa.me/${storeWhatsApp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
    
    setWhatsappLink(url);
    
    try {
      const blob = await generateVisualReceipt([singleCartItem]);
      if (blob) {
        // Copy to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        // Open the guidance modal overlay
        setShowCopyOverlay(true);
        triggerToast("Comprovante do produto copiado!");
      } else {
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error("Erro ao copiar comprovante do produto:", err);
      window.open(url, '_blank');
    }
  };

  const calculateInstallment = (cashVal: number, months: number): { installmentValue: number; totalValue: number } => {
    if (months === 1) {
      const totalValue = cashVal * (1 + cardTaxBase / 100);
      return { installmentValue: totalValue, totalValue };
    }
    const totalValue = cashVal * (1 + cardTaxBase / 100) * Math.pow(1 + (cardTaxMonthly / 100), months);
    return {
      installmentValue: totalValue / months,
      totalValue
    };
  };

  const resetToDefaults = () => {
    if (window.confirm("Deseja restaurar a tabela de preços para todos os padrões com as fotos oficiais e seletores de cores interativos?")) {
      setProducts(DEFAULT_PRODUCTS.map(p => ({
        ...p,
        colors: p.colors.map(c => ({ ...c }))
      })));
      setStoreName("ALCANCE IMPORTS");
      setStoreWhatsApp("5568999027454");
      setStoreInstagram("@alcance.imports");
      setStoreWebsite("www.alcanceimports.com");
      setAdminPIN("1234");
      setCardTaxBase(2.5);
      setCardTaxMonthly(1.2);
      setCart([]);
      triggerToast("Catálogo inicial restaurado!");
    }
  };

  const generateShareLink = () => {
    try {
      const dataString = JSON.stringify(products);
      const base64Data = btoa(unescape(encodeURIComponent(dataString)));
      const shareUrl = `${window.location.origin}${window.location.pathname}#data=${base64Data}`;
      
      navigator.clipboard.writeText(shareUrl).then(() => {
        triggerToast("Link de orçamentos copiado! Compartilhe com o cliente.");
      }).catch(() => {
        const dummy = document.createElement("input");
        document.body.appendChild(dummy);
        dummy.value = shareUrl;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
        triggerToast("Link copiado!");
      });
    } catch (err) {
      console.error("Erro ao criar link", err);
      triggerToast("Erro ao gerar link de compartilhamento.");
    }
  };

  const updateProductValue = (index: number, field: keyof Product, value: string | number | ColorOption[]) => {
    setProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value } as Product;
      return updated;
    });
  };

  const changeProductColor = (index: number, colorIdx: number) => {
    setProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selectedColorIdx: colorIdx };
      return updated;
    });
  };

  // Add custom new product in Admin Panel
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.model.trim()) {
      alert("Por favor, preencha o modelo do produto.");
      return;
    }
    
    let defaultColors: ColorOption[] = [
      { name: "Cinza", hex: "#8E8E93", img: "https://store.storeimages.apple.com/4982/as-images.apple.com/is/MHXH3?wid=150&hei=150&fmt=jpeg" }
    ];
    if (newProduct.category === "iphones") {
      defaultColors = [
        { name: "Titânio Natural", hex: "#A1A19A", img: "fotos iphones/17 pro natural.png" },
        { name: "Titânio Deserto", hex: "#C2B29F", img: "fotos iphones/17 pro deserto.png" },
        { name: "Titânio Preto", hex: "#232322", img: "fotos iphones/17 pro preto.png" }
      ];
    } else if (newProduct.category.includes("macbook")) {
      defaultColors = [
        { name: "Cinza Espacial", hex: "#535455", img: "https://store.storeimages.apple.com/4982/as-images.apple.com/is/mba13-m3-spacegray-select-202403?wid=150&hei=150&fmt=jpeg" },
        { name: "Estelar", hex: "#F0E4D3", img: "https://store.storeimages.apple.com/4982/as-images.apple.com/is/mba13-m3-starlight-select-202403?wid=150&hei=150&fmt=jpeg" }
      ];
    }

    const createdProduct: Product = {
      category: newProduct.category,
      model: newProduct.model,
      storage: newProduct.storage,
      cashPrice: newProduct.cashPrice,
      installmentPrice: newProduct.installmentPrice,
      selectedColorIdx: 0,
      colors: defaultColors
    };

    setProducts(prev => [...prev, createdProduct]);
    setNewProduct({
      category: "iphones",
      model: "",
      storage: "128GB",
      cashPrice: "R$ 0,00",
      installmentPrice: "R$ 0,00",
    });
    triggerToast("Novo produto inserido com sucesso!");
  };

  const removeProductRow = (index: number) => {
    if (window.confirm("Deseja realmente remover este item do catálogo?")) {
      setProducts(prev => prev.filter((_, idx) => idx !== index));
      triggerToast("Item removido.");
    }
  };

  const handleBulkAdjust = () => {
    if (bulkPercentage === 0) return;
    if (window.confirm(`Deseja mesmo aplicar o ajuste de ${bulkPercentage}% nos preços selecionados?`)) {
      setProducts(prev => {
        return prev.map(p => {
          if (bulkCategory !== "all" && p.category !== bulkCategory) {
            return p;
          }
          const cashVal = parsePrice(p.cashPrice);
          const instVal = parsePrice(p.installmentPrice);
          
          const multiplier = 1 + (bulkPercentage / 100);
          
          return {
            ...p,
            cashPrice: formatPrice(cashVal * multiplier),
            installmentPrice: formatPrice(instVal * multiplier)
          };
        });
      });
      triggerToast(`Preços ajustados em ${bulkPercentage}% com sucesso!`);
      setBulkPercentage(0);
    }
  };

  // Export & Import backup catalog
  const exportCatalogJSON = () => {
    const dataObj = {
      storeName,
      storeWhatsApp,
      storeInstagram,
      storeWebsite,
      adminPIN,
      cardTaxBase,
      cardTaxMonthly,
      products
    };
    
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `catalogo-alcance-imports.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast("Backup do catálogo exportado!");
  };

  const importCatalogJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.products && Array.isArray(json.products)) {
          setProducts(json.products);
          if (json.storeName) setStoreName(json.storeName);
          if (json.storeWhatsApp) setStoreWhatsApp(json.storeWhatsApp);
          if (json.storeInstagram) setStoreInstagram(json.storeInstagram);
          if (json.storeWebsite) setStoreWebsite(json.storeWebsite);
          if (json.adminPIN) setAdminPIN(json.adminPIN);
          if (json.cardTaxBase) setCardTaxBase(parseFloat(json.cardTaxBase));
          if (json.cardTaxMonthly) setCardTaxMonthly(parseFloat(json.cardTaxMonthly));
          triggerToast("Catálogo e configurações importados com sucesso!");
        } else {
          alert("Arquivo JSON inválido. Verifique o formato.");
        }
      } catch (err) {
        console.error(err);
        alert("Erro ao ler o arquivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  // Modal Color operations
  const openColorEditor = (index: number) => {
    setEditingProductIdx(index);
    setModalColors([...products[index].colors]);
    setNewColorName("");
    setNewColorHex("#FFFFFF");
    setNewColorImg("");
  };

  const saveColors = () => {
    if (editingProductIdx !== null) {
      setProducts(prev => {
        const updated = [...prev];
        updated[editingProductIdx] = {
          ...updated[editingProductIdx],
          colors: modalColors,
          selectedColorIdx: Math.min(updated[editingProductIdx].selectedColorIdx, modalColors.length - 1)
        };
        return updated;
      });
      setEditingProductIdx(null);
      triggerToast("Cores atualizadas!");
    }
  };

  const addColorToModal = () => {
    if (!newColorName.trim()) {
      alert("Por favor, preencha o nome da cor.");
      return;
    }
    const newColor: ColorOption = {
      name: newColorName.trim(),
      hex: newColorHex,
      img: newColorImg.trim() || "https://store.storeimages.apple.com/4982/as-images.apple.com/is/MHXH3?wid=150&hei=150&fmt=jpeg"
    };
    setModalColors(prev => [...prev, newColor]);
    setNewColorName("");
    setNewColorHex("#FFFFFF");
    setNewColorImg("");
  };

  const removeColorFromModal = (colorIdx: number) => {
    if (modalColors.length <= 1) {
      alert("O produto precisa ter pelo menos uma cor.");
      return;
    }
    setModalColors(prev => prev.filter((_, idx) => idx !== colorIdx));
  };



  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'smartphone': return <Smartphone className="w-4 h-4 text-brand-primary" />;
      case 'laptop': return <Laptop className="w-4 h-4 text-brand-primary" />;
      case 'tablet': return <Tablet className="w-4 h-4 text-brand-primary" />;
      case 'plug': return <Plug className="w-4 h-4 text-brand-primary" />;
      case 'watch': return <Watch className="w-4 h-4 text-brand-primary" />;
      case 'monitor': return <Monitor className="w-4 h-4 text-brand-primary" />;
      default: return <Settings className="w-4 h-4 text-brand-primary" />;
    }
  };

  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) 
            ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-600/40 text-black dark:text-white font-extrabold rounded px-0.5 shadow-sm">{part}</mark>
            : part
        )}
      </span>
    );
  };

  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || p.model.toLowerCase().includes(query) || p.storage.toLowerCase().includes(query);
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const cartTotals = getCartTotals();

  // Rendering Views
  if (currentView === 'admin-login') {
    return (
      <div className="min-h-screen bg-brand-light dark:bg-[#0E0E10] flex items-center justify-center p-4 antialiased text-brand-secondary dark:text-[#F5F5F7] font-sans">
        <div className="bg-white dark:bg-[#16161A] rounded-3xl max-w-sm w-full p-8 shadow-2xl border border-gray-100 dark:border-zinc-800/80 flex flex-col items-center text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-brand-secondary dark:text-white">Acesso Restrito</h2>
            <p className="text-xs text-brand-muted dark:text-zinc-400 mt-1 leading-relaxed">Digite o PIN do administrador para gerenciar o catálogo de preços</p>
          </div>
          
          {/* PIN Indicators */}
          <div className="flex gap-4 justify-center py-2">
            {Array.from({ length: adminPIN.length || 6 }).map((_, idx) => (
              <div 
                key={idx} 
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 border-2 ${
                  enteredPIN.length > idx 
                    ? 'bg-brand-primary border-brand-primary scale-110' 
                    : 'bg-transparent border-gray-300 dark:border-zinc-700'
                } ${pinError ? 'bg-red-500 border-red-500 animate-pulse' : ''}`}
              />
            ))}
          </div>

          {pinError && (
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider animate-bounce">PIN Incorreto. Tente novamente!</span>
          )}

          {/* Passcode Keyboard Grid */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] pt-4 select-none">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button 
                key={num} 
                onClick={() => handlePinInput(num)}
                className="w-16 h-16 rounded-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/60 text-base font-black hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center active:scale-95 cursor-pointer text-gray-800 dark:text-white"
              >
                {num}
              </button>
            ))}
            <button 
              onClick={clearPin}
              className="text-xs text-brand-muted hover:text-brand-secondary dark:hover:text-white font-bold active:scale-95 transition-colors cursor-pointer flex items-center justify-center"
            >
              Limpar
            </button>
            <button 
              onClick={() => handlePinInput("0")}
              className="w-16 h-16 rounded-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/60 text-base font-black hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center active:scale-95 cursor-pointer text-gray-800 dark:text-white"
            >
              0
            </button>
            <button 
              onClick={deletePinDigit}
              className="text-xs text-brand-muted hover:text-brand-secondary dark:hover:text-white font-bold active:scale-95 transition-colors cursor-pointer flex items-center justify-center"
            >
              Voltar
            </button>
          </div>

          <button 
            onClick={() => { setCurrentView('client'); setEnteredPIN(""); }}
            className="w-full py-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold transition-all text-gray-700 dark:text-zinc-300 flex items-center justify-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para a Loja
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'admin') {
    const avgPrice = products.reduce((acc, curr) => acc + parsePrice(curr.cashPrice), 0) / (products.length || 1);
    const categoriesCount = new Set(products.map(p => p.category)).size;

    return (
      <div className="min-h-screen bg-brand-light dark:bg-[#0E0E10] flex flex-col antialiased text-brand-secondary dark:text-[#F5F5F7] font-sans">
        
        {/* Admin Navigation Header */}
        <header className="glass-nav sticky top-0 z-40 px-4 py-4 flex items-center justify-between border-b border-gray-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-md">
                <Settings className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight text-brand-secondary dark:text-white leading-none uppercase">Painel Administrativo</h1>
                <p className="text-[10px] text-brand-muted dark:text-zinc-400 mt-0.5">{storeName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={() => setAdminTab('products')} 
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${adminTab === 'products' ? 'bg-brand-secondary dark:bg-zinc-850 text-white' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-brand-muted hover:text-brand-secondary dark:hover:text-white'}`}
              >
                Gerenciar Catálogo
              </button>
              <button 
                onClick={() => setAdminTab('bulk-adjust')} 
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${adminTab === 'bulk-adjust' ? 'bg-brand-secondary dark:bg-zinc-850 text-white' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-brand-muted hover:text-brand-secondary dark:hover:text-white'}`}
              >
                Ajuste em Lote
              </button>
              <button 
                onClick={() => setAdminTab('settings')} 
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${adminTab === 'settings' ? 'bg-brand-secondary dark:bg-zinc-850 text-white' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-brand-muted hover:text-brand-secondary dark:hover:text-white'}`}
              >
                Configurações
              </button>
              <button 
                onClick={() => setAdminTab('contracts')} 
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${adminTab === 'contracts' ? 'bg-brand-secondary dark:bg-zinc-850 text-white' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-brand-muted hover:text-brand-secondary dark:hover:text-white'}`}
              >
                Contratos
                {contracts.filter(c => c.status === 'signed').length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] inline-block animate-pulse"></span>
                )}
              </button>
              <button 
                onClick={() => { setCurrentView('client'); triggerToast("Visualizando catálogo"); }} 
                className="px-3 py-2 text-xs font-bold bg-brand-primary text-white hover:bg-blue-600 rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                Ver Loja
              </button>
              <button 
                onClick={() => { setCurrentView('client'); triggerToast("Logout realizado"); }} 
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all cursor-pointer" 
                title="Sair do Administrador"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Main Container */}
        <main className="max-w-6xl mx-auto w-full px-4 py-6 flex-grow flex flex-col gap-6 fade-in">
          
          {/* Quick Metrics */}
          {adminTab !== 'contracts' && (
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="premium-card p-5 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase tracking-wider">Total de Produtos</span>
                <span className="text-2xl font-black text-brand-secondary dark:text-white">{products.length}</span>
                <span className="text-[9px] text-brand-primary font-bold">itens listados no site</span>
              </div>
              <div className="premium-card p-5 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase tracking-wider">Valor Médio</span>
                <span className="text-2xl font-black text-brand-secondary dark:text-white">{formatPrice(avgPrice)}</span>
                <span className="text-[9px] text-brand-primary font-bold">base do preço PIX</span>
              </div>
              <div className="premium-card p-5 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase tracking-wider">Categorias Ativas</span>
                <span className="text-2xl font-black text-brand-secondary dark:text-white">{categoriesCount}</span>
                <span className="text-[9px] text-brand-primary font-bold">seções de produtos</span>
              </div>
              <div className="premium-card p-5 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase tracking-wider">WhatsApp Cadastrado</span>
                <span className="text-sm font-black text-brand-secondary dark:text-white truncate">{storeWhatsApp}</span>
                <span className="text-[9px] text-green-500 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>Ativo para receber</span>
              </div>
            </section>
          )}

          {/* TAB 1: PRODUCT LISTING & CRUD */}
          {adminTab === 'products' && (
            <div className="space-y-6">
              
              {/* Add Product Form */}
              <div className="premium-card p-5 md:p-6 space-y-4">
                <h3 className="text-base font-extrabold text-brand-secondary dark:text-white flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-brand-primary" />
                  Cadastrar Novo Produto
                </h3>
                <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Categoria</label>
                    <select 
                      value={newProduct.category} 
                      onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-brand-secondary dark:text-white focus:outline-none focus:border-brand-primary"
                    >
                      {SECTIONS_METADATA.map(s => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Modelo</label>
                    <input 
                      type="text" 
                      placeholder="Ex: iPhone 17 Pro"
                      value={newProduct.model} 
                      onChange={(e) => setNewProduct(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-brand-secondary dark:text-white focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Capacidade/Specs</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 256GB / 16GB RAM"
                      value={newProduct.storage} 
                      onChange={(e) => setNewProduct(prev => ({ ...prev, storage: e.target.value }))}
                      className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-brand-secondary dark:text-white focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Preço PIX (À Vista)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: R$ 7.899,00"
                      value={newProduct.cashPrice} 
                      onChange={(e) => setNewProduct(prev => ({ ...prev, cashPrice: e.target.value }))}
                      className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-brand-secondary dark:text-white font-mono focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Preço 12x (Parcelado)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: R$ 9.189,05"
                      value={newProduct.installmentPrice} 
                      onChange={(e) => setNewProduct(prev => ({ ...prev, installmentPrice: e.target.value }))}
                      className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-brand-mono dark:text-white focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-5 flex justify-end">
                    <button 
                      type="submit"
                      className="w-full md:w-auto px-6 py-2.5 bg-brand-primary hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Inserir no Catálogo
                    </button>
                  </div>
                </form>
              </div>

              {/* Products Table Editor */}
              <div className="premium-card p-5 md:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-brand-secondary dark:text-white">Itens no Catálogo</h3>
                    <p className="text-xs text-brand-muted dark:text-zinc-400">Edite diretamente os campos de texto na tabela. As alterações são salvas automaticamente.</p>
                  </div>
                  <div className="relative max-w-xs w-full">
                    <Search className="w-4 h-4 text-brand-muted dark:text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      type="text" 
                      className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full py-2.5 pl-9 pr-4 text-brand-secondary dark:text-white focus:outline-none focus:border-brand-primary shadow-inner" 
                      placeholder="Filtrar produtos..."
                    />
                  </div>
                </div>

                <div className="overflow-x-auto responsive-scrollbar w-full border border-gray-100 dark:border-zinc-800 rounded-2xl">
                  <table className="w-full text-left border-collapse min-w-[700px] whitespace-nowrap">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-zinc-800/40 border-b border-gray-200 dark:border-zinc-800 text-[10px] font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                        <th className="py-4 px-4">Imagem / Modelo</th>
                        <th className="py-4 px-4">Capacidade / Specs</th>
                        <th className="py-4 px-4 text-right">À Vista (PIX)</th>
                        <th className="py-4 px-4 text-right">Parcelado (12x)</th>
                        <th className="py-4 px-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-850 text-xs">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs text-brand-muted italic">
                            Nenhum item localizado no catálogo.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => {
                          const globalIdx = products.findIndex(item => item === p);
                          const activeColor = p.colors[p.selectedColorIdx] || { name: "Padrão", hex: "#FFFFFF", img: "" };
                          const activeImage = activeColor.img || "https://store.storeimages.apple.com/4982/as-images.apple.com/is/MHXH3?wid=150&hei=150&fmt=jpeg";

                          return (
                            <tr key={p.model + globalIdx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-center p-1">
                                    <img src={activeImage} alt={p.model} className="max-h-full max-w-full object-contain" />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <input 
                                      type="text" 
                                      value={p.model}
                                      onChange={(e) => updateProductValue(globalIdx, "model", e.target.value)}
                                      className="font-bold text-gray-900 dark:text-white bg-transparent border-b border-dashed border-transparent hover:border-gray-300 dark:hover:border-zinc-700 focus:border-brand-primary focus:outline-none"
                                    />
                                    <span className="text-[9px] uppercase tracking-wider text-brand-primary font-bold">{p.category}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <input 
                                  type="text" 
                                  value={p.storage} 
                                  onChange={(e) => updateProductValue(globalIdx, "storage", e.target.value)}
                                  className="bg-transparent border-b border-dashed border-transparent hover:border-gray-300 dark:hover:border-zinc-700 focus:border-brand-primary focus:outline-none font-semibold text-gray-655 dark:text-zinc-300"
                                />
                              </td>
                              <td className="py-3 px-4 text-right">
                                <input 
                                  type="text" 
                                  value={p.cashPrice} 
                                  onChange={(e) => updateProductValue(globalIdx, "cashPrice", e.target.value)}
                                  className="text-right font-black text-brand-primary font-mono bg-transparent border-b border-dashed border-transparent hover:border-gray-300 dark:hover:border-zinc-700 focus:border-brand-primary focus:outline-none w-24"
                                />
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                                <input 
                                  type="text" 
                                  value={p.installmentPrice} 
                                  onChange={(e) => updateProductValue(globalIdx, "installmentPrice", e.target.value)}
                                  className="text-right font-bold text-gray-900 dark:text-white bg-transparent border-b border-dashed border-transparent hover:border-gray-300 dark:hover:border-zinc-700 focus:border-brand-primary focus:outline-none w-24"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => openColorEditor(globalIdx)}
                                    className="px-2.5 py-1 text-[10px] bg-blue-50 dark:bg-blue-950/20 text-brand-primary hover:bg-blue-100 rounded-lg flex items-center gap-1 transition-all cursor-pointer font-bold border border-blue-100/35 dark:border-blue-900/30"
                                    title="Editar Imagens e Paleta de Cores"
                                  >
                                    <ImageIcon className="w-3 h-3" />
                                    Cores ({p.colors?.length || 0})
                                  </button>
                                  <button 
                                    onClick={() => removeProductRow(globalIdx)}
                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                                    title="Excluir item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: BULK PRICE ADJUSTER */}
          {adminTab === 'bulk-adjust' && (
            <div className="premium-card p-5 md:p-6 space-y-6 max-w-xl mx-auto w-full">
              <div>
                <h3 className="text-base font-extrabold text-brand-secondary dark:text-white flex items-center gap-2">
                  <Percent className="w-5 h-5 text-brand-primary" />
                  Ajuste de Preços em Lote
                </h3>
                <p className="text-xs text-brand-muted dark:text-zinc-400 mt-1 leading-relaxed">
                  Permite reajustar (aumentar ou diminuir) os preços PIX e parcelados de uma categoria específica (ou todos os itens) por uma determinada porcentagem. Muito útil em dias de variação de taxa cambial.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Selecione o Grupo de Itens</label>
                  <select 
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-brand-secondary dark:text-white focus:outline-none focus:border-brand-primary"
                  >
                    <option value="all">TODOS OS PRODUTOS (Total)</option>
                    {SECTIONS_METADATA.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase flex justify-between">
                    <span>Porcentagem de Ajuste</span>
                    <span className={`font-mono font-extrabold ${bulkPercentage > 0 ? 'text-green-600 dark:text-green-400' : bulkPercentage < 0 ? 'text-red-500' : 'text-brand-muted dark:text-zinc-400'}`}>
                      {bulkPercentage > 0 ? `+${bulkPercentage}` : bulkPercentage}%
                    </span>
                  </label>
                  <div className="flex gap-4 items-center">
                    <input 
                      type="range" 
                      min="-30" 
                      max="30" 
                      step="0.5"
                      value={bulkPercentage}
                      onChange={(e) => setBulkPercentage(parseFloat(e.target.value))}
                      className="w-full cursor-pointer h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none"
                    />
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setBulkPercentage(-5)}
                        className="px-2 py-1 text-[10px] font-extrabold bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg cursor-pointer transition-all"
                      >
                        -5%
                      </button>
                      <button 
                        onClick={() => setBulkPercentage(0)}
                        className="px-2 py-1 text-[10px] font-extrabold bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg cursor-pointer transition-all"
                      >
                        Zerar
                      </button>
                      <button 
                        onClick={() => setBulkPercentage(5)}
                        className="px-2 py-1 text-[10px] font-extrabold bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg cursor-pointer transition-all"
                      >
                        +5%
                      </button>
                    </div>
                  </div>
                  <span className="text-[9px] text-brand-muted block mt-1 leading-normal italic">
                    Valores positivos aumentam o preço; valores negativos dão desconto. Ex: +5% em iPhones recalcula os preços de forma imediata.
                  </span>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex gap-2">
                  <button 
                    onClick={handleBulkAdjust}
                    disabled={bulkPercentage === 0}
                    className="w-full py-3 bg-brand-secondary dark:bg-zinc-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:bg-black dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Percent className="w-3.5 h-3.5" />
                    Aplicar Ajuste nos Preços
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS, BACKUP, PASSWORD */}
          {adminTab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Form Store Settings */}
              <div className="premium-card p-5 md:p-6 space-y-4">
                <h3 className="text-base font-extrabold text-brand-secondary dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-brand-primary" />
                  Dados da Loja
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Nome da Loja</label>
                    <input 
                      type="text" 
                      value={storeName} 
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-brand-secondary dark:text-white focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase">WhatsApp do Lojista (Código do País + DDD + Número)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 5568999027454"
                      value={storeWhatsApp} 
                      onChange={(e) => setStoreWhatsApp(e.target.value)}
                      className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-brand-secondary dark:text-white focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Instagram da Loja</label>
                    <input 
                      type="text" 
                      value={storeInstagram} 
                      onChange={(e) => setStoreInstagram(e.target.value)}
                      className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-brand-secondary dark:text-white focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Website</label>
                    <input 
                      type="text" 
                      value={storeWebsite} 
                      onChange={(e) => setStoreWebsite(e.target.value)}
                      className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-brand-secondary dark:text-white focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Senha do Painel (Dígitos Numéricos)</label>
                    <input 
                      type="text" 
                      maxLength={8}
                      value={adminPIN} 
                      onChange={(e) => setAdminPIN(e.target.value.replace(/[^\d]/g, ''))}
                      className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-brand-secondary dark:text-white focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>

                  <hr className="border-gray-100 dark:border-zinc-850" />

                  {/* Credit Card Rates */}
                  <h4 className="text-xs font-bold text-brand-secondary dark:text-white uppercase pt-1">Simulador de Taxas de Cartão</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Taxa Base de Entrada (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={cardTaxBase} 
                        onChange={(e) => setCardTaxBase(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-brand-secondary dark:text-white focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 uppercase">Juros Mensal (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={cardTaxMonthly} 
                        onChange={(e) => setCardTaxMonthly(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-brand-secondary dark:text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                  <span className="text-[9px] text-brand-muted dark:text-zinc-400 leading-normal block italic">
                    Essas taxas são aplicadas de forma composta para simular o parcelamento do cliente no cartão de 1x a 12x.
                  </span>
                </div>
              </div>

              {/* Data Actions, Backup, Reset */}
              <div className="premium-card p-5 md:p-6 space-y-4">
                <h3 className="text-base font-extrabold text-brand-secondary dark:text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-brand-primary" />
                  Backup e Segurança
                </h3>
                <p className="text-xs text-brand-muted dark:text-zinc-400 leading-relaxed">
                  Para não perder as alterações feitas nos preços do seu catálogo, você pode exportar um arquivo de backup local ou reimportar em outro dispositivo.
                </p>

                <div className="grid grid-cols-1 gap-3 pt-2">
                  <button 
                    onClick={exportCatalogJSON}
                    className="py-3 px-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold text-brand-secondary dark:text-white flex items-center justify-center gap-2 transition-all cursor-pointer border-dashed border-gray-300 dark:border-zinc-655"
                  >
                    <Download className="w-4 h-4 text-brand-primary" />
                    Exportar Backup do Catálogo (.json)
                  </button>

                  <label className="py-3 px-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold text-brand-secondary dark:text-white flex items-center justify-center gap-2 transition-all cursor-pointer text-center border-dashed border-gray-300 dark:border-zinc-655">
                    <Upload className="w-4 h-4 text-brand-primary" />
                    <span>Importar Backup (.json)</span>
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={importCatalogJSON}
                      className="hidden"
                    />
                  </label>
                  
                  <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 flex flex-col gap-2">
                    <button 
                      onClick={resetToDefaults}
                      className="py-3 px-4 bg-red-50 dark:bg-red-955/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-955/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restaurar Todo Catálogo Padrão
                    </button>
                    <span className="text-[9.5px] text-brand-muted dark:text-zinc-400 text-center leading-normal block italic">
                      Atenção: A restauração apagará todas as modificações atuais de preços, cores e fotos de maneira definitiva.
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {adminTab === 'contracts' && (
            <AdminContractsTab
              contracts={contracts}
              onUpdateContracts={handleUpdateContracts}
              storeName={storeName}
              products={products}
            />
          )}

        </main>

        <footer className="text-center py-6 text-[10px] font-semibold text-brand-muted dark:text-zinc-500 uppercase tracking-wider">
          {storeName} © 2026 • Painel Administrativo
        </footer>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-brand-secondary text-white text-xs px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 z-50 animate-bounce">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Color Editor Modal */}
        {editingProductIdx !== null && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 flex flex-col max-h-[85vh] overflow-hidden border border-gray-100 dark:border-zinc-800">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-brand-secondary dark:text-white">Editor de Cores e Imagens</h3>
                  <p className="text-xs text-brand-muted dark:text-zinc-400 mt-0.5">{products[editingProductIdx].model}</p>
                </div>
                <button 
                  onClick={() => setEditingProductIdx(null)}
                  className="text-gray-400 hover:text-gray-655 p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Colors list inside modal */}
              <div className="space-y-4 overflow-y-auto pr-1 flex-grow">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-brand-muted dark:text-zinc-400 uppercase tracking-wider">Cores Cadastradas</h4>
                  {modalColors.map((color, colorIdx) => (
                    <div key={color.name + colorIdx} className="bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/80 p-3 rounded-2xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: color.hex }} />
                          <span className="text-xs font-bold text-brand-secondary dark:text-white">{color.name}</span>
                        </div>
                        <button 
                          onClick={() => removeColorFromModal(colorIdx)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remover
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-2 pt-1">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Nome da cor"
                            value={color.name}
                            onChange={(e) => {
                              const newColors = [...modalColors];
                              newColors[colorIdx] = { ...newColors[colorIdx], name: e.target.value };
                              setModalColors(newColors);
                            }}
                            className="w-1/2 text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-brand-secondary dark:text-white focus:outline-none"
                          />
                          <div className="w-1/2 flex gap-1">
                            <input 
                              type="color" 
                              value={color.hex}
                              onChange={(e) => {
                                const newColors = [...modalColors];
                                newColors[colorIdx] = { ...newColors[colorIdx], hex: e.target.value };
                                setModalColors(newColors);
                              }}
                              className="w-10 h-8 rounded-xl border border-gray-200 cursor-pointer overflow-hidden p-0"
                            />
                            <input 
                              type="text" 
                              value={color.hex}
                              onChange={(e) => {
                                const newColors = [...modalColors];
                                newColors[colorIdx] = { ...newColors[colorIdx], hex: e.target.value };
                                setModalColors(newColors);
                              }}
                              className="w-full text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-2 py-1.5 font-mono"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <input 
                            type="text" 
                            placeholder="URL ou Caminho da Imagem"
                            value={color.img}
                            onChange={(e) => {
                              const newColors = [...modalColors];
                              newColors[colorIdx] = { ...newColors[colorIdx], img: e.target.value };
                              setModalColors(newColors);
                            }}
                            className="flex-grow text-[11px] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-brand-secondary dark:text-white font-mono"
                          />
                          <label className="shrink-0 px-2.5 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-[10px] font-bold rounded-lg cursor-pointer transition-colors border border-gray-200 dark:border-zinc-700 text-center select-none text-gray-700 dark:text-zinc-300">
                            Carregar
                            <input 
                              type="file" 
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(file, (base64) => {
                                    const newColors = [...modalColors];
                                    newColors[colorIdx] = { ...newColors[colorIdx], img: base64 };
                                    setModalColors(newColors);
                                  });
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add color section inside modal */}
                <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-brand-muted dark:text-zinc-400 uppercase tracking-wider">Adicionar Nova Cor</h4>
                  <div className="bg-blue-50/50 dark:bg-blue-955/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-2xl space-y-3">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Nome da cor (ex: Titânio Natural)"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        className="w-1/2 text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-brand-secondary dark:text-white focus:outline-none"
                      />
                      <div className="w-1/2 flex items-center gap-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-2">
                        <input 
                          type="color" 
                          value={newColorHex}
                          onChange={(e) => setNewColorHex(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200"
                        />
                        <input 
                          type="text" 
                          value={newColorHex}
                          onChange={(e) => setNewColorHex(e.target.value)}
                          className="w-full text-xs bg-transparent focus:outline-none font-mono dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        placeholder="Caminho/URL da Foto"
                        value={newColorImg}
                        onChange={(e) => setNewColorImg(e.target.value)}
                        className="flex-grow text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-brand-secondary dark:text-white font-mono"
                      />
                      <label className="shrink-0 px-3 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-xs font-bold rounded-xl cursor-pointer transition-colors border border-gray-200 dark:border-zinc-700 text-center select-none text-gray-700 dark:text-zinc-300">
                        Carregar
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, (base64) => {
                                setNewColorImg(base64);
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                    <button 
                      onClick={addColorToModal}
                      className="w-full py-2 bg-brand-primary text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 hover:bg-blue-600 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Inserir Cor na Lista
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="border-t border-gray-100 dark:border-zinc-800 pt-3 flex gap-2 justify-end">
                <button 
                  onClick={() => setEditingProductIdx(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={saveColors}
                  className="px-5 py-2 bg-brand-secondary hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ELSE: RENDER CLIENT AREA (currentView === 'client')
  return (
    <div className="min-h-screen flex flex-col antialiased text-brand-secondary bg-brand-light dark:bg-[#0E0E10] dark:text-[#F5F5F7] font-sans relative overflow-x-hidden transition-colors duration-300">
      
      {/* Sticky Main Header */}
      <header className="glass-nav sticky top-0 z-40 px-4 py-3.5 flex items-center transition-all duration-300" id="client-header">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center select-none">
            <img src="/logo-completa.png" alt="Alcance Imports Logo" className="h-8 md:h-10 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input on header for large screens */}
            <div className="relative hidden md:flex items-center w-60 mr-2">
              <Search className="w-3.5 h-3.5 text-brand-muted dark:text-zinc-400 absolute left-3" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text" 
                className="w-full text-[11px] bg-gray-50 dark:bg-zinc-800 border border-gray-200/80 dark:border-zinc-700 rounded-full py-1.5 pl-8 pr-4 text-brand-secondary dark:text-white focus:outline-none focus:border-brand-primary shadow-inner" 
                placeholder="Buscar produto..."
              />
            </div>



            {/* Cart Button */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className={`px-4 py-2 text-xs font-bold text-white bg-brand-secondary dark:bg-zinc-900 border border-transparent dark:border-zinc-800 hover:bg-black rounded-full flex items-center gap-2 transition-all relative cursor-pointer shadow-md shadow-black/5 ${
                cartBouncing ? 'animate-cart-bounce' : ''
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Orçamento</span>
              {cartTotals.count > 0 && (
                <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] font-black flex items-center justify-center absolute -top-1.5 -right-1.5 shadow-md shadow-blue-500/30">
                  {cartTotals.count}
                </span>
              )}
            </button>

            {/* Share link button */}
            <button 
              onClick={generateShareLink} 
              className="p-2 text-brand-muted hover:text-brand-secondary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-850 rounded-full transition-colors cursor-pointer" 
              title="Compartilhar Catálogo"
            >
              <Share2 className="w-4 h-4" />
            </button>
            
            {/* Unlock admin mode */}
            {showAdminBtn && (
              <button 
                onClick={() => setCurrentView('admin-login')} 
                className="p-2 text-brand-muted hover:text-brand-primary dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-955 rounded-full transition-colors cursor-pointer"
                title="Painel Administrativo"
              >
                <Unlock className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-4 py-6 flex-grow flex flex-col gap-6 fade-in">
        
        {/* HERO CARD */}
        <section className="premium-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -z-10"></div>
          <div className="flex-grow space-y-4 text-center md:text-left">
            <span className="text-[10px] font-bold text-brand-primary tracking-[0.25em] uppercase block">Produtos Sob Encomenda</span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-brand-secondary dark:text-white leading-none uppercase">
              CATÁLOGO DE IMPORTADOS<br/>
              <span className="text-brand-primary font-serif italic text-2xl md:text-3xl normal-case tracking-normal">Premium & Garantia Apple</span>
            </h2>
            <p className="text-xs text-brand-muted dark:text-zinc-400 max-w-md leading-relaxed">
              Todos os aparelhos são lacrados de fábrica e possuem garantia mundial de 1 ano válida diretamente com a Apple. Compre com a segurança de um contrato juridicamente assinado.
            </p>
            
            <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1 select-none">
              <span className="px-3 py-1.5 rounded-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-[10px] font-semibold text-gray-700 dark:text-zinc-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                Garantia 1 Ano Apple
              </span>
              <span className="px-3 py-1.5 rounded-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-[10px] font-semibold text-gray-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-brand-primary" />
                Contrato de Compra
              </span>
              <span className="px-3 py-1.5 rounded-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-[10px] font-semibold text-gray-700 dark:text-zinc-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-brand-primary" />
                Até 12x no Cartão
              </span>
            </div>
          </div>
          
          <div className="w-48 h-48 md:w-56 md:h-56 flex-shrink-0 flex items-center justify-center relative">
            <img src="https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/iphone-17-pro-17-pro-max-hero.png" alt="Dispositivos Apple Hero" className="h-full object-contain filter drop-shadow-[0_20px_40px_rgba(10,132,255,0.1)] dark:drop-shadow-[0_20px_40px_rgba(10,132,255,0.25)] relative z-10 hover:scale-105 transition-transform duration-500 select-none" />
          </div>
        </section>

        {/* SEARCH AND FILTERS PANEL */}
        <section className="flex flex-col gap-4 border-b border-gray-200/50 dark:border-zinc-800 pb-5">
          {/* Global search input (mobile visible) */}
          <div className="relative flex md:hidden items-center w-full">
            <Search className="w-4 h-4 text-brand-muted dark:text-zinc-400 absolute left-3" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text" 
              className="w-full text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-850 rounded-full py-2.5 pl-9 pr-4 text-brand-secondary dark:text-white focus:outline-none focus:border-brand-primary shadow-sm" 
              placeholder="Buscar modelos, capacidades..."
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-brand-secondary dark:text-white uppercase tracking-wider">Filtrar por Categoria</h3>
              <p className="text-[10px] text-brand-muted dark:text-zinc-400">Escolha a seção para explorar os preços</p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-1 rounded-full shadow-sm w-fit">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-brand-primary text-white' : 'text-brand-muted dark:text-zinc-450 hover:text-brand-secondary dark:hover:text-white'}`}
                title="Exibição em Grade"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${viewMode === 'list' ? 'bg-brand-primary text-white' : 'text-brand-muted dark:text-zinc-450 hover:text-brand-secondary dark:hover:text-white'}`}
                title="Exibição em Tabela"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Category Horizontal Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none scroll-smooth">
            <button 
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                activeCategory === "all" 
                  ? 'bg-brand-secondary dark:bg-zinc-900 border-brand-secondary dark:border-zinc-800 text-white shadow-sm' 
                  : 'bg-white dark:bg-zinc-850 border-gray-200 dark:border-zinc-800 text-brand-muted dark:text-zinc-300 hover:text-brand-secondary dark:hover:text-white hover:border-gray-300 dark:hover:border-zinc-700'
              }`}
            >
              Exibir Tudo
            </button>
            {SECTIONS_METADATA.map(s => {
              const count = products.filter(p => p.category === s.id).length;
              if (count === 0) return null;
              return (
                <button 
                  key={s.id}
                  onClick={() => setActiveCategory(s.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeCategory === s.id 
                      ? 'bg-brand-secondary dark:bg-zinc-900 border-brand-secondary dark:border-zinc-800 text-white shadow-sm' 
                      : 'bg-white dark:bg-zinc-850 border-gray-200 dark:border-zinc-800 text-brand-muted dark:text-zinc-300 hover:text-brand-secondary dark:hover:text-white hover:border-gray-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {getIcon(s.icon)}
                  <span>{s.title}</span>
                  <span className={`text-[10px] font-black rounded-full px-1.5 py-0.2 ${activeCategory === s.id ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-brand-muted dark:text-zinc-400'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* VITRINE/GRID MODE */}
        {viewMode === 'grid' && (
          <section className="space-y-8">
            {SECTIONS_METADATA.map(section => {
              const sectionProducts = filteredProducts.filter(p => p.category === section.id);
              if (sectionProducts.length === 0) return null;

              return (
                <div key={section.id} className="space-y-4">
                  <h3 className="text-sm font-black text-brand-secondary dark:text-white uppercase tracking-widest flex items-center gap-2 border-l-4 border-brand-primary pl-2.5 py-1">
                    {section.title}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {sectionProducts.map((p) => {
                      const globalIdx = products.findIndex(item => item === p);
                      const activeColor = p.colors[p.selectedColorIdx] || { name: "Padrão", hex: "#FFFFFF", img: "" };
                      const activeImage = activeColor.img || "https://store.storeimages.apple.com/4982/as-images.apple.com/is/MHXH3?wid=150&hei=150&fmt=jpeg";

                      return (
                        <div key={p.model + globalIdx} className="premium-card p-5 flex flex-col justify-between items-center text-center relative overflow-hidden group">
                          
                          {/* Image Display */}
                          <div className="w-full h-44 flex items-center justify-center relative mb-4">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/20 rounded-3xl -z-10"></div>
                            <img src={activeImage} alt={p.model} className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.06)] dark:drop-shadow-[0_12px_24px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform duration-500 z-10 select-none" />
                          </div>

                          <div className="w-full space-y-3">
                            {/* Model and specs */}
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-955/40 text-brand-primary text-[9px] font-black tracking-wider uppercase border border-blue-100/35 dark:border-blue-900/40 select-none">
                                {p.storage}
                              </span>
                              <h4 className="text-sm font-black tracking-tight text-brand-secondary dark:text-white pt-1">
                                {highlightText(p.model, searchQuery)}
                              </h4>
                            </div>

                            {/* Swatches */}
                            {p.colors && p.colors.length > 0 && (
                              <div className="flex flex-col items-center gap-1.5">
                                <div className="flex items-center justify-center gap-2.5">
                                  {p.colors.map((color, cIdx) => {
                                    const isActive = p.selectedColorIdx === cIdx;
                                    const ringClass = isActive
                                      ? 'ring-2 ring-brand-primary ring-offset-2 scale-110 shadow-sm'
                                      : 'border border-gray-200 dark:border-zinc-700 hover:scale-105';
                                    return (
                                      <button 
                                        key={color.name + cIdx}
                                        onClick={() => changeProductColor(globalIdx, cIdx)} 
                                        className={`w-4 h-4 rounded-full transition-all duration-300 cursor-pointer ${ringClass}`} 
                                        style={{ backgroundColor: color.hex }} 
                                        title={color.name}
                                      />
                                    );
                                  })}
                                </div>
                                <span className="text-[9px] font-bold text-brand-muted dark:text-zinc-400 tracking-tight">{activeColor.name}</span>
                              </div>
                            )}

                            {/* Prices card */}
                            <div className="bg-gray-50/80 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800 rounded-2xl py-2.5 px-3 text-center space-y-0.5">
                              <span className="text-[8px] font-black text-brand-muted dark:text-zinc-400 uppercase tracking-wider block">Valor Especial PIX</span>
                              <span className="text-base font-black text-brand-primary tracking-tight block">{p.cashPrice}</span>
                              <span className="text-[9px] text-gray-505 dark:text-zinc-300 font-semibold block">
                                ou parcelado por {p.installmentPrice}
                              </span>
                              <button 
                                onClick={() => setSimulatingProduct(p)}
                                className="text-[9px] text-brand-primary hover:text-blue-600 dark:hover:text-blue-400 font-extrabold mt-1.5 block w-full cursor-pointer hover:underline"
                              >
                                Simular Parcelamento
                              </button>
                            </div>

                            {/* Actions button */}
                            <div className="grid grid-cols-5 gap-1.5 pt-1">
                              <button 
                                onClick={() => addToCart(p)}
                                className="col-span-4 py-2 bg-brand-secondary dark:bg-zinc-850 hover:bg-black dark:hover:bg-zinc-700 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all transform active:scale-95 cursor-pointer border border-transparent dark:border-zinc-800"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add ao Orçamento
                              </button>
                              <button 
                                onClick={() => copySingleProductReceiptAndSend(p)}
                                className="col-span-1 p-2 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-955/30 rounded-xl flex items-center justify-center text-[#25D366] transition-all transform active:scale-95 cursor-pointer border border-transparent"
                                title="Comprar este item via WhatsApp"
                              >
                                <Phone className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* LIST VIEW MODE */}
        {viewMode === 'list' && (
          <section className="space-y-6">
            {SECTIONS_METADATA.map(section => {
              const sectionProducts = filteredProducts.filter(p => p.category === section.id);
              if (sectionProducts.length === 0) return null;

              return (
                <div key={section.id} className="premium-card p-5 space-y-3">
                  <h3 className="text-sm font-black text-brand-secondary dark:text-white uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-2">
                    {section.title}
                  </h3>

                  <div className="overflow-x-auto responsive-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[600px] whitespace-nowrap">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-zinc-800/10 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800">
                          <th className="py-2.5 px-4">Modelo</th>
                          <th className="py-2.5 px-3">Capacidade</th>
                          <th className="py-2.5 px-3">Cores Disponíveis</th>
                          <th className="py-2.5 px-3 text-right">À Vista (PIX)</th>
                          <th className="py-2.5 px-3 text-right">Parcelado (12x)</th>
                          <th className="py-2.5 px-4 text-center">Adicionar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-zinc-850 text-xs">
                        {sectionProducts.map(p => {
                          const globalIdx = products.findIndex(item => item === p);
                          const activeColor = p.colors[p.selectedColorIdx] || { name: "Padrão", hex: "#FFFFFF", img: "" };
                          const activeImage = activeColor.img || "https://store.storeimages.apple.com/4982/as-images.apple.com/is/MHXH3?wid=150&hei=150&fmt=jpeg";

                          return (
                            <tr key={p.model + globalIdx} className="hover:bg-gray-50/30 dark:hover:bg-zinc-800/5 transition-colors">
                              <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-750 flex items-center justify-center p-0.5">
                                    <img src={activeImage} alt={p.model} className="max-h-full max-w-full object-contain" />
                                  </div>
                                  <span>{highlightText(p.model, searchQuery)}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-semibold text-gray-600 dark:text-zinc-305">{p.storage}</td>
                              <td className="py-3 px-3">
                                {p.colors && p.colors.length > 0 && (
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex gap-1">
                                      {p.colors.map((color, cIdx) => (
                                        <button 
                                          key={color.name + cIdx}
                                          onClick={() => changeProductColor(globalIdx, cIdx)} 
                                          className={`w-3.5 h-3.5 rounded-full border dark:border-zinc-700 cursor-pointer transition-all ${
                                            p.selectedColorIdx === cIdx ? 'ring-1 ring-brand-primary scale-110 shadow-sm' : 'border-gray-200'
                                          }`}
                                          style={{ backgroundColor: color.hex }}
                                          title={color.name}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-[9px] font-bold text-brand-muted">({activeColor.name})</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right font-black text-brand-primary text-sm font-mono">{p.cashPrice}</td>
                              <td className="py-3 px-3 text-right">
                                <div className="font-bold text-gray-705 dark:text-white">{p.installmentPrice}</div>
                                <button 
                                  onClick={() => setSimulatingProduct(p)}
                                  className="text-[9px] text-brand-primary hover:text-blue-600 dark:hover:text-blue-400 font-extrabold block ml-auto cursor-pointer hover:underline"
                                >
                                  Simular parcelas
                                </button>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    onClick={() => addToCart(p)}
                                    className="p-2 bg-brand-secondary dark:bg-zinc-800 border border-transparent dark:border-zinc-700 hover:bg-black dark:hover:bg-zinc-700 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                                    title="Adicionar ao Orçamento"
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => copySingleProductReceiptAndSend(p)}
                                    className="p-2 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-955/30 text-[#25D366] rounded-lg flex items-center justify-center transition-colors cursor-pointer border border-transparent"
                                    title="Encomendar via WhatsApp"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* PAYMENT METHODS */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-brand-primary uppercase tracking-widest px-1">Formas de Pagamento Aceitas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="premium-card p-5 flex flex-col items-start gap-3 hover:border-brand-primary/20 transition-all">
              <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/30 text-brand-primary flex items-center justify-center select-none">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-secondary dark:text-white">PIX à Vista</h4>
                <p className="text-xs text-brand-muted dark:text-zinc-400 mt-1 leading-relaxed">Melhor preço da tabela com desconto exclusivo imediato.</p>
              </div>
            </div>
            <div className="premium-card p-5 flex flex-col items-start gap-3 hover:border-brand-primary/20 transition-all">
              <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/30 text-brand-primary flex items-center justify-center select-none">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-secondary dark:text-white">Cartão ou Link</h4>
                <p className="text-xs text-brand-muted dark:text-zinc-400 mt-1 leading-relaxed">Parcele em até 12x via maquininha ou link de pagamento (com acréscimo de juros).</p>
              </div>
            </div>
            <div className="premium-card p-5 flex flex-col items-start gap-3 hover:border-brand-primary/20 transition-all">
              <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/30 text-brand-primary flex items-center justify-center select-none">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-secondary dark:text-white">Entrada + Saldo</h4>
                <p className="text-xs text-brand-muted dark:text-zinc-400 mt-1 leading-relaxed">Facilite seu pagamento oferecendo uma entrada e parcelando o restante.</p>
              </div>
            </div>
            <div className="premium-card p-5 flex flex-col items-start gap-3 hover:border-brand-primary/20 transition-all">
              <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/30 text-brand-primary flex items-center justify-center select-none">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-secondary dark:text-white">TED / Transferência</h4>
                <p className="text-xs text-brand-muted dark:text-zinc-400 mt-1 leading-relaxed">Pagamento via conta jurídica oficial da empresa Alcance.</p>
              </div>
            </div>
          </div>
        </section>

        {/* IMPORTANT DETAILS */}
        <section className="premium-card p-6 flex flex-col md:flex-row gap-6 justify-between items-start">
          <div className="space-y-2 flex-grow">
            <h4 className="text-sm font-extrabold text-brand-secondary dark:text-white flex items-center gap-1.5 select-none">
              <Info className="w-4 h-4 text-brand-primary" />
              Termos de Encomenda
            </h4>
            <ul className="text-xs text-brand-muted dark:text-zinc-400 space-y-1.5 list-disc pl-5 leading-relaxed">
              <li>Prazo médio de entrega de até 15 dias úteis a contar da data de confirmação do sinal.</li>
              <li>Selo oficial de segurança: contrato de compra e venda assinado digitalmente pelas partes.</li>
              <li>Aparelhos 100% originais com garantia global Apple de 1 ano.</li>
            </ul>
          </div>

          <div className="space-y-3 flex-shrink-0 text-left md:text-right w-full md:w-auto border-t md:border-t-0 border-gray-100 dark:border-zinc-800 pt-4 md:pt-0">
            <h4 className="text-sm font-extrabold text-brand-secondary dark:text-white select-none">Atendimento ao Cliente</h4>
            <div className="space-y-1.5 text-xs text-brand-muted dark:text-zinc-400 font-medium">
              <p className="flex items-center md:justify-end gap-2">
                <Phone className="w-3.5 h-3.5 text-brand-primary" />
                {storeWhatsApp}
              </p>
              <p className="flex items-center md:justify-end gap-2">
                <Instagram className="w-3.5 h-3.5 text-brand-primary" />
                {storeInstagram}
              </p>
              <p className="text-[10px] text-brand-primary font-bold">
                {storeWebsite}
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="text-center py-6 text-[10px] font-semibold text-brand-muted dark:text-zinc-500 uppercase tracking-wider select-none">
        {storeName} © 2026 • Todos os direitos reservados.
      </footer>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-brand-secondary text-white text-xs px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CLIENT SIDE CART DRAWER / SIDEBAR */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in">
          
          <div className="absolute inset-0 -z-10" onClick={() => setIsCartOpen(false)} />
          
          <div className="bg-white dark:bg-zinc-900 border-l dark:border-zinc-800 max-w-md w-full h-full flex flex-col p-6 shadow-2xl animate-slide-in relative">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-brand-primary" />
                <h3 className="text-base font-extrabold text-brand-secondary dark:text-white">Meu Orçamento</h3>
                <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-brand-muted dark:text-zinc-350 rounded-full px-2 py-0.5 font-bold">
                  {cartTotals.count} itens
                </span>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-grow overflow-y-auto py-4 space-y-3.5 pr-1">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-brand-muted border border-gray-100 dark:border-zinc-755">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-brand-secondary dark:text-white uppercase">Orçamento Vazio</h4>
                    <p className="text-[11px] text-brand-muted dark:text-zinc-400 mt-1 max-w-[200px]">Navegue pelos produtos e adicione aparelhos ao seu orçamento para enviar via WhatsApp.</p>
                  </div>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800 p-3 rounded-2xl flex items-start gap-3 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-white dark:bg-zinc-850 border border-gray-100 dark:border-zinc-800 flex items-center justify-center p-1 flex-shrink-0">
                      <img src={item.img} alt={item.model} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="flex-grow min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-black text-brand-secondary dark:text-white truncate">{item.model}</h4>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer"
                          title="Remover Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-[10px] text-brand-muted dark:text-zinc-400 font-bold">
                        <span className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded px-1.5 py-0.2">{item.storage}</span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block border border-gray-300 dark:border-zinc-700" style={{ backgroundColor: item.colorHex }} />
                          {item.colorName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-black text-brand-primary font-mono">{item.cashPrice} <span className="text-[9px] text-brand-muted dark:text-zinc-400 font-normal">un</span></span>
                        
                        {/* Quantity selector */}
                        <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-0.5 shadow-sm">
                          <button 
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-300 rounded transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black px-1 font-mono text-brand-secondary dark:text-white">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-300 rounded transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 space-y-4">
                <div className="bg-gray-50 dark:bg-zinc-800/40 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-brand-secondary dark:text-white">
                    <span>Subtotal PIX (À Vista):</span>
                    <span className="text-sm font-black text-brand-primary font-mono">{cartTotals.cash}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-505 dark:text-zinc-300 font-semibold border-t border-gray-200/50 dark:border-zinc-800 pt-2">
                    <span>Subtotal Parcelado:</span>
                    <span className="font-mono">{cartTotals.installment} <span className="text-[10px] text-brand-muted dark:text-zinc-400 font-sans">(até 12x)</span></span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={copyReceiptToClipboardAndSend}
                    className="w-full py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/10 hover:shadow-green-500/20 transition-all cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    Enviar Orçamento via WhatsApp
                  </button>
                  <button 
                    onClick={() => setCart([])}
                    className="w-full py-2 bg-transparent hover:bg-gray-55 dark:hover:bg-zinc-800 text-brand-muted dark:text-zinc-400 hover:text-red-500 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Esvaziar Orçamento
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Installment Simulator Modal */}
      {simulatingProduct !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 flex flex-col max-h-[85vh] overflow-hidden border border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-brand-secondary dark:text-white uppercase tracking-wider">Simulador de Parcelas</h3>
                <p className="text-[11px] text-brand-muted dark:text-zinc-400 mt-0.5">{simulatingProduct.model} ({simulatingProduct.storage})</p>
              </div>
              <button 
                onClick={() => setSimulatingProduct(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulation Table List */}
            <div className="overflow-y-auto pr-1 flex-grow space-y-2 text-xs">
              <div className="bg-blue-50 dark:bg-blue-955/20 border border-blue-100 dark:border-blue-900/35 p-3 rounded-2xl flex justify-between items-center">
                <span className="font-bold text-blue-800 dark:text-blue-300">À Vista (PIX):</span>
                <span className="font-black text-brand-primary text-sm font-mono">{simulatingProduct.cashPrice}</span>
              </div>
              
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-brand-muted dark:text-zinc-450 uppercase tracking-wider block mb-1">Simulação no Cartão de Crédito</span>
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(months => {
                  const cashVal = parsePrice(simulatingProduct.cashPrice);
                  const sim = calculateInstallment(cashVal, months);
                  return (
                    <div key={months} className="flex justify-between items-center bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800/60 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                      <span className="font-semibold text-gray-600 dark:text-zinc-400">{months}x de</span>
                      <div className="text-right">
                        <span className="font-black text-gray-900 dark:text-white font-mono">{formatPrice(sim.installmentValue)}</span>
                        <span className="text-[9px] text-brand-muted dark:text-zinc-400 block font-medium">Total: {formatPrice(sim.totalValue)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notice */}
            <div className="text-[9.5px] text-brand-muted dark:text-zinc-400 text-center leading-normal border-t border-gray-100 dark:border-zinc-800 pt-3 italic">
              Taxa base de {cardTaxBase}% + juros de {cardTaxMonthly}% a.m. inclusos na simulação. Sujeito a alteração de acordo com a operadora de cartão.
            </div>
          </div>
        </div>
      )}

      {/* INSTRUCTIONS MODAL: COPIED CLIPBOARD DIALOG */}
      {showCopyOverlay && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 flex flex-col border border-gray-100 dark:border-zinc-850">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-950/20 text-[#25D366] flex items-center justify-center shadow-inner select-none">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-brand-secondary dark:text-white uppercase tracking-wider">Recibo Pronto!</h3>
              <p className="text-xs text-brand-muted dark:text-zinc-400 leading-relaxed">
                Um **comprovante visual com as fotos, capacidades e valores** dos aparelhos foi copiado automaticamente para sua área de transferência!
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-zinc-800/40 p-4 rounded-2xl space-y-3.5 text-xs text-brand-secondary dark:text-zinc-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center shrink-0">1</span>
                <p className="leading-relaxed">Clique no botão **"Abrir WhatsApp"** para abrir o chat com o lojista.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center shrink-0">2</span>
                <p className="leading-relaxed">No campo de mensagem, pressione **Colar (Ctrl+V no PC** ou **segure e clique em Colar no celular**).</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center shrink-0">3</span>
                <p className="leading-relaxed">Envie o recibo visual e a mensagem de texto para finalizar!</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setShowCopyOverlay(false)}
                className="w-1/3 py-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-350 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Fechar
              </button>
              <button 
                onClick={() => {
                  if (whatsappLink) {
                    window.open(whatsappLink, '_blank');
                  } else {
                    sendCartToWhatsApp();
                  }
                  setShowCopyOverlay(false);
                }}
                className="w-2/3 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/15 transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
      {isContractFlowOpen && (
        <ContractSigningFlow
          cart={cart}
          cartTotals={cartTotals}
          storeName={storeName}
          storeWhatsApp={storeWhatsApp}
          onClose={() => setIsContractFlowOpen(false)}
          onContractSigned={handleContractSigned}
        />
      )}
      {activeSignContract && (
        <ContractSigningFlow
          cart={[]}
          cartTotals={{ cash: '', installment: '', count: 0 }}
          storeName={storeName}
          storeWhatsApp={storeWhatsApp}
          onClose={() => {
            window.location.hash = '';
          }}
          onContractSigned={(signedContract) => {
            handleContractSigned(signedContract);
            // Clear hash after signing to exit the flow
            setTimeout(() => {
              window.location.hash = '';
            }, 3000);
          }}
          presetContract={activeSignContract}
        />
      )}

    </div>
  );
}
