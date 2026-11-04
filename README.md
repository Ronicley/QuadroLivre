# Quadro Livre

Quadro de desenho offline para crianças de 3 a 5 anos. SwiftUI + PencilKit, sem dependências externas no app. Nome provisório.

## Protótipo PWA paralelo

Versão web React em [`web/`](web/README.md), sem alterar o app Swift. Primeira etapa: um quadro livre, caneta/mouse, zoom, borracha, histórico, persistência local e instalação offline. Catálogo e migração de desenhos nativos não incluídos. Caneta, palma e desempenho ainda precisam de aceite no iPad. Instruções de execução, publicação HTTPS e checklist em [`web/README.md`](web/README.md).

Para integrar na Vercel, importe este repositório e configure **Root Directory: `web`**. Framework: Vite; build: `npm run build`; saída: `dist`; sem variáveis de ambiente. O diretório nativo e seus artefatos não são publicados. Detalhes em [`web/README.md`](web/README.md#publicar-na-vercel).

## V1.2 — três modos e 100 temas

- **1.2.0 (120)**: Livre, Seguir contorno e Colorir acessíveis ao entrar e pelo botão Novo desenho no canvas.
- **100 temas em cada modo guiado** (200 apresentações), dez categorias, com desenhos de contorno e proporções naturais. Livre permanece independente.
- Seis pares-piloto V2 aprovados; outras 94 artes produzidas e aguardando revisão final do responsável. Manifesto em `catalog-awaiting-approval`, não `complete`.
- Guia claro sob a tinta, contornos de colorir acima da pintura e espessura larga para pintura manual, sem balde.
- Manifesto versionado, miniaturas específicas, cache limitado e snapshot com modo, asset, contraste e posição. Compatibilidade V1/V1.1 e revisões antigas preservadas por ID + versão exatos.
- 1.180 verificações Swift e validador de catálogo aprovados; build Release e IPA validados. IPA com aproximadamente 20,07 MiB.
- Instalação confirmada no iPad via xtool, sem desinstalar. **Aparência, isolamento dos quadros, caneta/palma, camadas, fluidez e memória real ainda exigem teste no aparelho.**

Detalhes: [IMPLEMENTACAO-V1.2.md](IMPLEMENTACAO-V1.2.md). Revisão offline: [100 temas](Support/Illustrations/review-100/index.html). Alcance da revisão local: [registro por lote](Support/Illustrations/REVISAO-100.md). Aceite no dispositivo: [TESTES-IPAD.md](TESTES-IPAD.md).

Gerador atual: `python3 scripts/make_full_catalog.py`. Artes publicadas V2 são imutáveis: correções exigem versão nova e preservação da antiga. Não usar geradores históricos de pilotos para atualizar a coleção.

## V1.1 — histórico da implementação para validação

- Canvas amplo, controles flutuantes e dock compacto, sem faixas permanentes.
- Oito cores originais + três amostras extras persistentes, escolhidas em grade visual.
- Galeria oferece Livre/Com esboço, com seis modelos originais protegidos.
- Snapshots atômicos `.board` preservam tinta e vínculo do modelo; leitura de `.drawing` V1 mantida.
- Miniaturas e PNG compostos com modelo + tinta.
- Arco-íris **experimental, desligado por padrão**, habilitável por sessão na área dos responsáveis. Aguarda prova técnica real antes de liberação padrão.
- Build Release e 603 verificações automatizadas aprovados; instalado via xtool. Gestos, palma/WB, alinhamento e usabilidade com criança ainda pendentes.

Detalhes, limitações e checklist obrigatório: [IMPLEMENTACAO-V1.1.md](IMPLEMENTACAO-V1.1.md). Origem das artes: [Support/Templates/ORIGEM-LICENCA.md](Support/Templates/ORIGEM-LICENCA.md).

## Histórico da entrega V1

- Implementação compilada para iPadOS 17 ou superior com xtool.
- IPA de desenvolvimento assinado gerado em `xtool/QuadroLivre.ipa`.
- 76 verificações automatizadas de geometria aprovadas no Linux.
- Revisão por subagente Pi concluída; correções registradas em `REVISAO.md`.
- O Windows identifica o iPad conectado e o Apple Devices instalado.
- **Instalado no iPad via xtool**, após autorização para usar essa rota. Conexão feita pelo serviço do Apple Devices no Windows.
- Abertura automática retornou `DebugserverClient.Error.unknown`; abertura manual e testes funcionais continuam pendentes. Compatibilidade da WB, rejeição de palma, fluidez, persistência PencilKit e aparência real dependem do teste no aparelho.

## Uso

- A caneta desenha; o dedo não desenha no quadro.
- Oito cores + até três extras pela paleta, três espessuras (toque na canetinha já ativa), borracha e desfazer. Refazer, mover e responsáveis ficam em Mais opções.
- Dois dedos movimentam/ampliam o quadro. A mão ativa movimentação com um dedo, desabilitando o desenho até sair desse modo.
- O visor reenquadra a união de traços e modelo com margens para os controles. O quadro possui área de 16.384 × 16.384 pontos, não espaço infinito.
- O botão + abre a escolha de atividade; a galeria permite retornar aos desenhos existentes. Escolher outro modo cria um quadro após salvar o anterior.
- O cadeado abre um desafio aritmético para os responsáveis. Isso é uma barreira infantil, **não autenticação**.
- Exportação PNG de até 2.048 pixels e exclusão confirmada ficam na área dos responsáveis.

## Compilar

```bash
cd /caminho/para/QuadroLivre
bash scripts/test.sh
xtool dev build --configuration release --ipa
python3 scripts/validate_ipa.py
```

Requer SDK Darwin e autenticação/provisionamento do xtool. A assinatura de desenvolvimento depende do perfil provisionado; prazo de validade e renovação dependem da conta Apple. Não distribuir o IPA publicamente: ele contém o perfil de provisionamento.

## Instalação validada

O responsável autorizou instalação pelo xtool após esclarecermos que a documentação do Apple Devices não descreve instalação direta de IPA. O serviço do Apple Devices no Windows fornece a conexão USB, acessada pelo xtool no WSL via `USBMUXD_SOCKET_ADDRESS=<gateway-do-Windows>:27015`. Descubra o gateway com `ip route`; pode mudar após reiniciar o WSL. Não foi alterada a configuração de rede ou firewall. Endereços locais e identificadores do aparelho foram omitidos da documentação pública.

**Nesta versão do xtool, entregar um IPA já assinado ao comando install tentou provisionar outro identificador e encontrou o limite de App IDs.** Gerar um pacote sem assinatura prévia e deixar install provisionar/assinar reutilizou corretamente o App ID existente. A instalação terminou com `Successfully installed!`.

Para reinstalar, descobrir o gateway com `ip route`, localizar o iPad com `xtool devices --no-wait` usando a variável de conexão e executar:

```bash
xtool dev build --configuration release --ipa
USBMUXD_SOCKET_ADDRESS=<gateway>:27015 xtool install --udid <udid-do-ipad> xtool/QuadroLivre.ipa
```

O artefato atual é `xtool/QuadroLivre.ipa`, versão 1.2.0 (120). `xtool/QuadroLivre-install.ipa` é um artefato histórico V1, **não usar para atualizar a V1.2**. O build sobrescreve `QuadroLivre.ipa`; executar `python3 scripts/validate_ipa.py` antes de instalar. Gerar sem `--sign` e deixar `install` provisionar/assinar. Não distribuir publicamente o pacote provisionado e não desinstalar o aplicativo para atualizar.

O lançamento automático falhou com `DebugserverClient.Error.unknown`; abrir manualmente pelo ícone. Não arrastar o IPA para a seção Arquivos do Apple Devices: transferir um arquivo não equivale a instalar um aplicativo.

Referência: https://support.apple.com/guide/devices-windows/transfer-files-between-your-windows-device-and-iphone-ipad-or-ipod-touch-mchl4bd77d3a/windows

## Testes automatizados

```bash
bash scripts/test.sh
```

Os testes cobrem geometria, margens, exportação, cores extras, metadados, viewport, arco-íris, compatibilidade e round-trips das 200 atividades. O validador Python verifica assets, fontes, hashes de preservação e links de revisão. Não executam UIKit/PencilKit no Linux. Veja `IMPLEMENTACAO-V1.2.md` e `TESTES-IPAD.md` para os limites da evidência e a validação obrigatória de runtime.

## Arquitetura

- `CanvasModel.swift`: estado, ferramentas, histórico, quadro ativo e coordenação de salvamento.
- `CanvasView.swift`: ponte PencilKit/SwiftUI e eventos do desenho.
- `DrawingStore.swift`: desenhos editáveis atômicos, miniaturas e PNG.
- `BoardGeometry.swift`: geometria pura testável no Linux.
- `DrawingScreen.swift`: superfície e controles infantis.
- `GalleryView.swift`: galeria local.
- `ParentsView.swift`: barreira infantil, exportação e exclusão.
- `SaveErrorBanner.swift`: erros visíveis dentro de telas modais.

## Persistência e segurança dos dados

Os arquivos editáveis novos ficam em `Documents/Quadros/<UUID>.board`: envelope binário versionado com dados PencilKit e metadados, gravado atomicamente. Miniaturas `<UUID>.png` são regeneráveis. Arquivos V1 `<UUID>.drawing` continuam legíveis e são preservados ao migrar; a galeria prioriza o snapshot sem duplicação. Snapshot presente mas corrompido nunca é tratado como legado/livre. O último quadro e cores extras são lembrados em UserDefaults.

O autosave usa uma fila serial de background e snapshots do PKDrawing, após 600 ms sem alterações. Ao trocar de quadro, exportar ou sair de primeiro plano, a aplicação aguarda a gravação pendente. Número de revisão evita que conclusões antigas alterem o estado de outro quadro. Quadros ilegíveis não são sobrescritos automaticamente.

Apagar o aplicativo pode apagar os desenhos. Backups são responsabilidade do usuário/sistema. O compartilhamento de arquivos está habilitado para preservar os arquivos editáveis no Apple Devices; não há restauração/importação assistida na interface desta V1.

Dados não são enviados automaticamente. Backups do sistema e destinos de compartilhamento escolhidos pelo responsável são externos ao app. O manifesto de privacidade declara uso local de UserDefaults e datas dos arquivos.

## Ícone

Arte original gerada com biblioteca padrão Python:

```bash
python3 scripts/make_icon.py
```

## Escopo

Ver `PLANO-V1.md`, `PLANO-V1.1.md` e `PLANO-V1.2.md`. Há modelos protegidos com ordem de composição específica para cada atividade, mas não camadas editáveis. Sem balde de tinta, adesivos, anúncios, contas, compras, nuvem ou importação de fotos/PDFs.
