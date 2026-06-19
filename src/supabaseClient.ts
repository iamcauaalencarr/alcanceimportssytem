import { createClient } from '@supabase/supabase-js';
import type { Contract } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Contracts Helpers ---

export async function fetchContracts(): Promise<Contract[]> {
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
  const { error } = await supabase
    .from('contracts')
    .upsert(contract);

  if (error) {
    console.error('Erro ao salvar contrato no Supabase:', error);
    throw error;
  }
}

export async function saveAllContractsToSupabase(contractsList: Contract[]): Promise<void> {
  if (contractsList.length === 0) return;
  const { error } = await supabase
    .from('contracts')
    .upsert(contractsList);

  if (error) {
    console.error('Erro ao salvar todos os contratos no Supabase:', error);
    throw error;
  }
}

export async function deleteContractFromSupabase(contractId: string): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', contractId);

  if (error) {
    console.error('Erro ao deletar contrato no Supabase:', error);
    throw error;
  }
}

// --- Store Configs Helpers (Products & Settings) ---

export async function fetchStoreConfig<T>(key: string, fallback: T): Promise<T> {
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
  const { error } = await supabase
    .from('store_configs')
    .upsert({ key, value });

  if (error) {
    console.error(`Erro ao salvar config ${key} no Supabase:`, error);
    throw error;
  }
}
