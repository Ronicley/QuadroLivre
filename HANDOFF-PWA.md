# Handoff — continuação do PWA Quadro Livre

## Implementado — instrumentos de desenho

- Canetinha original preservada; adicionados Caneta, Lápis e Giz de cera, com traços distintos e seletor de quatro opções no lugar do botão anterior. Sem aumentar dock, novas dependências ou alterações no app Swift/catálogo.
- `stroke.tool` mantém `pen`/`eraser` e aceita `ballpoint`/`pencil`/`crayon`. Banco, IDs e versões V1/V2 não mudam; não há regravação em massa. Canetinha e borracha antigas têm pixels idênticos ao renderer anterior. Instrumentos desconhecidos bloqueiam leitura/restauração/render, sem fallback. Rollback antigo rejeita quadros com os novos instrumentos; detalhes em `web/MIGRATION.md`.
- Lápis e giz usam grão determinístico em coordenadas do quadro e preenchimento único por traço, evitando acúmulo de opacidade nas junções. Editor, miniaturas e PNG compartilham renderer. Cor/espessura mantêm instrumento escolhido; mão retorna a ele. Todos os instrumentos funcionam em Livre, Seguir contorno e Colorir, com pressão, histórico e borracha somente na tinta.
- Validação: build de produção, **21 testes unitários e 22 cenários Chromium aprovados**. Inclui comparação de pixels legados, instrumentos/pressão/larguras, textura/pan/zoom/traço ativo, miniaturas/PNG, salvamento por quadro, recarga offline, backup/restauração, desconhecidos, camadas guiadas e cinco tamanhos. Capturas em `.impeccable/review/instruments-*.png`.
- Revisão visual dos cinco tamanhos concluída. Detector apontou somente avisos de literais herdados fora do escopo; sem novos achados bloqueantes. Teste físico dos instrumentos e desempenho no iPad/Safari permanecem pendentes. Sem commit, push ou deploy. Fazer backups JSON antes da atualização e manter origem/dados do site.

### Pedido recebido e critérios de aceite

Pedido do responsável: **“adicione mais opções de lapis, como giz de cera, canera lapis etc, faz isso em uma sessão nova”**. Interpretado como adicionar giz de cera, caneta e lápis, preservando a canetinha existente. Entrega registrada acima; requisitos originais mantidos abaixo como referência.

### Entrega esperada

- Escolha acessível entre canetinha atual, caneta, lápis e giz de cera, com aparência de traço realmente distinta, não apenas nomes diferentes para o mesmo renderer. Manter cores rápidas/personalizadas, três espessuras, pressão quando disponível, borracha, mão e histórico.
- Preservar desenhos existentes, seus pixels/traços, pressão, cores, borracha, câmera, modelos e IDs. Traços antigos sem informação de instrumento devem manter exatamente o comportamento da canetinha atual; não regravar todos os quadros ou apagar armazenamento para acrescentar pincéis.
- Cada traço deve conservar seu instrumento após trocar de ferramenta, quadro, recarregar, exportar/restaurar backup e gerar PNG. Evoluir e validar metadados com compatibilidade explícita, antes de alterar persistência. Não reinterpretar silenciosamente um instrumento desconhecido como outro.
- Composição do editor, miniaturas e PNG deve usar o mesmo desenho de traço. Giz/lápis podem ter textura, mas ela deve ser determinística e estável em coordenadas do quadro: não sortear aparência novamente em cada frame, zoom ou exportação.
- Usar os mesmos instrumentos nos modos Livre, Seguir contorno e Colorir. Guia a 40% sob tinta; contornos de colorir acima. Borracha continua apagando somente tinta, nunca ilustração.
- Manter alvos grandes e layout utilizável em iPad, celular estreito e paisagem. Não simplesmente acrescentar botões até o dock cobrir canvas/paleta; decidir agrupamento mínimo compatível com interface existente. Não redesenhar aplicativo ou instalar biblioteca de pincéis sem necessidade demonstrada.
- Sem novas artes, modos, nuvem, fotos/PDFs, balde, arco-íris, mudança de domínio ou alterações no app Swift. “Etc.” não autoriza catálogo ilimitado de instrumentos; começar pelos três explicitamente pedidos.

### Código e provas a alcançar

- Ler `web/src/{App.jsx,DrawingCanvas.jsx,model.mjs,render.mjs,Gallery.jsx,useBoard.js,store.mjs}` e seus chamadores. `drawStroke` em `render.mjs` é compartilhado com editor, miniaturas e PNG; `DrawingCanvas.jsx` captura traços; `model.mjs` valida dados e mantém histórico. Não quebrar composição/caches ao introduzir textura ou transparência.
- Cobrir com testes: traços legados idênticos; instrumentos novos distintos; pressão e espessura; estabilidade de textura; borracha e desfazer/refazer; persistência por traço e quadro; backup/restauração; PNG; camadas dos modos guiados e layout nos cinco tamanhos já testados.
- Estado atual antes dos pincéis: build de produção, **20 testes unitários e 18 cenários Chromium aprovados**, além do validador de catálogo. Nenhuma dessas provas valida instrumentos ainda inexistentes ou o seletor nativo de cores no iPad físico.
- Há muitas alterações locais desta conversa **não commitadas/não enviadas**, incluindo `web/catalog/`, galeria, modos, operações dos responsáveis e paleta. Consultar `git status`; preservar esse trabalho. Não criar worktree a partir de `main` e presumir que terá essas alterações locais. Commit/push/deploy não solicitados.
- Preview local vinha rodando em `http://localhost:4173`; confirmar processo/build na nova sessão. Service worker pode mostrar versão antiga: aguardar “Salvo neste aparelho”, então recarga forçada no computador ou fechar todos os clientes e reabrir, sem limpar dados do site/IndexedDB. Manter mesma origem e orientar backup antes de mudanças de formato.
- Ambiente WSL: usar Node/npm Linux em `~/.nvm/versions/node/v22.22.3/bin/`. Chromium desta máquina usa bibliotecas em `~/.local/playwright-libs/usr/lib/x86_64-linux-gnu` via `LD_LIBRARY_PATH`. Comandos e contexto de publicação seguem abaixo e em `web/README.md`.

Prompt para iniciar: **“Leia HANDOFF-PWA.md e implemente a seção ‘Próxima sessão — instrumentos de desenho’: giz de cera, caneta e lápis, preservando desenhos e funcionalidades existentes.”**

## Paleta ampliada

- Pedido posterior: mais cores e seleção de qualquer cor. Paleta agora tem 16 amostras e “Outra cor”, com `input type="color"` nativo RGB. Mantém cores antigas, adiciona branco/cinza/marrom/tons claros e volta à canetinha ao escolher. Não adiciona dependências, não altera armazenamento nem desenhos anteriores.
- Paleta mantém largura e alvos existentes, com rolagem em telas baixas. Branco tem borda visível e cores claras usam check escuro. Regressão verifica cor personalizada nos traços, JSON e recarga, mais cinco tamanhos de tela.
- Build, 20 testes unitários e 18 cenários Chromium aprovados. Interface do seletor nativo no Safari/iPad ainda precisa de teste físico. Preview continua em `http://localhost:4173`.
- Revisão final: **ship**, sem achados materiais. Capturas em `.impeccable/review/colors-{desktop,tablet,mobile,narrow,landscape}.png`. Prosa de `web/DESIGN.md` atualizada para a paleta ampliada; frontmatter e `web/.impeccable/design.json` preservados, pois cores de desenho não são tokens da marca.

## Continuação seguinte — funções restantes

- Após testar a galeria no navegador, responsável pediu continuar funções restantes. Implementados Livre, Seguir contorno e Colorir, com escolha de atividade e categoria, 100 temas por modo guiado e aviso de revisão artística pendente.
- `web/catalog/` contém 424 PNGs idênticos aos recursos nativos referenciados (atuais e seis revisões arquivadas), manifesto, hashes e origem. `web/scripts/sync-catalog.mjs` só copia; não regenera artes nem muda arquivos nativos. Vercel pode construir usando apenas `web`.
- Guiados usam documento V2, ID + versão exatos e retângulo compartilhado com tinta. V1 livre continua intacto. Compositor mantém guia a 40% sob tinta e contornos de colorir acima; borracha não apaga modelo. Miniaturas, reenquadramento e PNG incluem composição.
- Responsáveis podem restaurar JSON web V1/V2 até 50 MiB como outro quadro editável, sem substituir dados, e excluir um quadro mediante confirmação. Índice V2 mantém números estáveis, aceita galeria vazia e não reutiliza `current` excluído. Plano/limites de rollback em `web/MIGRATION.md`.
- Acrescentados testes de catálogo/hashes, backups, camadas e borracha por pixels, modelos ausentes, versão antiga, restauração e exclusão cancelada/abortada/confirmada. Nenhum teste usa perfil pessoal do navegador.
- Validação desta etapa: build de produção, 19 testes unitários e 17 cenários Chromium aprovados. Preview existente em `http://localhost:4173` responde 200 com bundle atual. Catálogo ocupa cerca de 19 MiB em disco; build completo, cerca de 20 MiB. A primeira preparação offline ficou maior.
- Validador nativo do catálogo também passou: 100 pares atuais, seis arquivados, 424 PNGs transparentes, 100 páginas de revisão e hashes bloqueados. Isso não executa UIKit/PencilKit nem aprova artisticamente os 94 temas pendentes.
- Revisão final desta etapa: **ship**, sem achados materiais restantes. A dupla aplicação de transparência nas miniaturas de Seguir contorno foi corrigida e considerada resolvida pelo revisor. `web/DESIGN.md` e seu sidecar foram preservados; esta extensão mantém o sistema visual existente.
- Recursos nativos, fontes SVG e registros de aprovação permanecem inalterados. Sem nuvem, login, balde, renomeação ou conversão PencilKit. Teste físico desta etapa no iPad e publicação continuam pendentes.

## Continuação implementada — galeria e múltiplos quadros

- Responsável escolheu **galeria ao iniciar**. “Novo desenho”, miniaturas locais e reabertura implementados; editor mantém controles existentes e oferece “Meus desenhos”.
- Banco e documentos V1 preservados. `current` continua sendo primeiro desenho; índice `gallery` registra IDs; demais quadros usam `board:<UUID>`. Nada é excluído ou convertido. Plano de compatibilidade/rollback em `web/MIGRATION.md`.
- Criação atômica, troca condicionada ao salvamento, histórico e câmera independentes. Falha mantém tinta em memória para nova tentativa/backup; quadros inválidos não são substituídos.
- Regressões acrescentadas em `web/tests/browser.mjs`, com fixture `web/tests/fixtures/board-v1.json`. Cobrem preservação exata, migração idempotente/abortada, aborto de criação sem órfãos, miniaturas com borracha, histórico isolado e múltiplos quadros offline.
- Verificação desta continuação: build de produção, 14 testes unitários e 13 cenários Chromium aprovados; cinco tamanhos de tela, incluindo erro de criação em 320 px. No ambiente WSL desta sessão, Node 22 fica em `~/.nvm/versions/node/v22.22.3/bin/`; bibliotecas do Chromium em `~/.local/playwright-libs/usr/lib/x86_64-linux-gnu` foram usadas via `LD_LIBRARY_PATH`, sem instalar pacotes globais.
- Revisão final independente: **ship**, sem achados materiais; proteção adicional contra índice esparso também revisada e testada. Conferência visual/documental preservou `DESIGN.md` e sidecar; citações de linhas antigas e alguns literais herdados continuam sem ajuste, fora do escopo.
- Sem exclusão, restauração, novos modos, alterações no catálogo ou app Swift. Ainda requer validação desta etapa no iPad físico. Publicação/commit não autorizados nesta continuação.

As seções abaixo registram o estado anterior à continuação; referências a “um quadro” e à galeria como próximo passo são históricas.

## Pedido atual e aceite

Após testar no iPad, o responsável informou: **“Funcionou perfeitamente no ipad, vamos continuar o restante numa sessão limpa”**.

O protótipo web foi aceito pelo usuário em uso real. Não reiniciar a prova de conceito nem substituir sua arquitetura. O relato não especifica modelo de caneta, versão do iPadOS, medições, modo avião ou quais itens do checklist foram executados. Não inventar esses resultados nem presumir aprovação artística do catálogo.

Esta sessão terminou preparando este documento, sem implementar a próxima etapa.

## Git e publicação

- Repositório público: https://github.com/Ronicley/QuadroLivre.
- Branch: `main`; último commit publicado nesta sessão: `ae883c88eaa5d58e78d448e3776846efeab58b6e` (`feat: add Quadro Livre with offline React PWA`).
- Vercel: importar repositório com **Root Directory = `web`**, framework Vite, build `npm run build`, saída `dist`. Sem variáveis de ambiente.
- `web/vercel.json` já configura build e revalidação de `sw.js`.
- O assistente enviou o GitHub, mas não executou o deploy na Vercel. O usuário depois confirmou funcionamento no iPad; a URL usada não foi informada.
- Não publicar IPAs, perfis Apple, credenciais, builds locais ou desenhos pessoais. `.gitignore` já protege artefatos comuns; documentação publicada teve UDID e caminhos pessoais removidos. Commit usa e-mail noreply do GitHub.
- Consultar `git status` antes de editar: este handoff e seu link no README são alterações locais posteriores ao commit acima, ainda não commitadas nem enviadas.

## Implementação existente

O app SwiftUI/PencilKit continua intacto. O PWA paralelo fica em `web/`, com React 19, Vite 8, JavaScript, Canvas, Pointer Events e IndexedDB. Não há backend ou conta de usuário.

Já funciona:

- Um quadro livre, caneta e mouse; dedo nunca cria tinta.
- Oito cores, três espessuras, borracha, desfazer/refazer.
- Dois dedos para pan/zoom, modo mão, reenquadrar e atalhos de teclado.
- Pressão de caneta quando o navegador fornece essa informação.
- Persistência local: traços gravados imediatamente ao concluir; viewport após 400 ms; sucesso só após concluir a transação.
- Proteção contra edição simultânea em outra aba usando Web Locks.
- Documento inválido bloqueia edição e não é substituído silenciosamente por quadro vazio.
- Erros de gravação visíveis, com nova tentativa e exportação do desenho ainda em memória.
- Área dos responsáveis com soma (barreira infantil, não autenticação), PNG até 2048 px e backup JSON dos traços.
- Manifesto, ícones e service worker gerado a partir do build. Offline após o primeiro carregamento completo em HTTPS. Atualizações aguardam fechar os clientes antigos; nunca forçam recarga durante o desenho.
- Layout verificado em desktop, tablet, celular, janela estreita e paisagem.

## Arquivos centrais

- `web/src/App.jsx`: controles, paleta, responsáveis, exportações e estado offline.
- `web/src/DrawingCanvas.jsx`: entrada de caneta/mouse/toque, gestos e cancelamento de traços.
- `web/src/model.mjs`: schema V1, validação, histórico e geometria.
- `web/src/useBoard.js`: carregamento, estado, autosave e bloqueio de edição.
- `web/src/store.mjs`: IndexedDB `quadro-livre-pwa`, versão 1, object store `boards`, chave **`current`**. Existe um documento, não uma galeria.
- `web/src/render.mjs`: composição compartilhada entre canvas e PNG; borracha usa `destination-out`.
- `web/src/service-worker.js` e `web/vite.config.js`: shell offline, versão por hash e precache dos arquivos efetivamente emitidos.
- `web/tests/model.test.mjs`, `worker.test.mjs`, `browser.mjs`: regressões.
- `web/README.md`: execução, publicação e roteiro de teste no iPad.
- `web/PRODUCT.md`, `web/DESIGN.md`, `web/.impeccable/design.json` e `.impeccable/surfaces/pwa.md`: contexto e visual existente. Preservar quadro branco e controles grandes; não redesenhar do zero.

## Próxima etapa recomendada

“Continuar o restante” significa avançar do protótipo para as capacidades do app existente. A ordem abaixo é uma proposta de implementação, não uma aprovação de arquitetura ainda inexistente:

1. **Vários quadros, Novo desenho e galeria local.** Preservar o documento salvo em `current` ao introduzir IDs; migrar sem perda de tinta, borracha ou viewport. Histórico independente por quadro; troca e reabertura nunca misturam desenhos. Não começar apagando IndexedDB ou mudando a origem do site.
2. **Três modos: Livre, Seguir contorno e Colorir.** Escolha de atividade, categorias e os 100 temas existentes em cada modo guiado (200 apresentações). Reaproveitar artes e catálogo, sem gerar coleção nova.
3. **Composição correta e exportação.** Livre: branco + tinta. Seguir contorno: guia a 40% sob a tinta. Colorir: pintura sob contornos protegidos. Modelo e tinta compartilham coordenadas, pan e zoom; borracha nunca apaga a ilustração. Pintura manual, sem balde.
4. **Operações dos responsáveis e preservação.** Exclusão confirmada por quadro, backup/restauração editável do formato web e exportação composta. Preservar comportamento existente durante a evolução.

Começar lendo o código atual e implementando uma fatia completa e testada por vez. Definir a migração de persistência antes de editar o store. Não alterar todos os modos e o banco simultaneamente sem provas de preservação. Ao planejar publicação dos assets, considerar que a Vercel usa `web` como diretório raiz; não presumir que arquivos irmãos estarão incluídos no build sem configurar ou empacotar isso explicitamente.

Não incluir por conta própria nuvem, login, analytics, dependências para poucos utilitários, balde de tinta, arco-íris ou importação de fotos/PDFs. Migração de desenhos PencilKit é trabalho separado: `.board` nativo contém `PKDrawing`, que o navegador não lê diretamente. A autorização para continuar não deve ser interpretada como ordem para descartar ou substituir o aplicativo nativo.

## Catálogo e restrições de preservação

- Manifesto: `Sources/QuadroLivre/Resources/catalog-v1.json`. Apesar do nome, schema interno V2; 100 temas atuais e seis revisões V1 arquivadas.
- PNGs atuais, miniaturas e versões antigas: `Sources/QuadroLivre/Resources/`. Fontes SVG atuais: `Support/Illustrations/v2/`.
- Estado: `catalog-awaiting-approval`; seis pares-piloto aprovados, outras 94 artes aguardam revisão final. O aceite do PWA não altera isso.
- Resolver ilustração por **ID + versão exatos**. Nunca substituir arte já usada por desenho salvo nem fazer fallback silencioso para versão mais recente.
- Não executar geradores históricos para atualizar o catálogo. Não mudar hashes ou registros de publicação para contornar validações.
- Contexto nativo detalhado: `HANDOFF.md`, `IMPLEMENTACAO-V1.2.md` e `Sources/QuadroLivre/{ActivityCatalog,BoardMetadata,BoardDocument,DrawingStore,NewBoardView}.swift`.

## Verificação já executada

- Build de produção do PWA aprovado.
- 14 testes unitários e oito cenários Playwright Chromium aprovados, incluindo pixels da borracha, histórico, exportações, caneta/toque simulados, conflito entre abas, corrupção, falha de escrita e recarga offline em raiz/subdiretório.
- 1.180 verificações Swift e validador de catálogo aprovados; isso não executa UIKit/PencilKit no Linux.
- Revisão independente: `ship` para protótipo supervisionado, sem achados materiais. Depois disso, usuário relatou funcionamento perfeito no iPad.
- Capturas locais em `.impeccable/review/` são ignoradas pelo Git e podem não existir em outro clone.

Comandos a partir de `web/`:

```bash
npm ci
npm test
npm run build
npm run test:browser
```

Testes de navegador exigem Chromium e bibliotecas do Playwright. No WSL, usar Node/npm Linux, não os executáveis Windows herdados pelo PATH. Não alterar configurações globais de npm/Git para resolver o ambiente. Testes nativos a partir da raiz: `bash scripts/test.sh`.

## Cuidados com dados reais

O usuário já usa o PWA no iPad. Preservar banco, origem/domínio, formato salvo e quadros existentes durante atualizações. Mudança de domínio cria outro armazenamento; limpar dados do site pode apagar desenhos. Antes de mudanças de persistência, orientar backup e provar migração com fixture V1. O backup JSON atual preserva traços, mas **a interface ainda não restaura esse arquivo**.
