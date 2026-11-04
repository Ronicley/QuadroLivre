# Galeria local — preservação e compatibilidade

## Instrumentos de desenho

- Banco, versão do IndexedDB, chaves, índice e versões V1/V2 dos documentos permanecem iguais. Não há migração de traços nem gravação ao apenas abrir um quadro. Antes da atualização no iPad, exportar backup JSON de cada desenho e manter a mesma origem.
- O campo existente `stroke.tool` identifica cada instrumento: `pen` continua sendo a canetinha original; `ballpoint` é caneta, `pencil` é lápis, `crayon` é giz de cera e `eraser` continua borracha. Não se adicionam defaults aos traços antigos. Pressão, largura, cor, câmera e modelos não são convertidos.
- A evolução amplia somente a enumeração validada de `tool`. IDs também fixam a aparência: lápis usa grão fino translúcido, giz usa grão maior e caneta usa ponta mais fina/opaca. Editor, miniaturas e PNG usam `drawStroke`; textura determinística de 64 × 64 fica nas coordenadas do quadro. Cache de texturas limitado a 32 combinações de instrumento/cor; reconstruir o cache não altera aparência.
- Instrumento desconhecido bloqueia leitura/restauração daquele documento, sem fallback e sem substituir dados. O renderer também rejeita IDs desconhecidos. Novos instrumentos sobrevivem ao histórico, troca de quadro, salvamento, recarga offline e backup/restauração como cópia.
- Compatibilidade de rollback: builds anteriores aceitam somente `pen`/`eraser` e rejeitam documentos que contêm novos instrumentos. Isso impede reinterpretação silenciosa como canetinha. Quadros que usam apenas ferramentas antigas continuam legíveis. Fechar todos os clientes antes de trocar o build; não limpar o banco para contornar incompatibilidade.
- Provas: comparação com renderer anterior por pixels; fixture V1 intocada; quatro instrumentos distintos; pontos, pressão e três larguras; textura estável em pan/recarga/cache do editor; miniaturas e PNG; histórico e quadros independentes; restauração e dados desconhecidos; camadas guiadas e borracha protegendo os modelos.

## Modos guiados e operações dos responsáveis

- Quadro livre permanece documento V1. Guiados usam documento V2 com `mode`, `template.id`, `template.assetVersion` e `template.rect`; traços e câmera mantêm formato. Nenhum V1 existente é regravado para V2.
- Catálogo e todas as revisões referenciadas são copiados sem alteração para `web/catalog/`. Resolver somente ID + versão; ausência ou falha de carregamento bloqueia abertura/exportação daquele quadro, sem fallback. O build inclui os PNGs e precache; não depende de arquivos fora de `web` na Vercel.
- Para permitir exclusão de qualquer quadro, índice V2 mantém `ids`, `numbers` e `nextNumber`. Leitura aceita V1; criação/exclusão converte somente o índice na mesma transação. Números não são reutilizados. Índice vazio é válido no V2; `current` nunca é reutilizado após sua exclusão.
- Exclusão requer responsável e confirmação específica, remove apenas documento selecionado e sua entrada em transação única. Não executa exclusões durante migração. Falha aborta tudo e preserva memória e banco.
- Restauração valida JSON e modelo antes de gravar; cria outro ID, sem substituir quadros. Aceita backup web V1 e V2; câmera, pressão e borracha preservadas. Limite por arquivo: 50 MiB. PNG e PKDrawing não são formatos editáveis suportados.
- Rollback para build anterior à galeria lê apenas `current` se esse quadro ainda existir e for V1. Builds antigos de galeria não leem índice V2: bloqueiam sem regravar. Após usar modos/exclusão, rollback de interface não restaura quadros excluídos nem torna guiados legíveis; manter backups. Nunca limpar banco para contornar incompatibilidade.

## Galeria inicial — registro histórico

Esta seção descreve a entrega anterior, somente com documentos V1 e sem restauração pela interface. Para o comportamento atual, inclusive índice V2, exclusão e restauração, prevalece a seção acima.

- Banco permanece `quadro-livre-pwa`, versão 1, store `boards`. Origem do site não muda.
- Documentos continuam no formato V1. `current` é o ID permanente do primeiro desenho; tinta, borracha e câmera não são convertidas nem regravadas ao abrir.
- Registro `gallery` contém `{ version: 1, ids: [...] }`. A primeira abertura registra `current` somente se existir e for válido. Sem documento, a galeria começa vazia.
- Primeiro documento de uma instalação nova também usa `current`, mantendo compatibilidade com rollback. Demais documentos usam `board:<UUID>`. Documento e inclusão no índice são gravados na mesma transação. Repetir a inicialização não duplica o desenho legado; abortar uma gravação não deixa quadro órfão.
- Web Lock `quadro-livre-editor` continua protegendo toda a sessão, inclusive galeria. Trocar/criar/voltar exige concluir a gravação pendente; erro preserva quadro em memória e exportação.
- Cada quadro tem histórico em memória independente; reabrir o app reinicia refazer, como antes. Quadros inválidos ficam indisponíveis sem substituição; um índice inválido bloqueia a abertura sem gravar.
- Rollback: build anterior ainda lê e grava `current`; demais quadros e índice permanecem no banco, mas não aparecem naquela interface. Fechar todas as janelas antes de mudar versão; o service worker não força ativação. Não apagar índice, documentos ou banco para fazer rollback.
- Antes de atualizar no iPad: exportar backup JSON de cada desenho disponível. Manter mesmo domínio e dados do site. Backup pela interface ainda não pode ser restaurado nesta etapa.
- Provas: fixture V1 com caneta, borracha, pressão e câmera; inicialização repetida; aborto durante criação/migração; alternância e histórico isolados; falha de salvamento; recarga offline.
