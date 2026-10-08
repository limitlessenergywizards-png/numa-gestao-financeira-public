/**
 * API integrations for Brazilian data validation
 * Uses free public APIs: BrasilAPI for CNPJ, ViaCEP for addresses
 */

export interface CNPJData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  cep: string;
  uf: string;
  municipio: string;
  bairro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  email: string | null;
  telefone1: string | null;
  telefone2: string | null;
}

export interface CEPData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

/**
 * Validate and fetch company data from CNPJ using BrasilAPI
 * @param cnpj - CNPJ with or without mask
 * @returns Company data or null if invalid
 */
export async function fetchCNPJData(cnpj: string): Promise<CNPJData | null> {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  if (cleanCNPJ.length !== 14) {
    return null;
  }

  try {
    const response = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn('CNPJ not found or invalid:', cleanCNPJ);
      return null;
    }

    const data = await response.json();
    
    return {
      cnpj: data.cnpj,
      razao_social: data.razao_social,
      nome_fantasia: data.nome_fantasia,
      cep: data.cep,
      uf: data.uf,
      municipio: data.municipio,
      bairro: data.bairro,
      logradouro: data.logradouro,
      numero: data.numero,
      complemento: data.complemento,
      email: data.email,
      telefone1: data.ddd_telefone_1,
      telefone2: data.ddd_telefone_2,
    };
  } catch (error) {
    console.error('Error fetching CNPJ data:', error);
    return null;
  }
}

/**
 * Fetch address data from CEP using ViaCEP API
 * @param cep - CEP with or without mask
 * @returns Address data or null if invalid
 */
export async function fetchCEPData(cep: string): Promise<CEPData | null> {
  const cleanCEP = cep.replace(/\D/g, '');
  
  if (cleanCEP.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(
      `https://viacep.com.br/ws/${cleanCEP}/json/`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn('CEP not found:', cleanCEP);
      return null;
    }

    const data = await response.json();
    
    if (data.erro) {
      return null;
    }

    return {
      cep: data.cep,
      logradouro: data.logradouro,
      complemento: data.complemento,
      bairro: data.bairro,
      localidade: data.localidade,
      uf: data.uf,
    };
  } catch (error) {
    console.error('Error fetching CEP data:', error);
    return null;
  }
}
