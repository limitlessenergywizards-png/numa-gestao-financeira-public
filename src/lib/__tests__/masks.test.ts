import { describe, it, expect } from 'vitest';
import {
  maskCNPJ,
  maskCPF,
  maskCEP,
  maskPhone,
  maskCurrency,
  maskCurrencyInput,
  unmask,
  isValidCNPJ,
  isValidCEP,
  isValidEmail,
  formatCnpj,
} from '../masks';

describe('maskCNPJ()', () => {
  it('formats 14 digits: 11222333000181 → 11.222.333/0001-81', () => {
    expect(maskCNPJ('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('progressively masks as user types', () => {
    expect(maskCNPJ('11')).toBe('11');
    expect(maskCNPJ('112')).toBe('11.2');
    expect(maskCNPJ('11222')).toBe('11.222');
    expect(maskCNPJ('11222333')).toBe('11.222.333');
    expect(maskCNPJ('112223330001')).toBe('11.222.333/0001');
  });

  it('strips non-digit characters before masking', () => {
    expect(maskCNPJ('11.222.333/0001-81')).toBe('11.222.333/0001-81');
  });

  it('truncates beyond 14 digits', () => {
    expect(maskCNPJ('1122233300018199')).toBe('11.222.333/0001-81');
  });
});

describe('maskCPF()', () => {
  it('formats 11 digits: 12345678901 → 123.456.789-01', () => {
    expect(maskCPF('12345678901')).toBe('123.456.789-01');
  });

  it('progressively masks', () => {
    expect(maskCPF('123')).toBe('123');
    expect(maskCPF('1234')).toBe('123.4');
    expect(maskCPF('1234567')).toBe('123.456.7');
  });

  it('truncates beyond 11 digits', () => {
    expect(maskCPF('123456789012')).toBe('123.456.789-01');
  });
});

describe('maskCEP()', () => {
  it('formats 8 digits: 01310100 → 01310-100', () => {
    expect(maskCEP('01310100')).toBe('01310-100');
  });

  it('progressively masks', () => {
    expect(maskCEP('01310')).toBe('01310');
    expect(maskCEP('013101')).toBe('01310-1');
  });

  it('truncates beyond 8 digits', () => {
    expect(maskCEP('013101001')).toBe('01310-100');
  });
});

describe('maskPhone()', () => {
  it('mobile (11 digits): 11999887766 → (11) 99988-7766', () => {
    expect(maskPhone('11999887766')).toBe('(11) 99988-7766');
  });

  it('landline (10 digits): 1133445566 → (11) 3344-5566', () => {
    expect(maskPhone('1133445566')).toBe('(11) 3344-5566');
  });

  it('strips non-digits first', () => {
    expect(maskPhone('(11) 99988-7766')).toBe('(11) 99988-7766');
  });
});

describe('maskCurrency()', () => {
  it('formats cents to BRL: 150000 → R$ 1.500,00', () => {
    const result = maskCurrency('150000');
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s?1\.500,00/);
  });

  it('zero → R$ 0,00', () => {
    const result = maskCurrency('');
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s?0,00/);
  });

  it('single digit → R$ 0,01', () => {
    const result = maskCurrency('1');
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s?0,01/);
  });
});

describe('maskCurrencyInput()', () => {
  it('formats without R$ prefix: 150000 → 1.500,00', () => {
    expect(maskCurrencyInput('150000')).toBe('1.500,00');
  });

  it('zero → 0,00', () => {
    expect(maskCurrencyInput('')).toBe('0,00');
  });

  it('small value: 99 → 0,99', () => {
    expect(maskCurrencyInput('99')).toBe('0,99');
  });
});

describe('unmask()', () => {
  it('strips all non-digit characters', () => {
    expect(unmask('11.222.333/0001-81')).toBe('11222333000181');
  });

  it('strips from CPF', () => {
    expect(unmask('123.456.789-01')).toBe('12345678901');
  });

  it('strips from CEP', () => {
    expect(unmask('01310-100')).toBe('01310100');
  });

  it('returns empty for empty string', () => {
    expect(unmask('')).toBe('');
  });
});

describe('isValidCNPJ()', () => {
  it('valid CNPJ: 11.222.333/0001-81', () => {
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
  });

  it('valid CNPJ without mask: 11222333000181', () => {
    expect(isValidCNPJ('11222333000181')).toBe(true);
  });

  it('invalid check digits: 11.222.333/0001-82', () => {
    expect(isValidCNPJ('11.222.333/0001-82')).toBe(false);
  });

  it('all same digits: 11.111.111/1111-11', () => {
    expect(isValidCNPJ('11.111.111/1111-11')).toBe(false);
  });

  it('wrong length: 123', () => {
    expect(isValidCNPJ('123')).toBe(false);
  });

  it('empty string', () => {
    expect(isValidCNPJ('')).toBe(false);
  });
});

describe('isValidCEP()', () => {
  it('valid CEP with mask: 01310-100', () => {
    expect(isValidCEP('01310-100')).toBe(true);
  });

  it('valid CEP without mask: 01310100', () => {
    expect(isValidCEP('01310100')).toBe(true);
  });

  it('too short: 123', () => {
    expect(isValidCEP('123')).toBe(false);
  });

  it('empty string', () => {
    expect(isValidCEP('')).toBe(false);
  });
});

describe('isValidEmail()', () => {
  it('valid email: test@example.com', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('valid with subdomain: user@mail.example.co', () => {
    expect(isValidEmail('user@mail.example.co')).toBe(true);
  });

  it('missing @: invalid', () => {
    expect(isValidEmail('invalid')).toBe(false);
  });

  it('missing domain: user@', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('spaces: "user @example.com"', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });

  it('empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});

describe('formatCnpj()', () => {
  it('is an alias for maskCNPJ', () => {
    expect(formatCnpj('11222333000181')).toBe(maskCNPJ('11222333000181'));
  });
});
