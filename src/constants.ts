import type { Product, SectionMetadata } from './types';

export const SECTIONS_METADATA: SectionMetadata[] = [
  { id: "iphones", title: "iPhones", icon: "smartphone", modelHeader: "Modelo do iPhone" },
  { id: "watches", title: "Apple Watch", icon: "watch", modelHeader: "Modelo do Watch" },
  { id: "macmini", title: "Mac Mini", icon: "monitor", modelHeader: "Modelo do Mac Mini" },
  { id: "macbookair", title: "MacBook Air", icon: "laptop", modelHeader: "Modelo do MacBook Air" },
  { id: "macbookneo", title: "MacBook Neo", icon: "laptop", modelHeader: "Modelo do MacBook Neo" },
  { id: "macbookpro", title: "MacBook Pro", icon: "laptop", modelHeader: "Modelo do MacBook Pro" },
  { id: "ipads", title: "iPads", icon: "tablet", modelHeader: "Modelo do iPad" },
  { id: "accessories", title: "Acessórios", icon: "plug", modelHeader: "Acessório / Item" }
];

export const DEFAULT_PRODUCTS: Product[] = [
  // iPhones
  { 
    category: "iphones", 
    model: "iPhone 17E", 
    storage: "256GB", 
    cashPrice: "R$ 4.199,00", 
    installmentPrice: "R$ 4.889,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Azul-céu", hex: "#95B3D7", img: "fotos iphones/17 azul.webp" },
      { name: "Lavanda", hex: "#D6D2E6", img: "fotos iphones/17 lavanda.webp" },
      { name: "Verde-teal", hex: "#A5C5C0", img: "fotos iphones/17 verde.webp" },
      { name: "Branco", hex: "#F2F2F4", img: "fotos iphones/17 branco.jpg" },
      { name: "Preto", hex: "#303032", img: "fotos iphones/17 preto.webp" }
    ]
  },
  { 
    category: "iphones", 
    model: "iPhone 17", 
    storage: "256GB", 
    cashPrice: "R$ 5.299,00", 
    installmentPrice: "R$ 6.169,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Azul-céu", hex: "#95B3D7", img: "fotos iphones/17 azul.webp" },
      { name: "Lavanda", hex: "#D6D2E6", img: "fotos iphones/17 lavanda.webp" },
      { name: "Verde-teal", hex: "#A5C5C0", img: "fotos iphones/17 verde.webp" },
      { name: "Branco", hex: "#F2F2F4", img: "fotos iphones/17 branco.jpg" },
      { name: "Preto", hex: "#303032", img: "fotos iphones/17 preto.webp" }
    ]
  },
  { 
    category: "iphones", 
    model: "iPhone 17 Air", 
    storage: "256GB", 
    cashPrice: "R$ 6.299,00", 
    installmentPrice: "R$ 7.329,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Azul-céu", hex: "#95B3D7", img: "fotos iphones/17 azul.webp" },
      { name: "Lavanda", hex: "#D6D2E6", img: "fotos iphones/17 lavanda.webp" },
      { name: "Verde-teal", hex: "#A5C5C0", img: "fotos iphones/17 verde.webp" },
      { name: "Branco", hex: "#F2F2F4", img: "fotos iphones/17 branco.jpg" },
      { name: "Preto", hex: "#303032", img: "fotos iphones/17 preto.webp" }
    ]
  },
  { 
    category: "iphones", 
    model: "iPhone 17 Pro", 
    storage: "256GB", 
    cashPrice: "R$ 7.899,00", 
    installmentPrice: "R$ 9.189,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Titânio Deserto", hex: "#C2B29F", img: "fotos iphones/17 pro deserto.png" },
      { name: "Titânio Preto", hex: "#232322", img: "fotos iphones/17 pro preto.png" },
      { name: "Titânio Natural", hex: "#A1A19A", img: "fotos iphones/17 pro natural.png" },
      { name: "Titânio Branco", hex: "#F2F2F2", img: "fotos iphones/17 pro branco.webp" },
      { name: "Titânio Azul", hex: "#3C4D5E", img: "fotos iphones/17 pro azul.webp" },
      { name: "Titânio Laranja", hex: "#D4815F", img: "fotos iphones/17 pro laranja.webp" }
    ]
  },
  { 
    category: "iphones", 
    model: "iPhone 17 Pro Max", 
    storage: "256GB", 
    cashPrice: "R$ 8.599,00", 
    installmentPrice: "R$ 9.999,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Titânio Deserto", hex: "#C2B29F", img: "fotos iphones/17 pro deserto.png" },
      { name: "Titânio Preto", hex: "#232322", img: "fotos iphones/17 pro preto.png" },
      { name: "Titânio Natural", hex: "#A1A19A", img: "fotos iphones/17 pro natural.png" },
      { name: "Titânio Branco", hex: "#F2F2F2", img: "fotos iphones/17 pro branco.webp" },
      { name: "Titânio Azul", hex: "#3C4D5E", img: "fotos iphones/17 pro azul.webp" },
      { name: "Titânio Laranja", hex: "#D4815F", img: "fotos iphones/17 pro laranja.webp" }
    ]
  },
  { 
    category: "iphones", 
    model: "iPhone 17 Pro Max", 
    storage: "512GB", 
    cashPrice: "R$ 10.199,00", 
    installmentPrice: "R$ 11.859,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Titânio Deserto", hex: "#C2B29F", img: "fotos iphones/17 pro deserto.png" },
      { name: "Titânio Preto", hex: "#232322", img: "fotos iphones/17 pro preto.png" },
      { name: "Titânio Natural", hex: "#A1A19A", img: "fotos iphones/17 pro natural.png" },
      { name: "Titânio Branco", hex: "#F2F2F2", img: "fotos iphones/17 pro branco.webp" },
      { name: "Titânio Azul", hex: "#3C4D5E", img: "fotos iphones/17 pro azul.webp" },
      { name: "Titânio Laranja", hex: "#D4815F", img: "fotos iphones/17 pro laranja.webp" }
    ]
  },
  { 
    category: "iphones", 
    model: "iPhone 17 Pro Max", 
    storage: "1TB", 
    cashPrice: "R$ 10.999,00", 
    installmentPrice: "R$ 12.789,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Titânio Deserto", hex: "#C2B29F", img: "fotos iphones/17 pro deserto.png" },
      { name: "Titânio Preto", hex: "#232322", img: "fotos iphones/17 pro preto.png" },
      { name: "Titânio Natural", hex: "#A1A19A", img: "fotos iphones/17 pro natural.png" },
      { name: "Titânio Branco", hex: "#F2F2F2", img: "fotos iphones/17 pro branco.webp" },
      { name: "Titânio Azul", hex: "#3C4D5E", img: "fotos iphones/17 pro azul.webp" },
      { name: "Titânio Laranja", hex: "#D4815F", img: "fotos iphones/17 pro laranja.webp" }
    ]
  },
  { 
    category: "iphones", 
    model: "iPhone 16", 
    storage: "128GB", 
    cashPrice: "R$ 4.699,00", 
    installmentPrice: "R$ 5.469,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Preto", hex: "#3C3D3A", img: "https://as-images.apple.com/is/iphone-16-black-select-202409?wid=150&hei=150&fmt=jpeg" },
      { name: "Branco", hex: "#F2F2F4", img: "https://as-images.apple.com/is/iphone-16-white-select-202409?wid=150&hei=150&fmt=jpeg" },
      { name: "Rosa", hex: "#E5B6C3", img: "https://as-images.apple.com/is/iphone-16-pink-select-202409?wid=150&hei=150&fmt=jpeg" },
      { name: "Verde-teal", hex: "#9BC2B1", img: "https://as-images.apple.com/is/iphone-16-teal-select-202409?wid=150&hei=150&fmt=jpeg" },
      { name: "Ultramarine", hex: "#4667B8", img: "https://as-images.apple.com/is/iphone-16-ultramarine-select-202409?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  { 
    category: "iphones", 
    model: "iPhone 15", 
    storage: "128GB", 
    cashPrice: "R$ 4.299,00", 
    installmentPrice: "R$ 4.999,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Preto", hex: "#3C3D3A", img: "https://as-images.apple.com/is/iphone-15-black-select-202309?wid=150&hei=150&fmt=jpeg" },
      { name: "Azul", hex: "#D2E1EC", img: "https://as-images.apple.com/is/iphone-15-blue-select-202309?wid=150&hei=150&fmt=jpeg" },
      { name: "Verde", hex: "#D4E6D9", img: "https://as-images.apple.com/is/iphone-15-green-select-202309?wid=150&hei=150&fmt=jpeg" },
      { name: "Amarelo", hex: "#FAF1C8", img: "https://as-images.apple.com/is/iphone-15-yellow-select-202309?wid=150&hei=150&fmt=jpeg" },
      { name: "Rosa", hex: "#FAD5D9", img: "https://as-images.apple.com/is/iphone-15-pink-select-202309?wid=150&hei=150&fmt=jpeg" }
    ]
  },

  // Apple Watch
  {
    category: "watches",
    model: "Apple Watch SE2",
    storage: "44mm GPS",
    cashPrice: "R$ 1.699,00",
    installmentPrice: "R$ 1.979,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Meia-noite", hex: "#2E3641", img: "https://as-images.apple.com/is/MT2K3ref_VW_34FR+watch-case-44-aluminum-midnight-nc-se_VW_34FR_WF_CO?wid=150&hei=150&fmt=jpeg" },
      { name: "Estelar", hex: "#F0E4D3", img: "https://as-images.apple.com/is/MT2L3ref_VW_34FR+watch-case-44-aluminum-starlight-nc-se_VW_34FR_WF_CO?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/MT2M3ref_VW_34FR+watch-case-44-aluminum-silver-nc-se_VW_34FR_WF_CO?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  {
    category: "watches",
    model: "Apple Watch SE3",
    storage: "40mm GPS",
    cashPrice: "R$ 1.999,00",
    installmentPrice: "R$ 2.329,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Meia-noite", hex: "#2E3641", img: "https://as-images.apple.com/is/MT2K3ref_VW_34FR+watch-case-44-aluminum-midnight-nc-se_VW_34FR_WF_CO?wid=150&hei=150&fmt=jpeg" },
      { name: "Estelar", hex: "#F0E4D3", img: "https://as-images.apple.com/is/MT2L3ref_VW_34FR+watch-case-44-aluminum-starlight-nc-se_VW_34FR_WF_CO?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/MT2M3ref_VW_34FR+watch-case-44-aluminum-silver-nc-se_VW_34FR_WF_CO?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  {
    category: "watches",
    model: "Apple Watch S11",
    storage: "42mm GPS",
    cashPrice: "R$ 2.499,00",
    installmentPrice: "R$ 2.909,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Preto Brilhante", hex: "#111111", img: "https://as-images.apple.com/is/s10-case-alum-jetblack-sport-band-black-s10?wid=150&hei=150&fmt=jpeg" },
      { name: "Ouro Rosa", hex: "#E8C5C8", img: "https://as-images.apple.com/is/s10-case-alum-rose-sport-band-light-pink-s10?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/s10-case-alum-silver-sport-band-blue-s10?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  {
    category: "watches",
    model: "Apple Watch S11",
    storage: "46mm GPS",
    cashPrice: "R$ 2.699,00",
    installmentPrice: "R$ 3.139,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Preto Brilhante", hex: "#111111", img: "https://as-images.apple.com/is/s10-case-alum-jetblack-sport-band-black-s10?wid=150&hei=150&fmt=jpeg" },
      { name: "Ouro Rosa", hex: "#E8C5C8", img: "https://as-images.apple.com/is/s10-case-alum-rose-sport-band-light-pink-s10?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/s10-case-alum-silver-sport-band-blue-s10?wid=150&hei=150&fmt=jpeg" }
    ]
  },

  // Mac Mini
  {
    category: "macmini",
    model: "Mac Mini M2",
    storage: "8GB / 256GB",
    cashPrice: "R$ 4.950,00",
    installmentPrice: "R$ 5.759,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/mac-mini-hero-202301?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  {
    category: "macmini",
    model: "Mac Mini M2",
    storage: "8GB / 512GB",
    cashPrice: "R$ 5.900,00",
    installmentPrice: "R$ 6.869,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/mac-mini-hero-202301?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  {
    category: "macmini",
    model: "Mac Mini M4",
    storage: "16GB / 256GB",
    cashPrice: "R$ 7.550,00",
    installmentPrice: "R$ 8.789,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/mac-mini-hero-202410?wid=150&hei=150&fmt=jpeg" }
    ]
  },

  // MacBook Air
  {
    category: "macbookair",
    model: "MacBook Air M4 13\"",
    storage: "16GB / 256GB",
    cashPrice: "R$ 7.900,00",
    installmentPrice: "R$ 9.189,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Cinza Espacial", hex: "#535455", img: "https://as-images.apple.com/is/mba13-spacegray-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Meia-noite", hex: "#2E3641", img: "https://as-images.apple.com/is/mba13-midnight-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Estelar", hex: "#F0E4D3", img: "https://as-images.apple.com/is/mba13-starlight-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/mba13-silver-select-202402?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  {
    category: "macbookair",
    model: "MacBook Air M4 15\"",
    storage: "16GB / 256GB",
    cashPrice: "R$ 9.150,00",
    installmentPrice: "R$ 10.649,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Cinza Espacial", hex: "#535455", img: "https://as-images.apple.com/is/mba13-spacegray-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Meia-noite", hex: "#2E3641", img: "https://as-images.apple.com/is/mba13-midnight-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Estelar", hex: "#F0E4D3", img: "https://as-images.apple.com/is/mba13-starlight-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/mba13-silver-select-202402?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  {
    category: "macbookair",
    model: "MacBook Air M4 13\"",
    storage: "16GB / 512GB",
    cashPrice: "R$ 8.900,00",
    installmentPrice: "R$ 10.359,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Cinza Espacial", hex: "#535455", img: "https://as-images.apple.com/is/mba13-spacegray-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Meia-noite", hex: "#2E3641", img: "https://as-images.apple.com/is/mba13-midnight-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Estelar", hex: "#F0E4D3", img: "https://as-images.apple.com/is/mba13-starlight-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/mba13-silver-select-202402?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  {
    category: "macbookair",
    model: "MacBook Air M4 13\"",
    storage: "16GB / 1TB",
    cashPrice: "R$ 9.300,00",
    installmentPrice: "R$ 10.819,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Cinza Espacial", hex: "#535455", img: "https://as-images.apple.com/is/mba13-spacegray-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Meia-noite", hex: "#2E3641", img: "https://as-images.apple.com/is/mba13-midnight-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Estelar", hex: "#F0E4D3", img: "https://as-images.apple.com/is/mba13-starlight-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/mba13-silver-select-202402?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  {
    category: "macbookair",
    model: "MacBook Air M5 13\"",
    storage: "16GB / 512GB",
    cashPrice: "R$ 8.400,00",
    installmentPrice: "R$ 9.779,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Azul-céu", hex: "#95B3D7", img: "https://http2.mlstatic.com/D_NQ_NP_987326-MLA108121270073_032026-O.jpg" },
      { name: "Cinza Espacial", hex: "#535455", img: "https://as-images.apple.com/is/mba13-spacegray-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Meia-noite", hex: "#2E3641", img: "https://as-images.apple.com/is/mba13-midnight-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Estelar", hex: "#F0E4D3", img: "https://as-images.apple.com/is/mba13-starlight-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/mba13-silver-select-202402?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  {
    category: "macbookair",
    model: "MacBook Air M5 15\"",
    storage: "16GB / 512GB",
    cashPrice: "R$ 9.950,00",
    installmentPrice: "R$ 11.579,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Azul-céu", hex: "#95B3D7", img: "https://http2.mlstatic.com/D_NQ_NP_987326-MLA108121270073_032026-O.jpg" },
      { name: "Cinza Espacial", hex: "#535455", img: "https://as-images.apple.com/is/mba13-spacegray-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Meia-noite", hex: "#2E3641", img: "https://as-images.apple.com/is/mba13-midnight-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Estelar", hex: "#F0E4D3", img: "https://as-images.apple.com/is/mba13-starlight-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/mba13-silver-select-202402?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  {
    category: "macbookair",
    model: "MacBook Air M5 13\"",
    storage: "16GB / 1TB",
    cashPrice: "R$ 9.900,00",
    installmentPrice: "R$ 11.519,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Azul-céu", hex: "#95B3D7", img: "https://http2.mlstatic.com/D_NQ_NP_987326-MLA108121270073_032026-O.jpg" },
      { name: "Cinza Espacial", hex: "#535455", img: "https://as-images.apple.com/is/mba13-spacegray-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Meia-noite", hex: "#2E3641", img: "https://as-images.apple.com/is/mba13-midnight-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Estelar", hex: "#F0E4D3", img: "https://as-images.apple.com/is/mba13-starlight-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/mba13-silver-select-202402?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  {
    category: "macbookair",
    model: "MacBook Air M5 15\"",
    storage: "24GB / 1TB",
    cashPrice: "R$ 14.000,00",
    installmentPrice: "R$ 16.289,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Azul-céu", hex: "#95B3D7", img: "https://http2.mlstatic.com/D_NQ_NP_987326-MLA108121270073_032026-O.jpg" },
      { name: "Cinza Espacial", hex: "#535455", img: "https://as-images.apple.com/is/mba13-spacegray-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Meia-noite", hex: "#2E3641", img: "https://as-images.apple.com/is/mba13-midnight-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Estelar", hex: "#F0E4D3", img: "https://as-images.apple.com/is/mba13-starlight-select-202402?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/mba13-silver-select-202402?wid=150&hei=150&fmt=jpeg" }
    ]
  },

  // MacBook Neo
  {
    category: "macbookneo",
    model: "MacBook Neo 13\"",
    storage: "8GB / 256GB",
    cashPrice: "R$ 6.050,00",
    installmentPrice: "R$ 7.039,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Índigo", hex: "#3A4B5C", img: "https://http2.mlstatic.com/D_NQ_NP_788058-MLA108114860853_032026-O.jpg" },
      { name: "Blush", hex: "#E6C8B8", img: "https://http2.mlstatic.com/D_NQ_NP_951511-MLA107400263710_032026-O.jpg" },
      { name: "Amarelo Cítrico", hex: "#E8DFB3", img: "https://http2.mlstatic.com/D_NQ_NP_783189-MLA108115745849_032026-O.jpg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://http2.mlstatic.com/D_NQ_NP_858311-MLA108115686299_032026-O.jpg" }
    ]
  },
  {
    category: "macbookneo",
    model: "MacBook Neo 13\"",
    storage: "8GB / 512GB",
    cashPrice: "R$ 7.000,00",
    installmentPrice: "R$ 8.149,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Índigo", hex: "#3A4B5C", img: "https://http2.mlstatic.com/D_NQ_NP_788058-MLA108114860853_032026-O.jpg" },
      { name: "Blush", hex: "#E6C8B8", img: "https://http2.mlstatic.com/D_NQ_NP_951511-MLA107400263710_032026-O.jpg" },
      { name: "Amarelo Cítrico", hex: "#E8DFB3", img: "https://http2.mlstatic.com/D_NQ_NP_783189-MLA108115745849_032026-O.jpg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://http2.mlstatic.com/D_NQ_NP_858311-MLA108115686299_032026-O.jpg" }
    ]
  },

  // MacBook Pro
  {
    category: "macbookpro",
    model: "MacBook Pro M5 14\"",
    storage: "16GB / 1TB",
    cashPrice: "R$ 13.500,00",
    installmentPrice: "R$ 15.700,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Preto Espacial", hex: "#1C1C1D", img: "https://as-images.apple.com/is/mbp14-spaceblack-select-202410?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/mbp14-silver-select-202410?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  {
    category: "macbookpro",
    model: "MacBook Pro M5 14\"",
    storage: "24GB / 1TB",
    cashPrice: "R$ 14.900,00",
    installmentPrice: "R$ 17.329,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Preto Espacial", hex: "#1C1C1D", img: "https://as-images.apple.com/is/mbp14-spaceblack-select-202410?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/mbp14-silver-select-202410?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  {
    category: "macbookpro",
    model: "MacBook Pro M5 Pro 14\"",
    storage: "24GB / 1TB",
    cashPrice: "R$ 16.900,00",
    installmentPrice: "R$ 19.659,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Preto Espacial", hex: "#1C1C1D", img: "https://as-images.apple.com/is/mbp14-spaceblack-select-202410?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/mbp14-silver-select-202410?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  {
    category: "macbookpro",
    model: "MacBook Pro M5 Pro 14\"",
    storage: "24GB / 2TB",
    cashPrice: "R$ 20.500,00",
    installmentPrice: "R$ 23.849,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Preto Espacial", hex: "#1C1C1D", img: "https://as-images.apple.com/is/mbp14-spaceblack-select-202410?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/mbp14-silver-select-202410?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  {
    category: "macbookpro",
    model: "MacBook Pro M5 Pro 16\"",
    storage: "24GB / 1TB",
    cashPrice: "R$ 19.900,00",
    installmentPrice: "R$ 23.149,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Preto Espacial", hex: "#1C1C1D", img: "https://as-images.apple.com/is/mbp14-spaceblack-select-202410?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/mbp14-silver-select-202410?wid=150&hei=150&fmt=jpeg" }
    ]
  },

  // iPads
  { 
    category: "ipads", 
    model: "iPad 11ª Geração (A16)", 
    storage: "128GB Wi-Fi", 
    cashPrice: "R$ 2.599,00", 
    installmentPrice: "R$ 3.029,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Cinza Espacial", hex: "#535455", img: "https://as-images.apple.com/is/ipad-10th-gen-storage-select-202210-spacegray-wifi?wid=150&hei=150&fmt=jpeg" },
      { name: "Azul", hex: "#C1D6E6", img: "https://as-images.apple.com/is/ipad-10th-gen-storage-select-202210-blue-wifi?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  { 
    category: "ipads", 
    model: "iPad Air M4", 
    storage: "128GB Wi-Fi", 
    cashPrice: "R$ 4.399,00", 
    installmentPrice: "R$ 5.119,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Cinza Espacial", hex: "#535455", img: "https://as-images.apple.com/is/ipad-air-storage-select-202405-11inch-spacegray-wifi?wid=150&hei=150&fmt=jpeg" },
      { name: "Azul", hex: "#C1D6E6", img: "https://as-images.apple.com/is/ipad-air-storage-select-202405-11inch-blue-wifi?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  { 
    category: "ipads", 
    model: "iPad Pro M5 11\"", 
    storage: "256GB", 
    cashPrice: "R$ 8.999,00", 
    installmentPrice: "R$ 10.469,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Preto Espacial", hex: "#1C1C1D", img: "https://as-images.apple.com/is/ipad-pro-storage-select-202405-11inch-spaceblack-wifi?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/ipad-pro-storage-select-202405-11inch-silver-wifi?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  { 
    category: "ipads", 
    model: "iPad Pro M5 13\"", 
    storage: "256GB", 
    cashPrice: "R$ 9.299,00", 
    installmentPrice: "R$ 10.819,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Preto Espacial", hex: "#1C1C1D", img: "https://as-images.apple.com/is/ipad-pro-storage-select-202405-11inch-spaceblack-wifi?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/ipad-pro-storage-select-202405-11inch-silver-wifi?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  { 
    category: "ipads", 
    model: "iPad Pro M5 13\"", 
    storage: "256GB Wi-Fi + Cellular", 
    cashPrice: "R$ 10.599,00", 
    installmentPrice: "R$ 12.329,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Preto Espacial", hex: "#1C1C1D", img: "https://as-images.apple.com/is/ipad-pro-storage-select-202405-11inch-spaceblack-wifi?wid=150&hei=150&fmt=jpeg" },
      { name: "Prateado", hex: "#E3E4E5", img: "https://as-images.apple.com/is/ipad-pro-storage-select-202405-11inch-silver-wifi?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  
  // Acessórios
  { 
    category: "accessories", 
    model: "AirPods Pro 3", 
    storage: "Estojo USB-C", 
    cashPrice: "R$ 1.799,00", 
    installmentPrice: "R$ 2.099,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Branco", hex: "#FFFFFF", img: "https://as-images.apple.com/is/MTJV3?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  { 
    category: "accessories", 
    model: "Apple Pencil Pro", 
    storage: "Compatível M4/M2", 
    cashPrice: "R$ 949,00", 
    installmentPrice: "R$ 1.109,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Branco", hex: "#FFFFFF", img: "https://as-images.apple.com/is/MX2D3?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  { 
    category: "accessories", 
    model: "Apple Pencil", 
    storage: "Entrada USB-C", 
    cashPrice: "R$ 849,00", 
    installmentPrice: "R$ 989,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Branco", hex: "#FFFFFF", img: "https://as-images.apple.com/is/MU8F3?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  { 
    category: "accessories", 
    model: "Magic Mouse 3", 
    storage: "Recarregável", 
    cashPrice: "R$ 849,00", 
    installmentPrice: "R$ 989,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Branco", hex: "#FFFFFF", img: "https://as-images.apple.com/is/MX053?wid=150&hei=150&fmt=jpeg" },
      { name: "Preto", hex: "#1C1C1D", img: "https://as-images.apple.com/is/MX063?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  { 
    category: "accessories", 
    model: "Fonte Original Apple", 
    storage: "20W USB-C", 
    cashPrice: "R$ 199,00", 
    installmentPrice: "R$ 229,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Branco", hex: "#FFFFFF", img: "https://as-images.apple.com/is/MHXH3?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  { 
    category: "accessories", 
    model: "Cabo USB-C → Lightning Original Apple", 
    storage: "1 metro", 
    cashPrice: "R$ 179,00", 
    installmentPrice: "R$ 209,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Branco", hex: "#FFFFFF", img: "https://as-images.apple.com/is/MM0A3?wid=150&hei=150&fmt=jpeg" }
    ]
  },
  { 
    category: "accessories", 
    model: "Cabo USB-C iPhone 15 Original Apple", 
    storage: "Tecido Trançado", 
    cashPrice: "R$ 189,00", 
    installmentPrice: "R$ 219,00",
    selectedColorIdx: 0,
    colors: [
      { name: "Branco", hex: "#FFFFFF", img: "https://as-images.apple.com/is/MQKY3?wid=150&hei=150&fmt=jpeg" }
    ]
  }
];
