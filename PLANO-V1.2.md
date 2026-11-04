# V1.2 — Três modos e catálogo de 100 ilustrações infantis

**Status: três modos e catálogo de 100 temas implementados, compilados e instalados no iPad como 1.2.0 (120), sem desinstalar. Após reprovar as primeiras artes geométricas, o responsável aprovou o gato natural, os seis pares V2 e autorizou a produção dos 100 temas. As 94 artes novas estão integradas, mas aguardam aprovação final. Manifesto em `catalog-awaiting-approval`. Validação interativa e medições reais no iPad permanecem pendentes. Detalhes e evidências em [IMPLEMENTACAO-V1.2.md](IMPLEMENTACAO-V1.2.md).**

## Aprovação registrada

O responsável confirmou:

1. **100 temas**, cada um disponível em **Seguir contorno** e **Colorir**.
2. **Temas e personagens originais** são suficientes; não é necessário um pacote com personagens específicos das franquias mencionadas.
3. **Colorir manualmente com a caneta**, sem balde de preenchimento nesta entrega.

O responsável aprovou os seis pares V2 e autorizou a expansão: “ok, parece bom, pode fazer tbm os 100 temas”. Registro: `Support/Illustrations/pilot-approval.json`. Os 100 temas já foram produzidos e instalados; isso não implica aprovação antecipada das 94 artes novas nem aprovação dos testes PencilKit.

Próximo marco: revisar a coleção em [review-100](Support/Illustrations/review-100/index.html), executar a regressão de contorno/seletor/isolamento e medir memória/fluidez no iPad, conforme [TESTES-IPAD.md](TESTES-IPAD.md). O processo abaixo preserva o plano e seus critérios de aceite; etapas de produção concluídas não substituem os portões de validação ainda pendentes.

## 1. Entendimento do pedido

A entrega precisa oferecer três atividades reconhecíveis, não apenas um quadro com ferramentas diferentes:

1. **Livre:** folha branca para inventar qualquer desenho.
2. **Seguir contorno:** uma figura-modelo clara e protegida serve de guia para a criança desenhar por cima, acompanhando suas linhas com a caneta.
3. **Colorir:** uma ilustração pronta, com contornos escuros e espaços amplos, funciona como uma página de livro de colorir.

O exemplo de gato enviado pelo responsável é uma referência do que significa uma figura em contorno:
https://pt.vecteezy.com/arte-vetorial/2852209-ilustracao-desenho-esboco-de-gato

Não basta mostrar um ícone de gato ou uma miniatura decorativa: a figura precisa aparecer grande na área de atividade e permitir traçar/pintar sobre ela. A referência será usada para entender essa função, sem incorporar a prévia do site ou presumir licença de distribuição.

### Situação da versão anterior

A V1.1 contém código para seis modelos e criação de quadro com esboço, mas a experiência não foi confirmada visualmente no iPad. O relato de que essa parte faltou deve ser tratado como falha da experiência entregue. Antes de expandir o catálogo, verificar se o fluxo está acessível e se a camada realmente aparece no dispositivo; não considerar resolvido só porque o código compila.

## 2. Quantidade proposta — sem ambiguidade

**100 temas/ilustrações originais, cada um disponível em Seguir contorno e Colorir.**

- Catálogo com 100 escolhas em cada uma das duas atividades guiadas.
- Cada tema terá duas apresentações preparadas para sua finalidade: guia simplificado e página de colorir.
- Isso representa **200 apresentações de atividade**, derivadas de 100 temas; não apenas 100 arquivos divididos em 50 para cada modo.
- As duas apresentações podem compartilhar partes da fonte vetorial, mas não devem ser duplicatas indiferenciadas.
- Quadros livres não consomem itens do catálogo.

Essa quantidade foi aprovada e implementada: 100 temas, com duas apresentações por tema.

## 3. Entrada e navegação

### Tela de escolha da atividade

Ao iniciar uma atividade ou tocar em **Novo desenho**, mostrar três cartões grandes ilustrados:

| Cartão | Imagem de exemplo | Destino |
|---|---|---|
| Livre | folha com rabisco colorido | novo quadro vazio |
| Seguir contorno | gato claro com parte do contorno refeito em cor | catálogo de guias |
| Colorir | figura parcialmente pintada | catálogo de páginas de colorir |

- A atividade deve ser reconhecível pelas imagens, sem depender da leitura.
- No primeiro uso, mostrar essa escolha diretamente.
- Nas sessões seguintes, oferecer continuar a atividade anterior e iniciar outra, sem descartar o trabalho aberto.
- Dentro do quadro, manter acesso visível à galeria e ao novo desenho, sem faixa permanente de largura total.
- Escolher outro modo/modelo sempre cria um quadro novo após salvar o atual.
- Não converter nem substituir silenciosamente o conteúdo aberto.

### Catálogo

- Grade de miniaturas grandes; paginação ou carregamento preguiçoso, sem carregar todos os assets em alta resolução de uma vez.
- Dez categorias ilustradas, mais uma visão de todos os temas.
- Mesmo tema e identificador em Seguir contorno e Colorir, mas miniatura específica de cada apresentação.
- Sem busca por texto obrigatória, downloads, anúncios ou bloqueios.
- Todo o catálogo funciona offline.
- Voltar não cria um quadro nem altera o anterior.

## 4. Comportamento dos três modos

### 4.1 Livre

- Preservar canetinha, cores, extras, espessuras, borracha, histórico e navegação existentes.
- Dedo não desenha; dois dedos movimentam/ampliam.
- Sem modelo obrigatório.

### 4.2 Seguir contorno

- Modelo grande, centralizado e sem deformação, em tom claro suficiente para distinguir o guia do traço feito pela criança.
- Usar como ponto inicial de avaliação aproximadamente 35%–45% de opacidade; definir o valor após teste de contraste no iPad, não como controle infantil obrigatório.
- Guia formado principalmente por silhueta e poucos detalhes importantes.
- A criança redesenha livremente as linhas com a caneta, sem encaixe automático ou avaliação de acerto.
- Não bloquear desenhar fora da figura.
- Modelo protegido abaixo da tinta: borracha e desfazer só alteram o trabalho da criança.
- Sem seleção, arraste, escala ou troca acidental do modelo.
- Pontilhado, números de ordem e animação de percurso ficam fora desta entrega.

### 4.3 Colorir

- Ilustração pronta com contornos escuros, espessura uniforme e áreas grandes para pintar.
- Pintura manual com a caneta, como um livro de colorir; oferecer espessura larga adequada para preencher áreas sem centenas de movimentos.
- **Nesta proposta, colorir não significa balde de preenchimento automático.** O primeiro escopo é pintar à mão; balde só entra mediante aprovação de escopo adicional.
- Camada da pintura abaixo dos contornos protegidos para que os riscos pretos continuem legíveis quando a criança pinta por cima.
- Borracha e histórico alteram somente a pintura.
- Pintar fora da linha é permitido. Não haverá recorte automático por região, nota, punição ou exigência de precisão.
- As páginas terão regiões visualmente fechadas e compreensíveis, embora não exista algoritmo de preenchimento nesta etapa.
- Referência de experiência: livro de colorir acolhedor, com cenas simples e formas arredondadas, como o tipo de atividade mencionado como “Bobbie Goods”. Produzir composição e personagens próprios, sem copiar páginas comerciais, logotipos ou identidade gráfica.

### Regras comuns

- Modelo e tinta compartilham exatamente as mesmas coordenadas, zoom e deslocamento.
- Reenquadrar considera modelo + todos os traços, com margens para os controles.
- Salvar/reabrir mantém posição, modo e edição.
- Miniatura e exportação reproduzem a ordem correta das camadas de cada modo.
- O arco-íris continua sujeito à prova técnica da V1.1; a expansão de catálogo não depende da sua aprovação.

## 5. Preferências da criança e personagens conhecidos

Interesses informados: **Gabby/Gabi, Turma da Mônica, Polly Pocket e Avatar: A Lenda de Aang**.

### Proposta inicial

Organizar os temas em torno dos interesses: gatos e casinhas mágicas, brincadeiras entre amigos, pequenos mundos e aventuras com água, terra, ar e fogo. Isso permite criar um catálogo original imediatamente, sem apresentar personagens inventados como se fossem os personagens conhecidos.

**Decisão registrada:** o responsável confirmou que personagens e temas originais são suficientes; não é necessário pacote com personagens específicos.

Se personagens específicos forem requisito, registrar quais e tratar esse pacote separadamente antes de produzir: origem das artes, condições de uso pretendido (por exemplo, uso familiar ou distribuição do aplicativo), permissões aplicáveis e autoria. Não presumir que possuir o app, baixar uma imagem ou gerar uma imagem concede licença oficial; não anunciar vínculo com as franquias. Essa decisão não impede planejar e produzir os temas originais.

O catálogo abaixo é a base original aprovada e implementada. Não inclui nem promete personagens licenciados.

## 6. Catálogo proposto — 100 temas originais

Cada linha contém dez temas; cada tema recebe variante de contorno e de colorir.

### A. Gatos e casinhas mágicas — 10

1. Gatinho sentado.
2. Gatinho brincando com novelo.
3. Gatinho numa caixa.
4. Gatinho com chapéu de festa.
5. Dois gatinhos amigos.
6. Casinha em formato de gato.
7. Quarto de um gatinho.
8. Gatinho confeiteiro.
9. Gatinho no jardim.
10. Gatinho observando estrelas.

### B. Bichinhos amigos — 10

11. Cachorrinho com bola.
12. Coelho com cenoura.
13. Ursinho sentado.
14. Raposinha sorridente.
15. Elefantinho com flor.
16. Leão de juba redonda.
17. Girafa pequena.
18. Panda com bambu.
19. Preguiça num galho.
20. Ovelhinha fofa.

### C. Jardim e natureza — 10

21. Borboleta com asas grandes.
22. Flor num vaso.
23. Joaninha numa folha.
24. Abelhinha junto à flor.
25. Caracol no jardim.
26. Cogumelos e capim.
27. Árvore com frutos.
28. Regador com flores.
29. Arco-íris com nuvens.
30. Sol e jardim.

### D. Amizade e brincadeiras — 10

31. Duas crianças pulando corda.
32. Criança com coelho de pelúcia.
33. Amigos soltando pipa.
34. Amigos brincando de bola.
35. Piquenique no parque.
36. Criança com bolhas de sabão.
37. Criança desenhando numa mesa.
38. Brincadeira de esconde-esconde.
39. Amigos montando blocos.
40. Festa de aniversário pequena.

### E. Pequenos mundos e bonecas — 10

41. Casinha de boneca aberta.
42. Quartinho com cama e brinquedos.
43. Cozinha de brinquedo.
44. Castelo pequeno.
45. Jardim de uma fadinha original.
46. Carruagem de flores.
47. Maletinha com um pequeno mundo.
48. Lojinha de brinquedos.
49. Parque de diversões em miniatura.
50. Boneca e seu bichinho.

### F. Aventuras dos quatro elementos — 10

51. Criança aventureira com redemoinho de ar.
52. Criança aventureira com uma onda de água.
53. Criança aventureira com pedras flutuantes.
54. Criança aventureira com pequena chama fantástica.
55. Templo nas nuvens.
56. Barquinho num lago tranquilo.
57. Ponte entre montanhas.
58. Criatura voadora original de formas arredondadas.
59. Jardim com símbolos dos quatro elementos.
60. Grupo de pequenos aventureiros.

### G. Momentos aconchegantes — 10

61. Ursinho tomando chocolate.
62. Coelhinho preparando biscoitos.
63. Gatinho lendo no sofá.
64. Bichinhos numa cabana.
65. Banho de espuma de um patinho.
66. Raposinha cuidando de plantas.
67. Ursinho numa livraria.
68. Coelhinho numa barraca de frutas.
69. Bichinhos numa festa do pijama.
70. Gatinho olhando a chuva pela janela.

### H. Veículos e passeios — 10

71. Carrinho sorridente.
72. Trem com dois vagões.
73. Ônibus escolar simples.
74. Bicicleta com cestinha.
75. Balão de ar quente.
76. Foguete com estrelas.
77. Barco à vela.
78. Trator no campo.
79. Avião de formas arredondadas.
80. Caminhão de sorvete.

### I. Mar e fantasia — 10

81. Tartaruga marinha.
82. Golfinho saltando.
83. Peixinho com bolhas.
84. Polvinho simpático.
85. Cavalo-marinho.
86. Sereia original com concha.
87. Unicórnio com nuvem.
88. Dragãozinho amigável.
89. Dinossauro com flor.
90. Castelo de areia com estrela-do-mar.

### J. Comidinhas e celebrações — 10

91. Cupcake com morango.
92. Sorvete de duas bolas.
93. Cesta de frutas.
94. Bolo de aniversário.
95. Pizza em prato redondo.
96. Xícara com biscoitos.
97. Presente com laço grande.
98. Balões de festa.
99. Coroa e varinha de brincadeira.
100. Mesa de lanche dos bichinhos.

## 7. Produção das artes — trabalho necessário, não apenas enumeração

### Guia visual

- Artes efetivamente desenhadas como vetores originais, não ícones de sistema, emojis ampliados nem a mesma figura repetida com acessórios mínimos.
- Formas reconhecíveis para 3–5 anos, contornos suaves, sem violência, sustos ou excesso de detalhes.
- Variante de seguir contorno: figura isolada ou composição muito simplificada, com poucas linhas internas.
- Variante de colorir: mesma ideia com regiões amplas; nas cenas, poucos objetos principais e fundo simples.
- Criar gradação de complexidade: aproximadamente 40 temas simples, 40 intermediários e 20 cenas mais elaboradas, mantendo todos adequados à idade.
- Cenas de vários personagens podem ser simplificadas para a variante de contorno sem perder a identidade do tema.

### Processo de produção

1. Criar primeiro **seis pares de amostra**, contemplando gato, criança com brinquedo, pequeno mundo, aventura dos elementos, cena aconchegante e veículo.
2. Revisar as amostras no iPad com o responsável: reconhecimento, contraste, tamanho das áreas de pintura e interesse da criança.
3. Aprovar o padrão antes de gerar as outras 94 ilustrações.
4. Produzir lotes de aproximadamente 20 temas, com revisão visual de todos os itens; geração em lote não substitui inspeção.
5. Corrigir anatomia estranha, linhas sobrepostas, regiões muito pequenas, formas cortadas, duplicatas e cenas excessivamente complexas.
6. Publicar o catálogo completo somente após revisão e teste de assets.

### Entregáveis por tema

- Fonte vetorial editável, organizada por ID e versão.
- Asset de runtime para seguir contorno.
- Asset de runtime para colorir, permitindo desenhar abaixo dos contornos.
- Duas miniaturas leves específicas dos modos.
- Registro de título, categoria, complexidade, proporção, versão, autoria/origem e condições de uso.

Preferir PNG transparente de resolução adequada para runtime inicialmente, preservando SVG como fonte; avaliar PDF vetorial em prova isolada. Não adicionar renderizador SVG ao aplicativo apenas para este catálogo.

## 8. Arquitetura e persistência

### Atividade versionada

Evoluir metadados para distinguir explicitamente:

- `free`;
- `trace` (seguir contorno);
- `coloring`.

Persistir ID estável da ilustração, versão, variante, retângulo no quadro e parâmetros necessários para reproduzir a apresentação (incluindo contraste/opacidade do guia quando fizerem parte da versão da atividade).

- Continuar usando PKDrawing para a tinta editável.
- Preservar snapshot único/commit atômico de tinta + metadados.
- Não reescrever todos os quadros ao atualizar o aplicativo.
- Preservar fila serial e proteção contra conclusões antigas do autosave.
- Não remover nem substituir assets usados por quadros antigos.

### Compatibilidade

- V1 sem modelo continua como Livre.
- V1.1 com tipo `template` mantém a apresentação e os assets antigos. Não clarear o modelo ou trocar ordem de camadas de um quadro salvo só porque surgiu Seguir contorno.
- Resolver esse legado como apresentação antiga explicitamente suportada; novas atividades usam os novos tipos.
- Metadados corrompidos e assets ausentes continuam produzindo erro visível, sem abrir/exportar um quadro incompleto e sem sobrescrever o original.

### Composição

- Livre: branco → tinta.
- Seguir contorno: branco → guia claro → tinta.
- Colorir: branco → pintura → contornos protegidos.
- A mesma política de composição deve reger canvas, miniatura e PNG.
- Transformação compartilhada entre todas as camadas; nada de modelo SwiftUI fixo que se desalinhe ao mover/ampliar.
- Exportar união de modelo e traços, incluindo pintura fora dos contornos; maior lado até 2048 pixels.

### Catálogo e memória

- Manifesto de catálogo versionado no bundle, com validação de IDs únicos e referências a arquivos.
- Carregar thumbnails no catálogo; carregar alta resolução apenas para a atividade selecionada.
- Cache limitado e descarte ao receber pressão de memória.
- Medir tamanho do bundle com 100 temas/200 variantes antes de fixar resolução final. Evitar duplicar PNG idêntico quando a distinção puder ser expressa com parâmetros seguros de apresentação.
- Tudo local; não introduzir rede ou download obrigatório.

## 9. Etapas e portões de aprovação

1. **Aprovar escopo:** três modos, 100 temas com duas apresentações, pintura manual e escolha entre temas originais/pacote de personagens específicos.
2. **Diagnosticar V1.1 no iPad:** confirmar por que o esboço não foi percebido e corrigir fluxo ou renderização antes de expandir.
3. **Provar os modos com um gato:** Livre, guia claro com tinta acima, colorir com contorno acima da pintura. Verificar zoom/pan/rotação, borracha e histórico.
4. **Produzir seis pares-piloto e aprovar a direção visual.** Não gerar os 100 antes dessa aprovação.
5. **Implementar navegação e catálogo**, ainda com amostras.
6. **Implementar metadados e migração compatível**, preservando quadros anteriores.
7. **Produzir/revisar os outros 94 temas em lotes.** Registrar origem das artes.
8. **Integrar catálogo completo, miniaturas e exportação**, com validação automática de manifesto/assets.
9. **Regressão de persistência e desempenho**: alternância entre modos, background, reabertura, erro de asset/metadados, memória e quadros legados.
10. **Compilar, revisar, instalar pelo fluxo xtool autorizado e testar no iPad**, com sessão acompanhada com a criança.

Os seis pares e o uso de personagens originais foram aprovados; produção, integração, build e instalação dos 100 temas foram concluídos. Revisão local das dez folhas de contato e ampliações selecionadas registrada em `Support/Illustrations/REVISAO-100.md`; não equivale à aprovação final das 94 novas artes. Regressão interativa, medições no iPad e sessão com a criança continuam pendentes.

## 10. Critérios de aceite

### Experiência

- Os três modos estão acessíveis e identificáveis visualmente.
- O responsável consegue abrir uma figura de contorno sem descobrir um fluxo escondido na galeria.
- O contorno aparece de fato no iPad, grande e legível; não apenas na miniatura.
- Seguir contorno e Colorir têm finalidades e apresentação claramente diferentes.
- A criança consegue escolher, traçar/pintar, apagar e desfazer sem leitura obrigatória.
- Selecionar atividade nunca apaga ou substitui trabalho anterior.

### Catálogo e arte

- Manifesto contém exatamente 100 IDs de temas únicos, todos revisados.
- Cada tema tem apresentação e miniatura válidas para os dois modos guiados.
- Nenhum item é arquivo vazio, placeholder, ícone de sistema ou duplicata disfarçada.
- Categorias, variedade e gradação de complexidade atendem ao catálogo aprovado.
- Origem/autoria/condições de uso registradas; personagens conhecidos somente conforme decisão específica do pacote.

### Desenho e segurança dos dados

- Contorno/guia não pode ser apagado, arrastado ou removido por desfazer.
- Cor sólida, extras, borracha e histórico funcionam nos três modos; arco-íris somente se aprovado na prova própria.
- Colorir mantém os contornos escuros visíveis mesmo após pintar por cima deles.
- Dedo não desenha; palma e caneta WB testadas no aparelho.
- Alinhamento mantido em zoom mínimo/máximo, pan e rotação.
- Fechar/reabrir preserva modo, ilustração, posição e tinta editável.
- Quadros V1/V1.1 mantêm aparência e dados, inclusive modelos antigos.
- Miniatura e PNG correspondem à atividade e incluem tinta fora da figura.
- Falhas de metadados/assets são visíveis e não causam sobrescrita destrutiva.

### Desempenho e validação

- Catálogo não carrega 200 imagens em alta resolução simultaneamente.
- Rolagem e seleção continuam responsivas no iPad alvo; nenhum encerramento por memória nos testes de alternância.
- Medição real da área livre e acessibilidade dos controles em retrato/paisagem/janela estreita.
- Aprovação do responsável para as seis amostras e para o catálogo final.
- Sessão acompanhada confirma interesse da criança e compreensão dos três modos.

## 11. Fora deste primeiro escopo

Balde de tinta, recorte automático dentro das linhas, correção do traçado, pontuação, pressão obrigatória, reconhecimento de desenho, importação de páginas da internet, câmera, download de pacotes, impressão, animações instrutivas, compras, contas e editor infantil de camadas/modelos.

## 12. Decisões e próximo marco

- **Aprovado:** 100 temas, cada um com variante Seguir contorno e Colorir.
- **Aprovado:** personagens e temas originais ligados aos interesses mencionados; pacote de personagens específicos não é necessário.
- **Aprovado:** colorir manualmente com caneta; balde fora do escopo.
- **Referência visual aprovada:** novo par de gato com proporções naturais, já integrado ao catálogo como versão 2. Quadros existentes conservam assets e versões anteriores.
- **Pilotos e produção aprovados:** seis pares V2; catálogo de 100 temas produzido e instalado, com versões anteriores preservadas.
- **Próximo marco:** responsável revisar as 94 novas artes e executar testes de contorno/seletor/isolamento, caneta/palma, exportação e desempenho no iPad. Registrar correções por número/ID; artes publicadas só podem mudar em versão nova. Aceite final e sessão com a criança permanecem pendentes.
