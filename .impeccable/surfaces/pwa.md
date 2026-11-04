# Canvas PWA

Modo: Operate. Escopo: `web/index.html`, `web/src/`. Usuário aprovou React e preservação do quadro branco com controles grandes. Fluxo e linguagem visual vêm do aplicativo existente, não de uma nova identidade.

## Direction contract

THESIS: Escolher um desenho local ou começar outro, sem apagar o anterior. Galeria é extensão do editor, não dashboard ou nova identidade.

OWN-WORLD: Quadro branco, controles arredondados claros, tinta índigo, ações de movimento em verde-petróleo e borracha rosa. Tipografia de sistema, 16 cores rápidas de desenho e seletor RGB nativo em “Outra cor”; paleta rolável em telas baixas.

STORY: A criança abre a galeria e escolhe continuar ou criar: Livre, Seguir contorno ou Colorir. Catálogo oferece 100 temas em dez categorias por modo. No editor, caneta cria traços e dois dedos movem e ampliam. Guia fica a 40% sob tinta; contornos de colorir ficam acima. Borracha só remove tinta. Responsáveis exportam, restauram como cópia e confirmam exclusão específica.

FIRST VIEWPORT: App inicia em “Meus desenhos”, com miniaturas reais e “Novo desenho”. Escolha de atividade ocupa a mesma área rolável: três opções grandes e depois catálogo filtrado por categoria, com Voltar visível. Editor mantém canvas inteiro, modelo e tinta alinhados, ferramentas periféricas e dock inferior. Área modal dos responsáveis reúne backup/restauração e confirmação de exclusão sem substituir desenhos silenciosamente. Em telas estreitas, conteúdo rola sem vazamento horizontal.

FORM: Transposição da composição existente em `DrawingScreen.swift`, aprovada na confirmação de escopo. seed: none (incumbent layout preserved; no new visual world).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
