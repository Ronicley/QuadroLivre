# Handoff — Quadro Livre V1.2 / catálogo de 100 temas

## 1. Pedido e estado atual

O responsável pediu a implementação de `PLANO-V1.2.md`, reprovou as primeiras artes geométricas e esclareceu que deseja **desenhos de contorno com proporções naturais**, não fotografias. Aprovou um novo gato no navegador, depois os seis pares-piloto e autorizou explicitamente:

> “ok, parece bom, pode fazer tbm os 100 temas”

**Os 100 temas foram produzidos, integrados, compilados e instalados no iPad nesta sessão.** São 100 escolhas em Seguir contorno e as mesmas 100 em Colorir, não 50 para cada modo. Livre continua independente.

Pedido que originou este registro: **“faz um handoff”**. Na continuação, o usuário pediu **“QuadroLivre/HANDOFF.md. continue a implementação”**. A documentação e o roteiro de aceite foram consolidados conforme a seção 10; não se pressupõe aprovação final das 94 artes novas.

## 2. Entrega instalada e validação confirmada

- Aplicativo: **1.2.0, build 120**; identificador `com.ronicley.quadrolivre`.
- Build: `xtool dev build --configuration release --ipa` — sucesso.
- Testes: `bash scripts/test.sh` — **1.180 verificações Swift passaram**, além do validador Python.
- IPA: `python3 scripts/validate_ipa.py` — sucesso; confirma os arquivos realmente empacotados e versão/build, não apenas a pasta-fonte.
- Instalação via fluxo xtool já autorizado, **sem desinstalar**: resultado final **`Successfully installed!`**, incluindo etapa Verifying 100%.
- IPA: `xtool/QuadroLivre.ipa`, aproximadamente **20,07 MiB**; arquivos descompactados aproximadamente **19,94 MiB**.
- PNGs atuais V2: aproximadamente **17,03 MiB**; PNGs dos seis pares V1 arquivados: **0,89 MiB**.
- IPA contém **430 PNGs de desenho**: 400 atuais, 24 dos pilotos V1 arquivados, 6 modelos V1.1. Mais o ícone do app, totalizando 431 PNGs no pacote.
- Registros: `Support/Illustrations/catalog-100-release.json`, `full-catalog-art-sha256.json`.
- Logs desta sessão, temporários fora do projeto:
  - `/tmp/quadrolivre-100-build.log`
  - `/tmp/quadrolivre-100-install.log`

**Não foi realizada validação visual/interativa do app pelo assistente no iPad.** Build e instalação não comprovam fluidez, memória real, rejeição de palma, correção do seletor ou isolamento visual entre quadros. A aprovação final das 100 ilustrações pelo responsável também não aconteceu ainda.

## 3. Revisão no navegador

Página atual:

`Support/Illustrations/review-100/index.html`

- Dez categorias, dez temas em cada.
- Miniaturas carregadas preguiçosamente; tocar num tema abre uma página com as duas apresentações em resolução maior.
- São 101 páginas HTML locais: índice + 100 detalhes; links e imagens validados automaticamente.
- Há dez folhas de contato: `batch-{1...5}-{trace,coloring}.png`, vinte temas por lote.
- O índice já foi enviado ao navegador padrão do Windows usando PowerShell `Start-Process` com caminho convertido por `wslpath -w`.
- Não depende de servidor ou download.

Revisão local realizada pelo assistente: inspeção das cinco folhas de Colorir e das cinco de Seguir contorno, além de ampliações selecionadas. Isso **não equivale a inspeção ampliada individual de todas as 200 apresentações nem à aprovação final do responsável**.

Correções feitas antes da instalação: gato do jardim em pose caminhando, panda com composição própria em vez de duplicar o urso, segundo amigo na cena da pipa e fio sem atravessar seu rosto, barco a remo no lago em vez de repetir o veleiro, toldo sem atravessar as orelhas do coelho, linhas de carroceria/rodas e junções sobrepostas. Ainda podem surgir refinamentos artísticos na revisão do responsável.

## 4. Catálogo, fontes e produção

Manifesto no bundle:

`Sources/QuadroLivre/Resources/catalog-v1.json`

Apesar do nome histórico do arquivo, seu **schema interno é V2**.

- `stage: "catalog-awaiting-approval"`.
- `items`: exatamente 100 temas atuais, números 1–100, IDs únicos.
- `archivedItems`: seis versões V1 dos primeiros pilotos, necessárias para quadros antigos.
- Temas atuais usam `assetVersion: 2`.
- Dez categorias A–J com dez temas cada.
- Complexidade: **40 simples / 40 intermediários / 20 cenas**.
- Cada tema contém título, categoria, complexidade, proporção, versão, autoria/origem, condições de uso e links separados de runtime/thumbnail para `trace` e `coloring`.
- Seis pilotos com `reviewStatus: "approved"`; outras 94 artes com `"awaiting-approval"`.
- `complete` só passa na validação com 100 itens aprovados individualmente. Não mudar o status para simular uma aprovação ainda não recebida.

Fontes editáveis atuais: `Support/Illustrations/v2/<id>-v2-{trace,coloring}.svg`.

Runtime: PNGs transparentes de 1536 × 1536 e thumbnails específicos de 240 × 240 em `Sources/QuadroLivre/Resources/`. SVGs ficam fora do bundle; não foi adicionado renderizador SVG ao app.

### Gerador atual

```bash
python3 scripts/make_full_catalog.py
```

- Reproduz as 94 novas artes e reutiliza **sem alterar** os seis pilotos V2 aprovados.
- Preserva manifesto-piloto original em `Support/Illustrations/catalog-v2-pilot.json`.
- Gera as páginas e folhas de revisão.
- A primeira trava dos assets foi produzida com `--freeze`.
- `--revise-unshipped --freeze` foi usado durante correções locais **antes da instalação**. Agora há `catalog-100-release.json`: esse modo está bloqueado. **Não apagar o registro para modificar artes já publicadas.**

Módulos novos de autoria vetorial:

- `scripts/catalog_shapes.py`: vocabulário de curvas/formas e registro dos temas.
- `scripts/catalog_animals.py`: A/B.
- `scripts/catalog_nature.py`: C.
- `scripts/catalog_play.py`: D/E.
- `scripts/catalog_adventures.py`: F.
- `scripts/catalog_cozy.py`: G.
- `scripts/catalog_travel.py`: H.
- `scripts/catalog_fantasy.py`: I.
- `scripts/catalog_food.py`: J.

São **94 definições novas**, mais seis pilotos nos números **1, 32, 41, 51, 63 e 71**. Personagens e pequenos motivos vetoriais próprios podem ser compartilhados entre cenas; não há artes baixadas, personagens licenciados, ícones de sistema usados como páginas ou rede no runtime.

`vector_art.py` rasteriza curvas com Cairo via ctypes no ambiente de desenvolvimento. Não é dependência do aplicativo. Aplica opacidade à camada pronta, evitando junções de contorno escurecidas por alpha acumulado.

### Geradores históricos — não usar para atualizar a coleção

- `make_natural_pilots.py`: agora recusa sobrescrever um catálogo que tenha mais de seis temas.
- `make_pilots.py`: recusa sobrescrever o schema V2.
- `make_natural_cat_sample.py`: bloqueia regeneração da referência aprovada.
- `make_templates.py`: é histórico V1.1; não alterar os modelos antigos.

## 5. Preservação e versões — cuidados críticos

**Nunca substituir silenciosamente uma ilustração usada por quadro salvo.**

- `ActivityCatalog.resolve(id:version:)` procura a versão exata em atuais + arquivados; não faz fallback para a arte mais recente.
- V1 `.drawing` continua Livre; V1.1 `kind: "template"` conserva modelo escuro sob a tinta.
- Pilotos V1 conservam seus PNGs e IDs em `archivedItems`.
- Seis pilotos V2 aprovados também conservaram fontes e imagens byte a byte.
- Referência aprovada do gato: `review-natural-cat-v2/approval.json` tem hashes dos dois SVGs; runtime usa ID estável `cat-seated`.
- `pilot-approval.json` registra a autorização dos seis pares e da produção dos 100, **não a aprovação antecipada das 94 novas artes**.
- `legacy-asset-sha256.json`: preservação dos PNGs antigos.
- `v2-art-sha256.json`: preservação das fontes e imagens de runtime dos seis pilotos V2.
- `full-catalog-art-sha256.json`: **400 hashes**, correspondentes a 200 fontes SVG + 200 PNGs de runtime atuais.
- Thumbnails e prévias são derivados regeneráveis; geometria e imagens de runtime publicadas são imutáveis.

**Se forem necessárias correções artísticas agora:** criar assetVersion 3 para os temas afetados, preservar a versão 2 e adicioná-la às revisões arquivadas. O gerador atual ainda fixa versão 2, e o validador tem invariantes próprios desta entrega (por exemplo, arquivo de hashes com 400 entradas). Adaptar gerador, arquivo de arquivo/manifesto e testes de forma explícita antes de produzir novas revisões; não contornar os hashes nem sobrescrever V2.

Não remover o app do iPad para atualizar. Os quadros editáveis são arquivos locais; desinstalar pode apagá-los.

## 6. Aplicativo e correções de bugs anteriores

Código relevante:

- `ActivityCatalog.swift`: schema, números, categorias, complexidade, revisão e resolução exata.
- `BoardDocument.swift`: resolvedor de assets e cache limitado a 32 MiB / 24 imagens, descartado em aviso de memória.
- `BoardMetadata.swift`: metadados versionados `free`, `trace`, `coloring`, suporte legado e viewport.
- `CanvasModel.swift`, `CanvasView.swift`, `DrawingScreen.swift`: canvas/PencilKit, salvamento, camadas e navegação.
- `NewBoardView.swift`: escolha ilustrada, categorias e grade preguiçosa de 100 miniaturas.
- `ParentsView.swift`: mostra quantidade de temas, estado de revisão e versão/build; mantém ferramentas anteriores.
- `Support/Info.plist`: atualizado para 1.2.0 (120).

Composição: Livre = branco → tinta; Seguir contorno = branco → guia 40% → tinta; Colorir = branco → pintura → contornos protegidos. Modelo e tinta usam as mesmas coordenadas de zoom/pan. Exportação e miniatura seguem a mesma política. Pintura manual, sem balde ou recorte por região.

### Relatos anteriores do responsável

1. **Seletor com cartões colados/alinhados à esquerda**: corrigidas coluna mínima incompatível com conteúdo/padding, espaçamento e centralização; `VStack` explícito dentro do ScrollView; alertas externos não disputam apresentação com o seletor.
2. **Quadro novo parecia importar conteúdo do anterior**: cada projeto passou a ter uma PKCanvasView nova e histórico próprio; identidade SwiftUI por ID do quadro; canvas antigo desativado e sem delegate; callbacks/reenquadramentos de outro quadro ignorados; captura da viewport suspensa durante restauração.

Essas correções estão na versão instalada, mas o assistente **não reproduziu nem confirmou visualmente a resolução no aparelho**. Não afirmar que a causa era só cache ou que havia corrupção persistida sem evidências.

Autosave mantém fila serial, snapshot atômico de metadados+tinta e revisão contra conclusões antigas. Atualizar o catálogo não migra em massa nem regrava os quadros.

## 7. Comandos de verificação e instalação

```bash
cd /caminho/para/QuadroLivre
bash scripts/test.sh
xtool dev build --configuration release --ipa
python3 scripts/validate_ipa.py
```

O teste Swift Linux cobre geometria, preferências, metadados, versões, validação e round-trips das 200 atividades. Não executa UIKit/PencilKit.

O validador Python cobre 424 PNGs atuais/arquivados, CRC, dimensões, descompressão, alpha real, contraste uniforme, densidade não vazia, margens, hashes, fontes e links das 101 páginas de revisão. Os seis modelos V1.1 adicionais são preservados por hashes e pela validação do IPA.

Instalação autorizada pelo xtool usando Apple Devices no Windows / WSL:

```bash
# Conferir o gateway com ip route; pode mudar ao reiniciar WSL.
USBMUXD_SOCKET_ADDRESS="<gateway-do-Windows>:27015" xtool devices --no-wait
USBMUXD_SOCKET_ADDRESS="<gateway-do-Windows>:27015" xtool install \
  --udid "<udid-do-ipad>" xtool/QuadroLivre.ipa
```

Dispositivo detectado: iPad do responsável, USB. Gateway e UDID foram omitidos da documentação pública. Usar IPA gerado **sem `--sign`** e deixar `install` provisionar/assinar; a rota histórica de entregar um IPA previamente assinado já encontrou problemas de App IDs. Não mudar rede/firewall. Não distribuir publicamente o IPA provisionado.

O lançamento automático já falhou em sessões anteriores com `DebugserverClient.Error.unknown`. Nesta entrega não se tentou lançamento automático; abrir manualmente pelo ícone.

## 8. Pendências reais / próximos passos

1. Responsável revisar a coleção nova no navegador ou iPad; registrar correções por número/ID. Não considerar aprovação dos pilotos como aprovação final dos 100.
2. Testar no iPad a regressão dos projetos: desenhar em A → Novo Livre totalmente branco, undo/redo vazios → desenhar B → reabrir A e B, fechar/reabrir app e conferir exportações separadas.
3. Confirmar guia visível no canvas, pintura sob os contornos, borracha/undo, zoom/pan/rotação e caneta WB/palma/dedo.
4. Percorrer as dez categorias e alternar entre vários temas; medir fluidez, pico de memória e comportamento em pressão de memória. Nenhuma medição real disso foi obtida nesta sessão.
5. Conferir retrato, paisagem e janela estreita, inclusive o seletor de atividade.
6. Revisar com a criança interesse, reconhecimento e adequação das áreas de pintura.
7. **Concluído na continuação:** `README.md`, `IMPLEMENTACAO-V1.2.md`, `PLANO-V1.2.md` e `Support/Illustrations/ORIGEM-LICENCA.md` atualizados para os 100 temas, com distinção entre instalação, aprovação artística e aceite no aparelho.
8. **Concluído na continuação:** revisão local por lote consolidada em `Support/Illustrations/REVISAO-100.md`, com alcance e limitações do handoff, sem alegar nova inspeção ou aprovação humana.

## 9. Ambiente

- Projeto: diretório local `QuadroLivre`; caminho pessoal omitido.
- À época deste handoff, não havia repositório Git detectado nesse diretório ou nos pais. A publicação posterior no GitHub inclui o protótipo PWA em `web/`, sem artefatos de assinatura ou builds locais.
- Swift/xtool funcionais no WSL, SDK iOS configurado.
- Cairo disponível no Linux; sem dependências Python externas instaladas para a produção das artes.
- `scripts/__pycache__/` foi gerado pelos imports Python. Pode ser removido/ignorado como cache; não é asset do app.
- Nenhuma conta, serviço online, balde de tinta ou pacote de personagens de franquias foi introduzido.

## 10. Continuação — documentação e preparação do aceite

- Atualizados os quatro documentos gerais indicados na seção 8 para refletir 100 temas / 200 apresentações, seis pares aprovados e 94 aguardando aprovação.
- Criado `Support/Illustrations/REVISAO-100.md` com os cinco lotes, inspeção anterior de dez folhas de contato, correções registradas e limites da evidência. Não houve nova inspeção visual nesta continuação.
- Ampliado `TESTES-IPAD.md` com ficha de sessão, regressão A/B, catálogo/camadas, preservação de versões e roteiro de medição real. Nenhum teste manual foi marcado como aprovado.
- README agora indica o build sem `--sign`, validação do IPA e alerta de que `QuadroLivre-install.ipa` é histórico V1, não o pacote atual.
- Verificações executadas novamente: `bash scripts/test.sh` — 1.180 verificações Swift e validador Python aprovados; `python3 scripts/validate_ipa.py` — 430 PNGs de desenho, versão 1.2.0 (120), 20,07 MiB, aprovado.
- Nenhum código Swift, arte, manifesto, status de aprovação ou IPA foi alterado; não houve novo build nem reinstalação, pois as mudanças foram documentais.
- Próximo passo efetivo: revisão do responsável e execução dos testes no iPad, itens 1–6 da seção 8. Se houver correção artística, implementar suporte explícito à nova revisão antes de produzir V3.
