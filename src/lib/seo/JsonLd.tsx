import * as React from 'react';

type SchemaInput = Record<string, unknown>;

interface JsonLdProps {
  /**
   * Um schema unico (objeto) ou multiplos schemas (array). Quando array,
   * a saida e envelopada em `{ "@context": "https://schema.org", "@graph": [...] }`.
   */
  data: SchemaInput | SchemaInput[];
  /** id opcional pro <script> (debug em DevTools) */
  id?: string;
}

/**
 * Renderiza um <script type="application/ld+json"> no HTML server-side.
 *
 * Escapa `<` em strings JSON para prevenir injecao de fechamento de
 * </script>. JSON.stringify por padrao nao escapa `<`, entao uma string
 * contendo `</script>` no schema iria sair literalmente e fechar o tag.
 */
export function JsonLd({ data, id }: JsonLdProps) {
  const payload = Array.isArray(data)
    ? { '@context': 'https://schema.org', '@graph': data }
    : data;

  const json = JSON.stringify(payload).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      id={id}
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
