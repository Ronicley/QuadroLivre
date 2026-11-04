# Implementação V1.1

## Estado real

Código implementado e build Release compilado com xtool. **Ainda não é aceite funcional da V1.1.** A instalação no iPad foi confirmada pelo xtool; a sessão com caneta/criança não foi executada pelo agente. O arco-íris está em prova técnica, desligado por padrão e habilitável somente pela área dos responsáveis, por sessão.

## Implementado

- Canvas sem cabeçalho/rodapé opacos; galeria e reenquadramento flutuantes.
- Dock de cinco alvos de 60 × 60, com 332 × 76 pontos externos. Janelas menores que 356 pontos usam uma ilha 3+2 de 204 × 140, sem faixa de largura total. Controles ficam dentro da área segura.
- Paleta temporária com oito cores originais, três amostras extras, edição visível e grade curada. Seleção fecha a paleta; duplicatas selecionam o slot já existente. Preferências locais versionadas com RGB explícito.
- Voltar da borracha/mover toca apenas na canetinha; tocar na canetinha já ativa abre espessuras, indicado pela seta. Mais opções contém refazer, mover e barreira dos responsáveis.
- Fluxo de novo quadro Livre/Com esboço; seis artes originais offline. Escolha sempre cria outro UUID, sem substituir o desenho aberto.
- Modelo não interativo sob o PKCanvasView transparente, fora do PKDrawing. UIView irmã é sincronizada por `zoomScale`, `contentOffset` e layout, não por uma imagem SwiftUI fixa.
- Reenquadramento considera união de traços/modelo e margens dos controles, inclusive nas bordas do mundo. Rotação mantém o centro do quadro.
- Snapshot `.board` binário versionado reúne PKDrawing + tipo + ID/versão/retângulo do modelo numa única substituição atômica. A fila serial e o número de revisão continuam protegendo o autosave.
- `.drawing` V1 continua legível; ao salvar, cria snapshot e mantém o legado intacto como cópia anterior à migração. A galeria prioriza `.board` e não duplica entradas. Arquivo `.board` ilegível **nunca** volta silenciosamente para o legado.
- Metadados inválidos, versão não suportada ou asset ausente bloqueiam abertura/exportação com mensagem ao responsável, preservando os arquivos. O último quadro válido não é substituído por um quadro livre.
- Miniaturas e PNG compõem branco + modelo + tinta. Exportação cobre a união, conserva proporções e limita o maior lado a 2048 pixels. Excluir remove snapshot, legado e miniatura, nunca o asset compartilhado.

## Prova técnica arco-íris (não aprovada)

Para testar: Mais opções → cadeado → responder à barreira → habilitar **Arco-íris experimental nesta sessão** → voltar → abrir paleta → amostra multicolorida.

- Reconhecedor aceita apenas `UITouch.TouchType.pencil`; nunca muda `canvas.tool` durante um traço para tentar simular o efeito.
- Reamostragem a cada 3 pontos do quadro e interpolação de cores num ciclo de 360 pontos. Pausa não avança a cor. Pressão e inclinação não são usadas.
- Preview acrescenta pequenos CAShapeLayers coloridos, sem reconstruir PKDrawing a cada movimento.
- Ao levantar a caneta, gera segmentos PKStroke e os adiciona de uma vez ao PKDrawing. Registro explícito no mesmo UndoManager agrupa o gesto; refazer usa o snapshot inverso. Cancelamento remove apenas o preview.
- Borracha nativa, persistência e exportação passam a trabalhar com os PKStrokes, sem formato paralelo de tinta.
- As três espessuras são respeitadas; selecionar cor sólida desativa arco-íris. Trocar/exportar durante gesto experimental é bloqueado.

**Limitações a medir:** quantidade de layers/segmentos em traços longos, diferença de aparência entre preview/Core Animation e PKInk, encaixe das pontas, custo do commit e tamanho de arquivos, desfazer intercalado com borracha nativa e rejeição de palma. A geometria automatizada não comprova esses comportamentos. Se houver regressão, manter desligado e reestimar; não substituir por uma cor sólida por gesto. Não foi promovido a recurso infantil aprovado.

## Verificação executada

```sh
bash scripts/test.sh
# Passed 603 geometry, palette, metadata and rainbow sampling regression checks.
xtool dev build --configuration release --ipa
# Build complete; xtool/QuadroLivre.ipa
```

As 603 verificações cobrem enquadramento, margens (inclusive bordas), limite de exportação, preferências/duplicatas/corrupção, envelope de metadados, rejeição de metadados inconsistentes e amostragem de distância. Não executam UIKit, gravações PencilKit ou gestos reais no Linux.

Instalação pelo fluxo existente: iPad do responsável, USBMUXD no gateway do Windows; xtool retornou `Successfully installed!`. UDID e endereço local foram omitidos da documentação pública. A instalação não equivale a teste funcional nem à confirmação de que os desenhos antigos foram reabertos corretamente.

Revisão estática do próprio agente: verificados precedência do snapshot, ausência de fallback destrutivo, captura de metadados no autosave, preservação do legado, exclusão de ambos os formatos e histórico experimental. **Não houve revisão por subagente nesta etapa:** não havia ferramenta de subagente disponível na sessão.

## Checklist pendente no iPad — bloqueia aceite

1. Antes do teste, preservar cópia dos quadros V1 pelo compartilhamento de arquivos. Abrir V1, alterar, fechar app, reabrir, exportar; confirmar uma única entrada na galeria e desenho editável preservado.
2. Retrato/paisagem/Split View: todos os controles acessíveis, sem sobreposição do indicador de início. Medir retângulos reais: dois botões 60 × 60 e dock 332 × 76 (ou alternativa compacta), incluindo eventuais extensões de aparência. Pelo cálculo de layout, 820 × 1180 deixa cerca de 96,6% livre; não é medição do aparelho.
3. Abrir/fechar paleta, espessuras e mais opções com dedo/caneta; tocar fora fecha e não deixa tinta. Testar oito cores, preencher/editar extras, duplicata, fechar/reabrir app e verificar cores anteriores inalteradas.
4. Em cada modelo, desenhar cruzando contornos e fora da figura. Zoom mínimo/máximo, pan, girar e reenquadrar. Confirmar alinhamento e ausência de uma superfície branca do PencilKit cobrindo o modelo no runtime.
5. Apagar/desfazer/refazer não afeta modelo. Trocar entre quadros livres e modelos; forçar fechamento após salvar; conferir posição, miniatura e PNG. PNG deve incluir tinta fora do modelo e não conter UI.
6. Em cópias de teste, corromper `.board`, remover asset ou usar versão inválida: mensagem visível, sem fallback livre, sem alteração dos arquivos e sem exportação incompleta. Testar armazenamento cheio/falha de gravação e retomada do autosave.
7. Habilitar a prova arco-íris: uma única curva longa deve mostrar várias cores ainda durante o gesto, sem lacunas. Variar velocidade, pausas e zoom; testar dot e três espessuras. Medir fluidez em traços longos e verificar se commit não congela.
8. Um desfazer remove todo o gesto multicolorido, um refazer o restaura. Intercalar sólido/arco-íris/borracha parcial; salvar, reabrir e exportar preserva tudo. Cancelar gesto não deixa preview persistente.
9. Caneta WB reconhecida pelo sistema; dedo não desenha em nenhum modo. Palma não desloca o quadro nem aciona botões de modo recorrente, inclusive na prova arco-íris.
10. Sessão acompanhada com criança valida dois toques para cor e retorno à canetinha. Se necessário, reavaliar paleta flutuante expandida, sem restaurar faixa permanente.

Somente após os itens 4 e 7–9 aprovados a camada de fundo e o arco-íris terão sua prova técnica de runtime concluída. Só então promover o arco-íris à paleta padrão e fechar os critérios do plano.
