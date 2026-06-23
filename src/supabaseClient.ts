import { createClient } from '@supabase/supabase-js';
import type { Contract } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vgqhclyojipxnlxoihxi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YbUnj_ND6kPEx3mGP7eWUA_M4AGVjM-';

// Validate the URL before initializing to prevent the library from throwing
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const supabase = isValidUrl(supabaseUrl) && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// --- Contracts Helpers ---

export async function fetchContracts(): Promise<Contract[]> {
  if (!supabase) {
    console.warn('Supabase não inicializado. Retornando contratos vazios.');
    return [];
  }
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Erro ao buscar contratos do Supabase:', error);
    throw error;
  }
  return (data || []) as Contract[];
}

export async function saveContractToSupabase(contract: Contract): Promise<void> {
  if (!supabase) return;
  const cleanContract = { ...contract };
  delete cleanContract.audit;
  const { error } = await supabase
    .from('contracts')
    .upsert(cleanContract);

  if (error) {
    console.error('Erro ao salvar contrato no Supabase:', error);
    throw error;
  }
}

export async function saveAllContractsToSupabase(contractsList: Contract[]): Promise<void> {
  if (!supabase || contractsList.length === 0) return;
  const cleanList = contractsList.map(c => {
    const clean = { ...c };
    delete clean.audit;
    return clean;
  });
  const { error } = await supabase
    .from('contracts')
    .upsert(cleanList);

  if (error) {
    console.error('Erro ao salvar todos os contratos no Supabase:', error);
    throw error;
  }
}

export async function deleteContractFromSupabase(contractId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', contractId);

  if (error) {
    console.error('Erro ao deletar contrato no Supabase:', error);
    throw error;
  }
}

export async function fetchContractByToken(token: string): Promise<Contract | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .rpc('get_contract_by_token', { token });

  if (error) {
    console.error('Erro ao buscar contrato por token do Supabase:', error);
    throw error;
  }
  return (data && data.length > 0) ? (data[0] as Contract) : null;
}

export async function signContractSecure(
  contractId: string,
  signature: string,
  documents: any,
  audit: any
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .rpc('sign_contract_secure', {
      contract_id: contractId,
      client_signature: signature,
      client_documents: documents,
      client_audit: audit
    });

  if (error) {
    console.error('Erro ao assinar contrato de forma segura no Supabase:', error);
    throw error;
  }
}

// --- Store Configs Helpers (Products & Settings) ---

export async function fetchStoreConfig<T>(key: string, fallback: T): Promise<T> {
  if (!supabase) {
    console.warn(`Supabase não inicializado. Retornando fallback para ${key}.`);
    return fallback;
  }
  const { data, error } = await supabase
    .from('store_configs')
    .select('value')
    .eq('key', key)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Row not found
      return fallback;
    }
    console.error(`Erro ao buscar config ${key} do Supabase:`, error);
    return fallback;
  }
  return data?.value as T;
}

export async function saveStoreConfig<T>(key: string, value: T): Promise<void> {
  if (!supabase) return;
  let cleanValue = value;
  if (key === 'settings' && typeof value === 'object' && value !== null) {
    const copy = { ...value } as any;
    delete copy.adminPIN; // Exclude PIN from being stored in plaintext in the database row
    cleanValue = copy;
  }
  const { error } = await supabase
    .from('store_configs')
    .upsert({ key, value: cleanValue });

  if (error) {
    console.error(`Erro ao salvar config ${key} no Supabase:`, error);
    throw error;
  }
}
