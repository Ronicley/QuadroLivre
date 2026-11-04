# V1.2 — três modos e catálogo de 100 temas

## Estado da entrega

Aplicativo **1.2.0 (120)**, com Livre, Seguir contorno e Colorir implementados. O catálogo tem **100 temas em cada modo guiado**, totalizando 200 apresentações, além de Livre independente. São dez categorias com dez temas; complexidade: 40 simples, 40 intermediários e 20 cenas.

Build Release compilado, IPA validado e instalação confirmada pelo xtool (`Successfully installed!`), sem desinstalar. **Isso não comprova funcionamento visual/interativo no iPad.** Aprovação final das 94 artes novas, testes de caneta/palma, isolamento de quadros e medições reais de desempenho continuam pendentes.

- Seis pares V2 aprovados pelo responsável; autorização registrada: “ok, parece bom, pode fazer tbm os 100 temas”.
- Outros 94 temas produzidos, integrados e disponíveis para revisão, **não aprovados antecipadamente**.
- Manifesto: `Sources/QuadroLivre/Resources/catalog-v1.json`, schema interno V2, estágio `catalog-awaiting-approval`.
- O estágio `complete` exige exatamente 100 itens aprovados individualmente. Não mudar o estado para simular aceite.
- Revisão: [catálogo completo](Support/Illustrations/review-100/index.html).
- Registro do alcance da inspeção local: [revisão por lote](Support/Illustrations/REVISAO-100.md).
- Checklist de runtime e aceite: [TESTES-IPAD.md](TESTES-IPAD.md).

## Implementado

### Entrada e catálogo

- Escolha ilustrada Livre / Seguir contorno / Colorir ao entrar; opção de continuar quando há quadro anterior. Galeria e Novo desenho visíveis no canvas.
- Grade preguiçosa com miniaturas específicas de 240 × 240 px, dez categorias e Todos. Alta resolução carregada apenas para atividade selecionada. Voltar não cria quadro.
- Cache compartilhado limitado a 32 MiB/24 imagens, descartado em aviso de memória. Não representa medição do consumo total do aplicativo.
- Área dos responsáveis mostra quantidade de temas, estado de revisão e versão/build.

### Composição e ferramentas

- Livre: branco → tinta.
- Seguir contorno: branco → guia com opacidade inicial de 40% → tinta. Opacidade persistida; contraste ainda deve ser confirmado no aparelho.
- Colorir: branco → pintura → contornos protegidos. Pintura manual com larguras de 8/24/60 pontos; Livre/contorno mantêm 4/9/18 pontos.
- Borracha e histórico alteram apenas a tinta; não há balde, recorte por região ou impedimento de pintar fora da figura.
- Modelo e tinta compartilham coordenadas, zoom e deslocamento. Canvas, miniatura e exportação seguem a mesma política de camadas; exportação inclui tinta fora do modelo.
- Arco-íris permanece experimental e desligado por padrão, conforme V1.1.

### Persistência e compatibilidade

- Metadados V2 distinguem `free`, `trace` e `coloring`, com ID, versão, retângulo, opacidade e viewport. Snapshot atômico contém tinta + metadados; mover o quadro também agenda autosave.
- Fila serial e revisão de salvamento protegem contra conclusões antigas. Atualizar catálogo não migra nem regrava em massa os quadros.
- `.drawing` V1 continua Livre; `template` V1.1 conserva modelo escuro sob a tinta. Os seis modelos V1.1 e seis pares-piloto V1 permanecem no bundle.
- `ActivityCatalog.resolve(id:version:)` exige a revisão exata em atuais + arquivados. **Não faz fallback para arte mais recente.** Erros de manifesto, metadados ou assets impedem abertura/exportação/gravação incompletas e não sobrescrevem o original.

## Correções anteriores e limites da evidência

### Seletor

O responsável relatou cartões colados e alinhados à esquerda. A coluna mínima de 200 pontos não comportava imagem fixa de 200 + padding de 32. Foram corrigidos largura mínima, espaçamento, centralização, expansão do ScrollView e `VStack` explícito. Alertas externos não disputam apresentação com o seletor, que tem banner próprio. **Confirmar no iPad, inclusive janela estreita.**

### Isolamento de projetos

O responsável relatou que quadro novo parecia importar conteúdo anterior. Cada abertura/criação passou a receber uma PKCanvasView nova, histórico próprio e identidade SwiftUI por ID. Canvas anterior é desativado e perde o delegate; callbacks e reenquadramentos assíncronos de outro quadro são ignorados. A captura da viewport fica suspensa durante restauração.

Essas correções estão na versão instalada, mas não houve reprodução nem confirmação visual pelo assistente no aparelho. Não atribuir o relato apenas a cache ou afirmar corrupção persistida sem evidências. Executar a regressão A/B de `TESTES-IPAD.md` antes do aceite.

### Histórico da direção visual

As primeiras artes geométricas foram reprovadas. O responsável esclareceu que queria desenhos de contorno com proporções naturais, não fotografias. Um novo gato foi aprovado no navegador; depois os seis pares V2 e a produção dos demais temas foram autorizados. O histórico V1 permanece preservado, não aparece como coleção atual no seletor e não deve ser confundido com os pilotos V2 aprovados.

## Artes, fontes e revisão

Artes vetoriais originais elaboradas com assistência de IA, sem arquivos baixados, personagens licenciados ou ícones de sistema como páginas. Origem e condições por item no manifesto; detalhes em [ORIGEM-LICENCA.md](Support/Illustrations/ORIGEM-LICENCA.md).

- Fontes atuais: `Support/Illustrations/v2/<id>-v2-{trace,coloring}.svg`.
- Runtime: PNGs transparentes de 1536 × 1536 px; miniaturas específicas de 240 × 240 px em `Sources/QuadroLivre/Resources/`.
- SVGs fora do bundle; Cairo é ferramenta de produção, não dependência do aplicativo.
- Gerador: `scripts/make_full_catalog.py`, com módulos `catalog_*.py`; reutiliza os seis pilotos aprovados sem alteração.
- Revisão offline: índice + 100 detalhes HTML e dez folhas de contato (cinco lotes, dois modos). Links e imagens validados automaticamente.
- Foram inspecionadas localmente as dez folhas de contato e ampliações selecionadas, com correções antes da instalação. Isso **não equivale a inspeção ampliada individual das 200 apresentações**, aprovação humana final ou teste com criança.

### Preservação de revisões publicadas

- `review-natural-cat-v2/approval.json`: hashes da referência aprovada.
- `pilot-approval.json`: aprovação dos seis pares e autorização de produção; não aprova as outras 94 artes.
- `legacy-asset-sha256.json`: PNGs antigos.
- `v2-art-sha256.json`: fontes e runtime dos seis pilotos V2.
- `full-catalog-art-sha256.json`: 400 hashes, de 200 SVGs + 200 PNGs de runtime atuais.
- `catalog-100-release.json`: registro da entrega instalada.

**Não sobrescrever V2.** Correção artística após esta instalação exige nova `assetVersion` e arquivamento da revisão antiga. O gerador ainda fixa V2 e o validador contém invariantes desta entrega; ambos precisam de adaptação explícita antes de publicar V3. Não apagar registros nem contornar hashes. Miniaturas e prévias são derivados regeneráveis.

## Comandos de verificação

```bash
bash scripts/test.sh
xtool dev build --configuration release --ipa
python3 scripts/validate_ipa.py
```

Regeneração, quando necessária e respeitando os hashes publicados:

```bash
python3 scripts/make_full_catalog.py
```

Não usar `make_natural_pilots.py`, `make_pilots.py`, `make_natural_cat_sample.py` ou `make_templates.py` para atualizar a coleção de 100 temas. Os geradores de pilotos/amostra têm travas de preservação. `--revise-unshipped --freeze` está bloqueado após o registro da entrega instalada.

### Evidência automatizada da entrega

- **1.180 verificações Swift**: geometria, cores, arco-íris, compatibilidade, modos, composição declarada, contraste, viewport, round-trips das 200 atividades, manifesto e resolução exata de revisões.
- Validador Python: 424 PNGs atuais/arquivados, origem/fontes, hashes, CRC, dimensões, descompressão, alpha, margens, densidade, contraste uniforme, duplicatas e links das 101 páginas.
- Validação do IPA: 430 PNGs de desenho (400 atuais + 24 pilotos V1 + 6 modelos V1.1), além do ícone; manifesto empacotado idêntico ao fonte e versão/build conferidos.
- PNGs atuais: aproximadamente 17,03 MiB; pilotos V1: 0,89 MiB. IPA instalado: aproximadamente 20,07 MiB; arquivos descompactados: 19,94 MiB.
- Testes Linux **não executam UIKit/PencilKit**, não medem fluidez/memória real nem confirmam pixels da composição, histórico ou persistência real de PKDrawing.

## Instalação e próximos portões

A instalação registrada no handoff terminou com sucesso via xtool/Apple Devices no Windows, sem desinstalação. Não foi tentado lançamento automático nessa entrega; abrir pelo ícone. A rota de instalação e os cuidados de provisionamento estão em `README.md`. **Nunca desinstalar para atualizar: isso pode apagar os quadros locais.**

Próximos passos:

1. Responsável revisar os 94 novos temas por número/ID e registrar aprovações/correções; usar V3 para correções artísticas publicadas.
2. Executar regressão A/B, camadas, guia, exportação, zoom/pan, rotação, caneta WB/palma/dedo e compatibilidade V1/V1.1 no iPad.
3. Percorrer as dez categorias e alternar atividades; medir memória e fluidez no dispositivo, incluindo pressão de memória.
4. Conferir retrato, paisagem e janela estreita e acompanhar uso pela criança.
5. Somente registrar aceite final quando houver evidência real; build e instalação não substituem esses portões.
