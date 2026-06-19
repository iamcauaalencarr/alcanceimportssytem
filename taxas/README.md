# 💳 Taxas de Parcelamento - Alcance Imports

Este diretório contém a documentação das taxas de parcelamento por cartão de crédito e débito configuradas no site.

---

## 📊 Tabela de Taxas (InfinitePay)

### 1. Presencial: Maquininha Smart / InfiniteTap

| Parcelas | Mastercard / Visa | Elo / Amex |
| :--- | :---: | :---: |
| **Débito** | 1,37% | 2,58% |
| **1x (Crédito)** | 3,15% | 4,91% |
| **2x** | 5,39% | 6,47% |
| **3x** | 6,12% | 7,20% |
| **4x** | 6,85% | 7,92% |
| **5x** | 7,57% | 8,63% |
| **6x** | 8,28% | 9,33% |
| **7x** | 8,99% | 10,03% |
| **8x** | 9,69% | 10,72% |
| **9x** | 10,38% | 11,41% |
| **10x** | 11,06% | 12,08% |
| **11x** | 11,74% | 12,75% |
| **12x** | 12,40% | 13,41% |

### 2. Online: Link de Pagamento e Cobrança

| Parcelas | Todas as Bandeiras (Visa/Master/Elo/Amex) |
| :--- | :---: |
| **1x (Crédito)** | 4,20% |
| **2x** | 6,09% |
| **3x** | 7,01% |
| **4x** | 7,91% |
| **5x** | 8,80% |
| **6x** | 9,67% |
| **7x** | 12,59% |
| **8x** | 13,42% |
| **9x** | 14,25% |
| **10x** | 15,06% |
| **11x** | 15,87% |
| **12x** | 16,66% |

---

## 🧮 Fórmula de Cálculo das Parcelas

O simulador calcula o valor das parcelas utilizando a reversão de taxa (cálculo oficial de repasse da InfinitePay):

$$\text{Total Financiado} = \frac{\text{Valor do Produto} - \text{Entrada}}{1 - \frac{\text{Taxa \%}}{100}}$$

$$\text{Valor da Parcela} = \frac{\text{Total Financiado}}{\text{Nº de Parcelas}}$$

---

## 💡 Exemplo Prático com Entrada (Amortização)

**Produto:** iPhone 17 Pro Max (Valor à vista: R$ 8.599,00)  
**Entrada (no PIX):** R$ 2.000,00  
**Meio de Pagamento:** Maquininha (Mastercard/Visa)  
**Parcelamento:** 1x Crédito (Taxa = 3,15%)  

1. **Cálculo do Saldo Restante:**  
   $$\text{Saldo} = 8.599,00 - 2.000,00 = R\$ 6.599,00$$
2. **Aplicação da Taxa da Maquininha por Reversão (1x Master/Visa = 3,15%):**  
   $$\text{Total no Cartão} = \frac{6.599,00}{1 - 0,0315} = \frac{6.599,00}{0,9685} = R\$ 6.813,63$$
3. **Valor da Parcela:**  
   $$\text{Parcela} = \frac{6.813,63}{1} = R\$ 6.813,63$$

O cliente pagará **R$ 2.000,00 de entrada** + **1 parcela de R$ 6.813,63** no cartão de crédito.
