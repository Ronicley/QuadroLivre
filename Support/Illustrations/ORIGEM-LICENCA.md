# Origem e condições de uso — catálogo V1.2 de 100 temas

## Autoria e fontes

- Artes vetoriais originais elaboradas pelo assistente de programação (assistência de IA) para Quadro Livre. São 100 temas com duas apresentações cada, não 50 por modo.
- Não foram incorporados arquivos da Vecteezy, páginas comerciais, personagens conhecidos, logotipos, emojis ou ícones de sistema como páginas de atividade. Personagens e pequenos motivos próprios podem ser compartilhados entre cenas; isso não representa exclusividade de cada elemento gráfico.
- Os seis pilotos V2 usam `scripts/natural_pilot_art.py` e as fontes preservadas do piloto. O gato mantém byte a byte as fontes aprovadas em `review-natural-cat-v2/`, com hashes em `approval.json`.
- As 94 definições novas são produzidas por `scripts/make_full_catalog.py`, `catalog_shapes.py`, `catalog_animals.py`, `catalog_nature.py`, `catalog_play.py`, `catalog_adventures.py`, `catalog_cozy.py`, `catalog_travel.py`, `catalog_fantasy.py` e `catalog_food.py`.
- Fontes atuais: `v2/<id>-v2-{trace,coloring}.svg`; anteriores em `v1/`. Runtime PNG transparente de 1536 × 1536 e miniaturas de 240 × 240 derivados por Cairo no desenvolvimento. Não há renderizador SVG, Cairo ou download de artes no aplicativo.
- Registro individual de ID, número, título, categoria, complexidade, proporção, versão, autoria/origem e condições: `Sources/QuadroLivre/Resources/catalog-v1.json` (schema interno V2).

## Condições de uso

Uso, alteração e distribuição permitidos com o aplicativo. Nenhuma licença oficial de franquia é oferecida ou alegada. A atribuição descreve a origem; não constitui garantia de exclusividade autoral sobre saídas assistidas por IA.

A permissão de alteração não autoriza substituir silenciosamente a arte de um quadro salvo: a política técnica exige nova versão do asset e preservação da anterior.

## Revisões e preservação

- `legacy-asset-sha256.json`: PNGs dos pilotos V1 e modelos V1.1.
- `v2-art-sha256.json`: fontes e runtime dos seis pilotos V2 aprovados.
- `full-catalog-art-sha256.json`: 400 hashes das 200 fontes SVG e 200 imagens de runtime atuais.
- `catalog-100-release.json`: entrega 1.2.0 (120) instalada; V2 não pode mais ser revisada no lugar.
- Revisões V1 dos pilotos em `archivedItems`, fora do seletor, continuam disponíveis para quadros antigos. O carro V1 reaproveitava geometria própria da V1.1; esses arquivos legados permanecem preservados.
- Correções futuras exigem nova `assetVersion` e arquivamento da revisão anterior, com adaptação explícita do gerador/manifesto/testes. Não remover registros de publicação nem contornar hashes. Miniaturas e prévias são derivados regeneráveis.

## Estado de revisão

Os seis pares V2 foram aprovados pelo responsável, que autorizou produzir os 100 temas; registro em `pilot-approval.json`. **Isso não é aprovação antecipada das 94 artes novas.** Elas estão produzidas e integradas, com `reviewStatus: "awaiting-approval"`; os seis pilotos têm `"approved"`. O estágio do catálogo é `catalog-awaiting-approval`, não `complete`.

Revisão offline: [100 temas](review-100/index.html). Alcance da inspeção local e limitações: [REVISAO-100.md](REVISAO-100.md). Instalação confirmada não equivale a aprovação visual, testes de interação no iPad ou sessão com a criança.
