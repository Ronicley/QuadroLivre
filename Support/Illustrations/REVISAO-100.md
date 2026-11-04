# Registro de revisão local — 100 temas V2

## Proveniência e limites

Este registro consolida a inspeção descrita no `HANDOFF.md` da entrega 1.2.0 (120). Não representa nova inspeção visual nesta continuação, teste no iPad ou aprovação do responsável.

Na produção anterior foram inspecionadas as cinco folhas de contato de Seguir contorno e as cinco de Colorir, além de ampliações selecionadas. **Não foi realizada inspeção ampliada individual de todas as 200 apresentações.** A revisão por folha permite avaliar conjunto, variedade e defeitos aparentes, mas pode não detectar pequenas junções, anatomia inadequada ou regiões difíceis de pintar.

## Alcance por lote

| Lote | Temas | Categorias | Seguir contorno | Colorir | Aceite humano final |
|---|---|---|---|---|---|
| 1 | 1–20 | A/B — gatos e bichinhos | Folha inspecionada | Folha inspecionada | Pendente, exceto piloto 1 |
| 2 | 21–40 | C/D — natureza e brincadeiras | Folha inspecionada | Folha inspecionada | Pendente, exceto piloto 32 |
| 3 | 41–60 | E/F — pequenos mundos e aventuras | Folha inspecionada | Folha inspecionada | Pendente, exceto pilotos 41 e 51 |
| 4 | 61–80 | G/H — aconchego e passeios | Folha inspecionada | Folha inspecionada | Pendente, exceto pilotos 63 e 71 |
| 5 | 81–100 | I/J — fantasia e celebrações | Folha inspecionada | Folha inspecionada | Pendente |

Arquivos: `review-100/batch-{1...5}-{trace,coloring}.png`. [Índice offline](review-100/index.html) com detalhes individuais dos dois modos. O handoff não enumera todas as ampliações selecionadas; não inferir uma lista de itens individualmente inspecionados.

## Correções registradas antes da instalação

O handoff registra os seguintes refinamentos, já incluídos na V2 instalada:

- Gato no jardim em pose caminhando.
- Panda com composição própria, sem duplicar o urso.
- Segundo amigo na cena da pipa; fio sem atravessar seu rosto.
- Barco a remo no lago, distinto do veleiro.
- Toldo sem atravessar as orelhas do coelho.
- Linhas de carroceria/rodas e junções sobrepostas.

Não houve aprovação final do responsável para essas novas artes. Não marcar os temas como aprovados com base apenas nessa lista ou nos validadores.

## Evidência automática separada

Os testes verificam manifesto, dimensões, CRC, alpha, margens, contraste, densidade, hashes de preservação e links da revisão. Não avaliam reconhecimento pela criança, beleza, anatomia, fechamento visual de todas as regiões ou facilidade de pintura.

A entrega instalada foi congelada em `catalog-100-release.json` e `full-catalog-art-sha256.json`. Qualquer correção artística posterior precisa de nova versão, preservando V2 para os quadros já salvos.

## Como registrar o retorno do responsável

Para cada observação, informar:

- Número e ID do tema, modo (`trace`, `coloring` ou ambos) e versão.
- Aprovação explícita ou correção solicitada, preferencialmente com captura da área.
- Quem revisou e em qual contexto (navegador, iPad ou sessão com a criança).
- Se foi testada apenas a arte ou também a interação.

O registro individual oficial de aprovação é `reviewStatus` no manifesto, alterado somente após retorno explícito. Aprovar produção não é aprovar todas as artes. Aceite técnico no aparelho deve ser registrado separadamente em `TESTES-IPAD.md`.
