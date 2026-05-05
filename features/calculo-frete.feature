Funcionalidade: Calculo de frete
  Como cliente da aplicacao
  Quero calcular o frete com base na regiao, no peso e no tipo de entrega
  Para saber o valor final da entrega

  Esquema do Cenario: calcular frete pela tabela de decisao
    Dado que o frete base da particao "<particao_frete>" e <frete_base> reais
    E o peso esta na particao "<particao_peso>" com valor <peso> kg
    E a entrega expressa e <entrega_expressa>
    Quando eu calcular o frete para a regiao "<regiao>"
    Entao o frete base deve ser "R$ <frete_base_formatado>"
    E o adicional por peso deve ser "R$ <adicional_peso_formatado>"
    E o adicional de entrega expressa deve ser "R$ <adicional_expressa_formatado>"
    E o valor total deve ser "R$ <total_formatado>"

    Exemplos:
      | particao_frete | regiao       | frete_base | particao_peso | peso | entrega_expressa | frete_base_formatado | adicional_peso_formatado | adicional_expressa_formatado | total_formatado |
      | Sul-Sudeste    | Sul          | 10         | ate 5 kg       | 4    | falso             | 10,00                 | 0,00                     | 0,00                         | 10,00           |
      | Sul-Sudeste    | Sul          | 10         | ate 5 kg       | 4    | verdadeiro        | 10,00                 | 0,00                     | 5,00                         | 15,00           |
      | Sul-Sudeste    | Sul          | 10         | acima de 5 kg  | 7    | falso             | 10,00                 | 4,00                     | 0,00                         | 14,00           |
      | Sul-Sudeste    | Sul          | 10         | acima de 5 kg  | 7    | verdadeiro        | 10,00                 | 4,00                     | 7,00                         | 21,00           |
      | Centro-Oeste   | Centro-Oeste | 15         | ate 5 kg       | 4    | falso             | 15,00                 | 0,00                     | 0,00                         | 15,00           |
      | Centro-Oeste   | Centro-Oeste | 15         | ate 5 kg       | 4    | verdadeiro        | 15,00                 | 0,00                     | 7,50                         | 22,50           |
      | Centro-Oeste   | Centro-Oeste | 15         | acima de 5 kg  | 7    | falso             | 15,00                 | 4,00                     | 0,00                         | 19,00           |
      | Centro-Oeste   | Centro-Oeste | 15         | acima de 5 kg  | 7    | verdadeiro        | 15,00                 | 4,00                     | 9,50                         | 28,50           |
      | Norte-Nordeste | Norte        | 20         | ate 5 kg       | 4    | falso             | 20,00                 | 0,00                     | 0,00                         | 20,00           |
      | Norte-Nordeste | Norte        | 20         | ate 5 kg       | 4    | verdadeiro        | 20,00                 | 0,00                     | 10,00                        | 30,00           |
      | Norte-Nordeste | Norte        | 20         | acima de 5 kg  | 7    | falso             | 20,00                 | 4,00                     | 0,00                         | 24,00           |
      | Norte-Nordeste | Norte        | 20         | acima de 5 kg  | 7    | verdadeiro        | 20,00                 | 4,00                     | 12,00                        | 36,00           |
