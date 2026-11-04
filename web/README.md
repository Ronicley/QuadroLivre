# Quadro Livre — PWA 0.1

Protótipo React paralelo ao app Swift. Um quadro livre, caneta/mouse, oito cores, três espessuras, borracha, desfazer/refazer, zoom/pan, IndexedDB e exportação PNG/JSON. Não modifica o aplicativo instalado nem seus desenhos.

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

- Caneta e botão principal do mouse desenham. Toque de dedo nunca cria tinta.
- Dois dedos movimentam/ampliam. Mão permite arrastar com um dedo ou mouse; selecioná-la novamente retorna à canetinha.
- Roda do mouse e botões +/− ajustam zoom. Reenquadrar considera os traços.
- Teclado: Ctrl/Cmd+Z desfaz, Ctrl/Cmd+Shift+Z ou Ctrl/Cmd+Y refaz. Com o canvas focado, setas movem e +/− ampliam.
- Traços concluídos são gravados imediatamente; viewport após 400 ms. O fechamento forçado pode interromper uma transação ainda em andamento. Só **Salvo neste aparelho** confirma a gravação.
- Uma janela por origem pode editar. Outra janela é bloqueada, evitando sobrescrita concorrente. Quadros inválidos não são substituídos por um quadro vazio.
- Exportação fica na área dos responsáveis, atrás de uma soma (barreira infantil, não autenticação). PNG até 2048 px; JSON preserva os traços. **Importação/restauração pela interface ainda não existe.** Backup JSON não é compatível com PKDrawing.
- Limpar dados do site, remover perfis ou políticas de armazenamento do navegador podem apagar desenhos. Não há nuvem nem garantia de retenção. Faça exportações periódicas.

## Aceite obrigatório no iPad

1. Desenhar com a caneta usada pela criança, palma apoiada antes/durante/depois do traço. Dedo não deve pintar. Anotar se a caneta é reportada como toque: este protótipo não a transforma automaticamente em tinta.
2. Desenhar rápido, curvas e pontos; testar pressão quando disponível. Verificar latência e fluidez por alguns minutos, sem presumir equivalência com PencilKit.
3. Pinçar com dois dedos, retirar um, apoiar palma, voltar a desenhar; nenhum salto ou traço acidental. Mão deve mover com um dedo.
4. Testar oito cores, espessuras, borracha, desfazer/refazer e reenquadrar, em retrato/paisagem.
5. Aguardar confirmação de salvamento, fechar e reabrir pelo ícone. Testar também modo avião após o aviso de offline.
6. Salvar PNG e JSON pelo compartilhamento do iPad. Conferir que PNG contém tinta e borracha nas mesmas posições.
7. Abrir segunda janela: edição deve ficar bloqueada. Fechar primeira janela e tentar novamente.

## Verificações automatizadas

`npm test`: 14 testes de documentos, validação, histórico, geometria e service worker.

`npm run test:browser`: gera build e executa oito cenários no Chromium headless. Requer o navegador do Playwright e suas bibliotecas de sistema; instale no ambiente de teste com `npx playwright install chromium` (no Linux, também as dependências indicadas pelo Playwright). O teste usa somente um servidor temporário em localhost e perfis isolados, sem modificar o perfil pessoal do navegador.

Cobertura: cinco tamanhos de tela, caneta/toque simulados, borracha, histórico, exportações, IndexedDB, conflito entre abas, quadro corrompido, falha de gravação, recarga offline e publicação em subdiretório. Capturas ficam em `../.impeccable/review/`, fora da publicação. Testes não comprovam rejeição de palma física, comportamento do Safari instalado, latência ou retenção de armazenamento no iPad.

## Limites desta etapa

Sem catálogo, modos guiados, galeria, vários quadros, restauração pela interface, migração dos desenhos nativos, arco-íris ou balde. O renderer guarda os traços em vetor e rasteriza apenas o viewport; desempenho em sessões longas e rejeição de palma exigem teste no hardware. Não remover o app Swift para testar.

## Ícones

Derivados de `../Support/AppIcon.png`, arte original de `../scripts/make_icon.py`. Regenerar sem alterar o original:

```bash
python3 scripts/make_icons.py
```

O script aceita o PNG RGB sem filtros produzido pelo gerador original e contém verificações de formato e dimensões.
