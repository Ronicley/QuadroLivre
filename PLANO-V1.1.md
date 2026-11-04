# V1.1 — Mais espaço para desenhar e esboços guiados

Status: implementação iniciada e compilada; validação de runtime e aceite pendentes. Interface, cores extras, catálogo, camada protegida, snapshots e composição implementados. Arco-íris disponível apenas como prova experimental opt-in dos responsáveis, ainda não aprovado no iPad. Evidências e checklist: [IMPLEMENTACAO-V1.1.md](IMPLEMENTACAO-V1.1.md). Os critérios abaixo continuam sendo a referência de aceite, não uma declaração de testes concluídos.

## Objetivos

1. Recuperar espaço hoje ocupado pelo cabeçalho e rodapé.
2. Preservar controles fáceis de tocar para crianças de 3 a 5 anos.
3. Permitir desenhar livremente sobre um esboço protegido, sem apagar o modelo por acidente.
4. Manter as oito cores existentes, acrescentar até três cores escolhidas pela criança a partir de uma paleta e uma opção de traço arco-íris.
5. Preservar todos os quadros já existentes e o suporte à caneta WB a validar no dispositivo.

## Diagnóstico do layout atual

DrawingScreen.swift reserva aproximadamente 244 pontos verticais para controles: cabeçalho de 80 e rodapé de 164, sem contar áreas seguras do sistema. O cabeçalho inclui um título sem utilidade durante o desenho; o rodapé mantém duas linhas completas mesmo quando a criança não está mudando ferramentas.

A economia deve vir da organização dos controles, não da redução excessiva dos alvos de toque.

## Nova interface

- Canvas ocupa toda a área disponível; remover faixas opacas permanentes superior e inferior.
- Remover título Quadro Livre da tela de desenho.
- Botão flutuante Meus desenhos no canto superior esquerdo.
- Botão flutuante Reenquadrar no canto superior direito.
- Dock inferior flutuante, compacto e de uma linha: cor atual, canetinha, borracha, desfazer e mais opções.
- Áreas de toque principais de aproximadamente 60 × 60 pontos; ícones podem ser menores que seus alvos.
- Cor atual abre uma paleta temporária: oito cores fixas, até três cores extras personalizáveis e uma opção arco-íris. Selecionar uma cor pronta fecha a paleta.
- Os recursos de cor adicionais não criam nova faixa permanente na tela; detalhes na seção Cores e arco-íris.
- Tocar na canetinha ativa desenho; espessuras ficam em popover por ação explícita, sem abrir obrigatoriamente toda vez que voltar da borracha.
- Mais opções: refazer, modo mover e acesso dos responsáveis protegido pela barreira existente.
- Nenhum recurso depende de toque longo, leitura ou gesto secreto para uso essencial.
- Não ocultar automaticamente as ferramentas durante o traço: controles estáveis e previsíveis para essa faixa etária.
- Popovers fecham ao selecionar opção ou tocar fora; não consomem espaço permanentemente.
- Ajustar dock à orientação e janelas estreitas sem esconder controles fora da tela. Usar uma disposição alternativa se a largura não comportar a linha, sem voltar ao rodapé de duas faixas em tela cheia.
- Respeitar áreas seguras; não posicionar controles sobre o indicador de início.
- Reenquadramento considera margens de proteção para que o esboço não fique atrás dos botões/dock.

### Trade-off a validar

Cores passam de um para dois toques: abrir paleta e escolher. Testar com criança acompanhada. Se dificultar o uso, manter uma pequena paleta flutuante expandida durante a atividade, sem restaurar a faixa de largura total.

### Meta mensurável

Em retrato e paisagem no iPad alvo, buscar pelo menos 90% da área útil visível livre de controles persistentes, medindo os retângulos reais das sobreposições. O canvas pode ocupar toda a tela, mas a área encoberta pelo dock não deve ser contabilizada como livre.

## Cores e arco-íris

### Oito cores fixas + até três cores extras

- Preservar as oito cores atuais, sem substituí-las.
- Adicionar três espaços de cores extras, inicialmente apresentados como botões +.
- Tocar num espaço vazio abre uma grade visual de cores predefinidas, organizada por famílias e tons. Sem digitação, RGB, hexadecimal ou sliders obrigatórios.
- A criança escolhe livremente uma cor da grade; o espaço passa a mostrar essa cor e ela fica ativa.
- Para trocar uma cor extra existente, oferecer um botão visível de edição dentro da paleta, sem depender de toque longo. Tocar normalmente na amostra apenas seleciona a cor para desenhar.
- Cores extras persistem entre sessões como preferências locais. Alterar uma amostra não recolore traços já feitos.
- Evitar duplicatas entre as três extras; escolher uma já existente apenas seleciona a amostra correspondente.
- Interpretação adotada: “cores aleatórias baseadas numa paleta” significa até três cores livres escolhidas pela criança dentro de uma paleta curada. Sorteio automático não é requisito; se o responsável quis dizer sortear cores, confirmar antes da implementação.

### Traço arco-íris

- Uma opção adicional identificada por amostra multicolorida, não um novo botão permanente no dock.
- A tinta muda de cor AO LONGO DO MESMO TRAÇO, percorrendo e repetindo uma sequência de cores do arco-íris. Não confundir com sortear uma cor sólida por traço.
- A progressão acompanha a distância desenhada em coordenadas do quadro, não o tempo: parar a caneta não muda a cor; velocidade e zoom não devem alterar arbitrariamente o padrão.
- Preferir transições suaves, traço contínuo e sem lacunas, com as três espessuras existentes.
- Não depender de pressão ou inclinação e continuar aceitando somente caneta reconhecida pelo sistema no quadro.
- Um gesto de caneta deve ser uma ação de desfazer/refazer, mesmo que a representação interna contenha vários segmentos coloridos.
- Borracha, salvamento, reabertura, miniaturas e exportação devem preservar o resultado multicolorido.
- Voltar a uma cor sólida desativa o arco-íris. Selecionar arco-íris sai da borracha e do modo mover.

### Prova técnica obrigatória do arco-íris

PKInkingTool usa uma cor de tinta por ferramenta; arco-íris contínuo não é uma simples configuração nativa. Validar uma abordagem de traço multicolorido antes de prometer equivalência de comportamento com a canetinha atual.

Avaliar geração de segmentos PKStroke coloridos a partir do trajeto, com renderização/preview durante o gesto e composição persistente em PKDrawing. Comprovar continuidade, baixa latência, encaixe das extremidades e histórico agrupado sem reprocessar o desenho inteiro a cada movimento. Não assumir que trocar canvas.tool durante o traço produz esse efeito.

Se a solução exigir motor de desenho próprio ou apresentar regressões de palma, desempenho, borracha ou histórico, apresentar o resultado e reestimar o trabalho. Não substituir silenciosamente por alternância de uma cor sólida a cada traço.

## Atividade com esboço

### Fluxo

1. Na galeria, Novo quadro oferece duas opções ilustradas: Livre e Com esboço.
2. Com esboço abre um catálogo com miniaturas grandes.
3. Escolher um modelo cria um NOVO quadro com esse modelo; não substitui o desenho aberto.
4. O modelo aparece centralizado, grande, sem deformação e enquadrado na área desobstruída.
5. A criança desenha por cima, troca cores, apaga e desfaz normalmente.
6. Ao reabrir, modelo e traços retornam às mesmas posições.

### Comportamento do modelo

- Esboço como camada base protegida; traços infantis em camada editável acima.
- Borracha e histórico alteram somente os traços infantis, nunca o modelo.
- Sem seleção, arraste ou redimensionamento acidental do esboço.
- Zoom e movimentação transformam o esboço e os traços juntos.
- Manter quadro livre ao redor da figura; desenhar fora dos contornos é permitido.
- Contornos simples, legíveis e sem excesso de detalhes. Não depender de pressão da caneta.
- Enquadrar considera a união do retângulo do modelo com os traços, inclusive se o desenho ainda estiver vazio.
- Não incluir avaliação de acerto, pontuação, bloqueio de sair da linha ou preenchimento automático.

### Catálogo inicial sugerido

Seis modelos originais: gato, cachorro, borboleta, casa, carro e flor. Todos offline, com fundo transparente e contornos adequados a 3–5 anos. Para seguir pontilhado ou ajustar opacidade, avaliar uma evolução posterior; não criar dois modos distintos nesta entrega.

### Referência e licenciamento

Referência visual fornecida: https://pt.vecteezy.com/arte-vetorial/2852209-ilustracao-desenho-esboco-de-gato

A página consultada identifica o recurso como Vetor Pro / Licença Pro Standard. Não incorporar a prévia nem copiar o desenho sem verificar licença para uso e distribuição dentro do aplicativo. Preferência: artes originais, sem traçar/copiar a referência, ou recursos com licença expressamente adequada. Registrar autoria/origem/licença dos modelos usados.

## Arquitetura e persistência

### Camada do modelo

- Modelos incluídos no bundle, com identificadores estáveis e versão do asset.
- Arte vetorial original como fonte; asset de runtime em PDF vetorial ou PNG transparente de boa resolução, conforme validação da integração.
- Não adicionar dependência de renderização SVG para esta etapa.
- Compartilhar o MESMO espaço de coordenadas e transformação do PKCanvasView. Uma imagem SwiftUI fixa sobre a tela não é suficiente: desalinharia ao mover/ampliar.
- Prova técnica isolada da camada de fundo antes de integrar catálogo e persistência.
- A imagem do modelo não captura toques e não integra o PKDrawing editável.

### Dados de cada quadro

- Manter PKDrawing para os traços, incluindo os segmentos multicoloridos se a prova técnica do arco-íris validar essa representação.
- Persistir as três cores extras como preferências locais versionadas, usando componentes de cor explícitos; cores efetivas dos traços ficam gravadas no desenho, sem depender das amostras atuais.
- Acrescentar metadados versionados: tipo livre/esboço, identificador e versão do modelo e seu retângulo em coordenadas do quadro.
- Atualizações futuras de arte não podem alterar a posição nem remover modelos usados por quadros já salvos.
- Arquivos legados sem metadados válidos de esboço continuam abrindo como quadros livres.
- Distinguir metadados ausentes de metadados corrompidos; não descartar silenciosamente o modelo de um quadro existente.
- Se um asset estiver ausente, preservar traços/metadados e informar ao responsável; não sobrescrever nem exportar silenciosamente sem o modelo.
- Salvar desenho e vínculo com o modelo de forma consistente, com snapshot versionado/commit atômico apropriado, para não associar um desenho ao modelo errado após interrupção.
- Preservar fila serial e proteção contra conclusões de autosave obsoletas.
- Excluir um quadro remove seus metadados e miniatura, sem afetar o asset compartilhado nem outros quadros.

### Miniaturas e PNG

- Compor fundo branco + modelo + traços na mesma transformação usada no canvas.
- Miniatura inclui o modelo mesmo antes de desenhar.
- Exportação inclui modelo e traços, preserva proporções e limita o maior lado a 2.048 pixels.
- Região exportada cobre a união entre esboço e traços; não corta desenhos feitos fora da figura.
- Não exportar botões, dock, sombras ou outros controles da interface.

## Etapas

1. Redesenhar a tela com canvas amplo e controles flutuantes; testar retrato/paisagem e área desobstruída.
2. Validar usabilidade da paleta temporária, três cores extras e retorno rápido à canetinha.
3. Executar prova técnica do arco-íris: preview durante o gesto, continuidade, borracha, histórico, persistência e desempenho no iPad.
4. Provar alinhamento modelo/traços com zoom, movimentação, reenquadramento e rotação.
5. Produzir catálogo inicial e registrar origem/licenças.
6. Implementar seleção Livre/Com esboço e criação segura de novos quadros.
7. Implementar metadados e compatibilidade com quadros legados sem apagar dados.
8. Compor miniaturas/exportação e tratar modelo ausente ou metadados ilegíveis.
9. Integrar o arco-íris aprovado na prova técnica e executar regressão com quadros livres e esboços.
10. Compilar, revisar com subagente, instalar pelo fluxo xtool já autorizado e testar no iPad.

## Critérios de aceite

- Não há cabeçalho nem rodapé permanentes de largura total na tela de desenho.
- Canvas recupera a altura hoje reservada às duas faixas; meta de área livre validada no dispositivo, não apenas pela hierarquia de views.
- Ferramentas continuam acessíveis e fáceis de tocar com dedo ou caneta.
- Oito cores fixas permanecem disponíveis, e a criança pode preencher, selecionar e trocar até três amostras extras sem leitura obrigatória.
- As amostras extras sobrevivem ao fechamento do app; trocá-las não altera desenhos anteriores.
- Arco-íris mostra várias cores durante o mesmo gesto, sem lacunas recorrentes nem uma cor sólida por traço.
- Desfazer remove um gesto arco-íris completo; refazer o restaura sem multiplicar ações internas.
- Arco-íris é preservado após apagar parcialmente, salvar, reabrir e exportar.
- Paleta e popovers não deixam marcas ao abrir/fechar e não desenham por baixo dos controles.
- Dedo continua sem desenhar; apoio da palma não aciona controles ou deslocamentos de forma recorrente.
- Escolher um esboço nunca apaga/substitui o quadro anterior.
- Esboço e traços permanecem alinhados em zoom mínimo/máximo, pan e mudança de orientação.
- Borracha/desfazer/refazer não removem nem alteram o modelo.
- Reabrir preserva modelo, posição e desenho editável.
- Miniatura e PNG incluem o modelo e todos os traços na proporção correta.
- Quadros da V1 continuam abrindo e exportando corretamente.
- Erros de metadados/assets são visíveis e não destroem dados.
- Sessão acompanhada com criança confirma que o ganho de espaço não dificultou escolher cor, desenhar, apagar e desfazer.

## Fora desta entrega

Importação de fotos/PDFs, download de modelos, busca na internet dentro do app, câmera, preenchimento automático, restrição aos contornos, reconhecimento de desenhos, camadas editáveis, ajuste infantil de posição/opacidade do esboço e outros efeitos de pincel além do arco-íris proposto.
