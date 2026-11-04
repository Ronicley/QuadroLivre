# Quadro Livre — PWA 0.1

PWA React paralelo ao app Swift. Galeria local, modos Livre/Seguir contorno/Colorir, 100 temas por modo guiado em dez categorias, caneta/mouse, borracha, histórico, zoom/pan, IndexedDB, PNG composto, backup/restauração JSON e exclusão confirmada. Não modifica o aplicativo instalado nem seus desenhos.

Continuação em sessão limpa: [`../HANDOFF-PWA.md`](../HANDOFF-PWA.md). O responsável relatou funcionamento perfeito do protótipo no iPad; o handoff registra esse aceite, os limites da evidência e as próximas etapas.

## Executar

Requer Node.js 22.12+ e npm.

```bash
cd web
npm ci
npm run dev
```

## Build e modo offline

```bash
npm test
npm run build
npm run preview
```

No WSL, use Node/npm do Linux, não o npm do Windows herdado pelo `PATH`. Executar npm do Windows em um diretório UNC pode mudar a pasta de trabalho e produzir um build incorreto.

O service worker só é registrado no build de produção, não no servidor de desenvolvimento. Abra o preview em `http://localhost:4173` e aguarde **Pronto para desenhar sem internet**. Na primeira abertura, o shell completo e os ícones são armazenados. Atualizações aguardam fechar todas as janelas do editor; não forçam recarga durante o desenho.

Para usar no iPad, publique **somente `web/dist/`** em hospedagem estática HTTPS. HTTP por IP da rede local não habilita service worker nem o bloqueio de edição. Não sirva a raiz do repositório, arquivos de provisionamento ou IPAs. A configuração usa caminhos relativos e admite hospedagem em subdiretório. O host deve servir `.webmanifest` como JSON/manifesto e `sw.js` como JavaScript, sem cache permanente para `sw.js` e `index.html`.

No Safari: Compartilhar → Adicionar à Tela de Início. A primeira abertura do app instalado também deve ocorrer online: armazenamento pode ser separado do Safari. Abra pelo ícone, confirme o modo offline e só depois desconecte.

## Publicar na Vercel

1. Importe `Ronicley/QuadroLivre` na Vercel.
2. Em **Root Directory**, escolha **`web`** (não a raiz do repositório).
3. Framework **Vite**, Build Command **`npm run build`**, Output Directory **`dist`**. Use Node.js 22 ou superior. Não há variáveis de ambiente nem backend para configurar.
4. Faça o deploy e abra a URL HTTPS no Safari do iPad. Instale pelo compartilhamento e siga o checklist abaixo.

`web/vercel.json` declara o build e mantém `sw.js` revalidável para receber atualizações. Não adicione cache imutável ao HTML ou ao service worker. Deploys de preview podem exigir login da Vercel; para o teste no iPad, use uma URL acessível ao responsável. Concluir a importação e autorizar o GitHub na Vercel são passos separados do envio do repositório.

Mantenha a mesma URL para os testes: cada domínio/origem tem armazenamento próprio; trocar do preview para produção não transfere desenhos. Exporte antes de trocar. A publicação não inclui `.env`, `.vercel`, IPAs, perfis Apple, `node_modules`, builds locais ou capturas de teste.

## Uso e preservação

- App abre em **Meus desenhos**. Toque na miniatura para continuar ou em **Novo desenho** para escolher Livre, Seguir contorno ou Colorir. Nos modos guiados, filtre por categoria e toque no tema. Criar outro quadro não apaga desenhos anteriores.
- Seguir contorno usa guia a 40% sob a tinta; Colorir mantém contornos acima da pintura manual, sem balde. Modelo e tinta compartilham coordenadas e zoom; borracha nunca apaga ilustração. Reenquadrar e PNG consideram modelo e tinta.
- Catálogo usa artes existentes, sem regeneração: 100 temas atuais e seis revisões arquivadas. A coleção segue em revisão final com o responsável. Versões salvas são resolvidas por ID + versão exatos, sem substituir pela arte mais nova. Arquivo ausente bloqueia abertura/exportação daquele quadro, preservando dados.
- Botão **Meus desenhos** no editor salva antes de voltar à galeria. Histórico e enquadramento são independentes por quadro; refazer sobrevive à troca, mas não ao fechamento do app. Erro de gravação mantém o desenho aberto para tentar novamente ou exportar.
- Desenho da versão anterior aparece como **Desenho 1**, preservando sua chave `current`, formato V1, caneta, borracha, pressão e câmera. Guiados usam documentos V2; criação/exclusão usa índice V2 com numeração estável. Banco IndexedDB não é apagado nem muda de versão. Migração e limites de rollback: [`MIGRATION.md`](MIGRATION.md). Antes de atualizar no iPad, faça backup JSON e mantenha o mesmo domínio.
- Caneta e botão principal do mouse desenham. Toque de dedo nunca cria tinta.
- **Escolher instrumento** abre quatro opções no mesmo espaço do dock: Canetinha original, Caneta (fina e opaca), Lápis (grão fino translúcido) e Giz de cera (textura mais grossa). Cada traço guarda seu instrumento, inclusive em miniaturas, PNG e backup/restauração. Todos funcionam nos três modos, com três espessuras e pressão quando disponível. Desenhos antigos não são convertidos nem regravados ao abrir; instrumentos desconhecidos são bloqueados, nunca reinterpretados.
- Paleta oferece 16 cores rápidas e **Outra cor**, com seletor nativo para qualquer cor RGB. Escolher cor ou espessura retorna ao instrumento escolhido sem alterar traços anteriores; branco é tinta branca, não borracha. Cores personalizadas ficam nos traços e backups, sem migração de dados.
- Dois dedos movimentam/ampliam. Mão permite arrastar com um dedo ou mouse; selecioná-la novamente retorna ao instrumento escolhido.
- Roda do mouse e botões +/− ajustam zoom. Reenquadrar considera os traços.
- Teclado: Ctrl/Cmd+Z desfaz, Ctrl/Cmd+Shift+Z ou Ctrl/Cmd+Y refaz. Com o canvas focado, setas movem e +/− ampliam.
- Traços concluídos são gravados imediatamente; viewport após 400 ms. O fechamento forçado pode interromper uma transação ainda em andamento. Só **Salvo neste aparelho** confirma a gravação.
- Uma janela por origem pode editar. Outra janela é bloqueada, evitando sobrescrita concorrente. Quadros inválidos não são substituídos por um quadro vazio.
- Exportação fica na área dos responsáveis, atrás de uma soma (barreira infantil, não autenticação). PNG composto até 2048 px; JSON preserva traços, modelo/versão e câmera. **Restaurar** aceita backup web V1/V2 até 50 MiB e cria cópia editável, nunca sobrescreve. Não aceita PNG nem PKDrawing.
- **Excluir** fica na mesma área, com seleção por desenho e confirmação definitiva. Cancelar não altera dados; falha de transação preserva documento e índice. Numeração não é reutilizada e excluir um quadro nunca limpa os demais. Exporte backup antes de excluir.
- Limpar dados do site, remover perfis ou políticas de armazenamento do navegador podem apagar desenhos. Não há nuvem nem garantia de retenção. Faça exportações periódicas.

## Aceite obrigatório no iPad

1. Desenhar com a caneta usada pela criança, palma apoiada antes/durante/depois do traço. Dedo não deve pintar. Anotar se a caneta é reportada como toque: este protótipo não a transforma automaticamente em tinta.
2. Desenhar rápido, curvas e pontos; testar pressão quando disponível. Verificar latência e fluidez por alguns minutos, sem presumir equivalência com PencilKit.
3. Pinçar com dois dedos, retirar um, apoiar palma, voltar a desenhar; nenhum salto ou traço acidental. Mão deve mover com um dedo.
4. Testar Canetinha, Caneta, Lápis e Giz de cera com 16 cores, **Outra cor**, três espessuras, pressão, borracha, desfazer/refazer e reenquadrar, em retrato/paisagem. Conferir seletor nativo no Safari, textura durante zoom e instrumento/cor após exportação/reabertura. Comparar fluidez com a canetinha original.
5. Aguardar confirmação de salvamento, voltar à galeria, criar segundo desenho e alternar entre ambos. Conferir tinta, borracha, câmera e histórico separados. Fechar e reabrir pelo ícone: galeria deve mostrar ambos. Repetir em modo avião após o aviso de offline.
6. Salvar PNG e JSON pelo compartilhamento do iPad. Conferir que PNG contém tinta e borracha nas mesmas posições.
7. Abrir segunda janela: edição deve ficar bloqueada. Fechar primeira janela e tentar novamente.
8. Em Seguir contorno e Colorir, pintar sobre linhas e apagar. Conferir camadas, alinhamento com zoom/pan, PNG composto e reabertura offline. Testar os temas com o responsável: uso funcional não aprova artes pendentes.
9. Exportar backup JSON e restaurar: outro quadro deve manter traços, pressão, borracha, modelo exato e câmera. Em Responsáveis, cancelar exclusão e depois excluir apenas uma cópia de teste; demais quadros devem permanecer.

## Verificações automatizadas

`npm test`: 21 testes de documentos, instrumentos, cores, validação, histórico, geometria, catálogo/arquivos, backups e service worker.

`npm run test:browser`: gera build e executa 22 cenários no Chromium headless. Requer o navegador do Playwright e suas bibliotecas de sistema; instale no ambiente de teste com `npx playwright install chromium` (no Linux, também as dependências indicadas pelo Playwright). O teste usa somente um servidor temporário em localhost e perfis isolados, sem modificar o perfil pessoal do navegador.

Cobertura: cinco tamanhos de tela, caneta/toque simulados, histórico, exportações, IndexedDB, conflito entre abas, corrupção, falhas/abortos, migração V1 sem perda, múltiplos quadros offline e subdiretório. Inclui comparação por pixels com a canetinha anterior, quatro instrumentos distintos, textura determinística, pressão/espessuras, preview/traço ativo/PNG, instrumentos desconhecidos e backup/restauração dos novos traços. Também cobre catálogo por categoria/modo, pixels das camadas/guia/borracha, versão arquivada, modelo ausente, restauração editável sem sobrescrita, exclusão cancelada/abortada/confirmada e numeração estável. Capturas ficam em `../.impeccable/review/`, fora da publicação. Testes não comprovam rejeição de palma física, comportamento do Safari instalado, latência ou retenção no iPad.

## Limites desta etapa

Sem renomeação, nuvem, migração dos desenhos nativos, arco-íris ou balde. Galeria carrega documentos locais e usa miniaturas dos modelos; cache de imagens decodificadas limitado a oito entradas. Coleções e sessões muito grandes exigem avaliação de desempenho no hardware. Renderer do editor guarda traços em vetor e rasteriza apenas viewport. Não remover app Swift para testar.

## Recursos do catálogo

`catalog/` é autocontido dentro de `web` para a Vercel. `ORIGIN.md`, manifesto e `SHA256SUMS` registram origem, licença, revisão e hashes das 424 cópias PNG. Atualização explícita a partir da raiz: `node web/scripts/sync-catalog.mjs`. O script só copia arquivos existentes; nunca regenera artes ou modifica recursos nativos. Build em `web` não precisa de diretórios irmãos. Imagens emitidas com hash entram no precache, aumentando o primeiro download offline.

## Ícones

Derivados de `../Support/AppIcon.png`, arte original de `../scripts/make_icon.py`. Regenerar sem alterar o original:

```bash
python3 scripts/make_icons.py
```

O script aceita o PNG RGB sem filtros produzido pelo gerador original e contém verificações de formato e dimensões.
