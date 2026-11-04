# Validação no iPad — pendente

Executar no iPad 11ª geração (A16). A entrega **1.2.0 (120)** com 100 temas foi instalada via xtool, sem desinstalar; não houve validação interativa pelo assistente. Nenhum item abaixo foi marcado como aprovado sem teste real. Atualizar sem remover o app para preservar os quadros.

## Registro da sessão de teste

Preencher ao executar, não com base no sucesso do build:

- Data e responsável pelo teste: **pendente**.
- Versão/build exibidos na área dos responsáveis: **pendente** (esperado: 1.2.0 / 120).
- Modelo do iPad e versão do iPadOS: **pendente**.
- Modelo exato da caneta WB: **pendente**.
- Contexto: retrato/paisagem/janela estreita; navegador/iPad/criança: **pendente**.
- Evidências (capturas, PNGs exportados, instrumentos e observações): **pendente**.
- Resultado e falhas por número/ID/modo: **pendente**.

## V1.2 — entrada, catálogo e camadas

- [ ] Confirmar três cartões ao iniciar; continuar quadro anterior sem alteração.
- [ ] Novo desenho e galeria acessíveis no canvas. Cancelar/voltar do seletor não cria quadro.
- [ ] Seletor com cartões separados e centralizados em retrato, paisagem e janela estreita.
- [ ] Seguir contorno e Colorir mostram os mesmos 100 temas, com dez por categoria e miniaturas próprias de cada modo.
- [ ] Abrir Seguir contorno → gato: guia grande e claro visível no canvas, não só na miniatura. Conferir contraste de 40% no aparelho.
- [ ] Traçar/apagar/desfazer/refazer não altera o guia.
- [ ] Abrir Colorir → gato: tinta larga fica sob contornos escuros; borracha/histórico não removem a ilustração.
- [ ] Nos dois modos, modelo e tinta mantêm alinhamento em zoom mínimo/máximo, pan e rotação.
- [ ] Pintar fora da figura é permitido; exportação e miniatura incluem essa tinta na ordem correta de camadas.
- [ ] Mover/ampliar, aguardar autosave, fechar/reabrir: modo, arte, posição e tinta editável preservados.
- [ ] Abrir quadros V1 livres, V1.1 com modelo e pilotos V1: aparência original, sem troca silenciosa de arte ou contraste.

## V1.2 — regressão obrigatória de isolamento A/B

1. Criar quadro A, desenhar marca grande reconhecível e aguardar salvar.
2. Novo → Livre: confirmar folha totalmente branca, sem guia, com desfazer/refazer desabilitados.
3. Desenhar marca diferente em B; abrir A e B pela galeria. Cada um deve conter somente seu trabalho, com histórico independente.
4. Repetir A → novo Seguir contorno → novo Colorir → novo Livre. Conferir canvas e miniaturas.
5. Fechar/reabrir o app, reabrir A e B e exportar ambos. Conferir arquivos separados antes de apagar qualquer teste.

- [ ] Sequência completa aprovada no aparelho.
- [ ] PNGs de A e B conferidos após reabertura.

Se reaparecer conteúdo indevido, registrar modos, IDs dos quadros, passos, se some ao mover/reenquadrar e se aparece também no PNG. Não concluir que é apenas cache nem corrupção persistida sem essa evidência.

## V1.2 — catálogo, memória e aprovação artística

- [ ] Percorrer as dez categorias nos dois modos, rolando Todos e alternando vários temas sem carregar todos em alta resolução.
- [ ] Medir tempo de abertura/rolagem e pico de memória com ferramenta identificada; registrar sequência e valores. O tamanho do IPA e o limite do cache não medem memória total.
- [ ] Observar comportamento sob pressão de memória com método registrado; sem encerramento, perda de tinta ou asset incorreto. Se não houver ferramenta disponível, manter esse teste pendente.
- [ ] Responsável revisar as 94 artes novas por número/ID, incluindo detalhes ampliados de ambos os modos. Usar `Support/Illustrations/review-100/index.html` ou o app.
- [ ] Registrar correções e aprovações individuais; aprovação dos seis pilotos não aprova a coleção inteira. Correções de arte instalada exigem versão nova, nunca sobrescrever V2.
- [ ] Sessão acompanhada com a criança: reconhecimento, interesse, áreas de pintura e compreensão dos três modos.

Os testes gerais abaixo também se aplicam aos três modos.

## Bloqueador: caneta e palma

- [ ] A WB faz traços contínuos, inclusive perto das bordas e com movimentos rápidos.
- [ ] Dedo no quadro não produz traço.
- [ ] Dedo nos botões escolhe cores/ferramentas normalmente.
- [ ] Palma apoiada antes, durante e depois do traço não desenha nem navega acidentalmente.
- [ ] Funcionamento sem depender de pressão/inclinação.
- [ ] Ligar/desligar e recarregar a caneta não exige reiniciar o app.
- [ ] Registrar falhas com a WB separadamente de falhas do aplicativo; não liberar dedos silenciosamente.

## Ferramentas e histórico

- [ ] Todas as oito cores e três espessuras funcionam e indicam seleção.
- [ ] Branco aparece ao desenhar sobre outra cor; sobre branco funciona como tinta branca, não erro.
- [ ] Borracha remove traços com área generosa.
- [ ] Desfazer/refazer funcionam após desenhar e apagar.
- [ ] Abrir outro quadro não permite desfazer ações do quadro anterior.
- [ ] Selecionar uma cor sai da borracha e do modo mover.

## Quadro e layout

- [ ] Dois dedos movem e ampliam, sem produzir traços.
- [ ] Modo mão permite mover com um dedo e não desenha com caneta enquanto ativo.
- [ ] Reenquadrar funciona em quadro vazio e com traços distantes.
- [ ] Desenhar próximo dos limites físicos não produz saltos/artefatos.
- [ ] Girar para retrato e paisagem preserva coordenadas, conteúdo e acesso aos controles.
- [ ] Janelas estreitas permitem acessar todos os controles por rolagem.
- [ ] O teclado da barreira infantil não cobre a ação Continuar.

## Persistência

- [ ] Desenhar, aguardar confirmação na área dos responsáveis, fechar e reabrir: quadro editável restaurado.
- [ ] Desenhar e imediatamente ir à tela inicial: último traço preservado ao voltar.
- [ ] Criar novo quadro preserva o anterior.
- [ ] Alternar rapidamente entre quadros não mistura arquivos, traços, miniaturas ou histórico.
- [ ] Galeria mostra miniatura atualizada após autosave e após troca imediata de quadro.
- [ ] Em ambiente de teste, simular falha de gravação: mensagem visível, quadro em memória preservado, transição bloqueada e nova tentativa funcional.
- [ ] Arquivo ilegível em ambiente de teste: erro visível sem sobrescrever original; possível criar/abrir outro quadro.
- [ ] Falha inicial de armazenamento bloqueia desenho e oferece recuperação.

## Responsáveis e exportação

- [ ] Desafio incorreto não abre a área; correto abre e pode ser fechado.
- [ ] PNG abre no destino escolhido, tem fundo branco e contém todo o desenho.
- [ ] PNG nunca excede 2.048 pixels no maior lado, inclusive com traços distantes.
- [ ] Compartilhar/cancelar funciona em retrato e paisagem sem crash de popover.
- [ ] Excluir exige confirmação; cancelar preserva o quadro.
- [ ] Excluir quadro atual abre outro com segurança; excluir o último cria um vazio.
- [ ] Arquivos editáveis podem ser copiados pelo Apple Devices após o app estar instalado.
- [ ] Uso essencial funciona em modo avião.

## Desempenho e uso infantil

- [ ] Desenhar continuamente por 15 minutos, apagar e desfazer sem falhas recorrentes ou congelamentos.
- [ ] Avaliar com muitos traços e pelo menos 30 quadros na galeria.
- [ ] Observar criança de 3–5 anos acompanhada: escolher cor, desenhar, apagar, desfazer e retomar desenho sem leitura obrigatória.
- [ ] Se dois dedos/palma causarem navegação acidental recorrente, adotar movimentação apenas por modo explícito antes de aprovar a V1.
