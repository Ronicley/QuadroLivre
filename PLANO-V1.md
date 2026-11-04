# Quadro Livre — Plano da V1

Status: escopo aprovado, implementação inicial compilada/assinada e instalada no iPad. Abertura manual e aceite funcional pendentes. Nome provisório: Quadro Livre.

Entrega: ver `README.md`, `REVISAO.md` e `TESTES-IPAD.md`. Após autorização explícita do responsável, instalação via xtool concluída com conexão pelo serviço do Apple Devices no Windows. A abertura automática retornou erro de debugserver; confirmar abertura manual e validar a WB no dispositivo.

## Objetivo

Aplicativo de desenho offline para crianças de 3 a 5 anos, inicialmente validado no iPad de 11ª geração (A16). Abrir, escolher uma cor e desenhar sem leitura, cadastro ou configuração obrigatória.

## Plataforma e entrada

- Aplicativo nativo para iPad, desenvolvido em Swift com SwiftUI e PencilKit (PKCanvasView integrado à interface).
- Compilação e assinatura com o xtool já instalado.
- O iPad está conectado ao computador, conforme informado pelo responsável.
- Na etapa de instalação, usar o Apple Devices já instalado no Windows. Validar o fluxo disponível de transferência/instalação do aplicativo assinado; não presumir que o Apple Devices aceite instalação direta de qualquer IPA.
- A caneta desenha; dedos não desenham no modo padrão, mas acionam controles e gestos de navegação.
- Priorizar compatibilidade com canetas ativas reconhecidas como stylus pelo iPadOS, sem restringir por marca. Não prometer compatibilidade universal.
- Caneta de validação: Pencil WB do link de referência.
- Não depender de pressão ou inclinação para obter um traço utilizável e previsível.
- Canetas capacitivas reconhecidas como dedo ficam fora do modo padrão. Compatibilidade ampliada, se necessária, será avaliada após a prova técnica; não é requisito da V1.

## Risco prioritário e prova técnica

A página da WB apresenta informações contraditórias sobre compatibilidade com o iPad de 11ª geração. Antes da interface completa, validar no dispositivo real:

1. Configuração de SDK e assinatura via xtool, conexão com o iPad e validação do fluxo de instalação usando Apple Devices no Windows.
2. Captura dos traços da WB no PencilKit com política somente caneta.
3. Dedos não produzem traços.
4. Apoiar a palma não produz traços nem deslocamentos indesejados.
5. Traço contínuo, sem falhas recorrentes ou atraso que prejudique o uso.

Se a WB não funcionar ou não for identificada como caneta, discutir hardware ou política de entrada antes de seguir. Não ampliar silenciosamente o modo para desenho com dedo.

## Experiência e interface

- Abrir diretamente no último quadro; no primeiro uso, criar um quadro vazio.
- Área de desenho como protagonista, sem bordas de página visíveis.
- Barra própria, simples, sem expor uma paleta profissional completa.
- Oito cores: vermelho, laranja, amarelo, verde, azul, roxo, preto e branco.
- Cor selecionada com contorno e destaque visual, não apenas mudança de cor.
- Uma canetinha com traço arredondado e três espessuras; seleção de tamanho aparece ao tocar na ferramenta.
- Borracha generosa, com estado ativo evidente.
- Desfazer visível; refazer disponível como controle secundário.
- Controles principais com áreas de toque propostas de pelo menos 60 × 60 pontos.
- Não exigir leitura, nomes de desenhos, digitação ou gestos secretos para ações essenciais.
- Suportar retrato e paisagem sem modificar as coordenadas ou perder traços do quadro.

## Quadro livre

- Área ampla/expansível com limites técnicos definidos após a prova de desempenho; não prometer espaço literalmente infinito.
- Dois dedos para movimentação e zoom, com limites conservadores de escala.
- Botão ilustrado para enquadrar todo o desenho; quando vazio, voltar à visão inicial.
- Sem rotação do quadro na V1.
- Se gestos durante o desenho causarem deslocamentos acidentais com a palma, adotar um modo explícito de movimentação. A decisão depende do teste real.

## Persistência e galeria

- Salvamento automático local do desenho editável, metadados e miniatura.
- Restaurar o último quadro ao reabrir.
- Galeria de miniaturas grandes, sem nomes obrigatórios.
- Criar um quadro novo preserva os anteriores.
- Sem ação destrutiva de apagar tudo na barra infantil.
- Exportação em PNG e exclusão de quadros na área dos responsáveis.
- Exclusão com confirmação.
- Separação da área dos responsáveis não deve ser apresentada como segurança forte. Mecanismo de acesso a detalhar no esboço da interface.
- Sem conta, anúncios, compras, backend ou conexão obrigatória.

## Fora da V1

- Camadas, modos de mistura, balde de preenchimento e pincéis personalizados.
- Adesivos, carimbos, sons e animações durante o desenho.
- Importação de fotos/PDFs, exportação PDF/SVG e gravação do processo.
- iCloud, colaboração e IA.
- Garantia de suporte a qualquer caneta ou a espaço infinito sem limites.

## Arquitetura inicial

- SwiftUI: navegação, controles infantis, galeria e área dos responsáveis.
- PencilKit/PKCanvasView: captura e renderização dos traços.
- Camada de armazenamento local: desenho editável, metadados e miniatura, com gravação segura e tratamento de erros.
- Serviço de exportação: PNG da região desenhada, sem tentar renderizar toda a área navegável vazia; limitar dimensões para evitar consumo excessivo de memória.
- Evitar dependências externas desnecessárias.
- Versão mínima do iPadOS será definida ao verificar o dispositivo, SDK e APIs necessárias.

## Etapas de implementação

1. Validar ambiente xtool e prova técnica com WB no iPad real.
2. Esboçar a tela infantil e confirmar distribuição dos controles.
3. Implementar quadro, ferramentas, cores, espessuras, borracha e histórico.
4. Implementar navegação e reenquadramento; testar apoio da palma e desempenho.
5. Implementar salvamento, restauração e galeria.
6. Implementar área dos responsáveis, exportação e exclusão.
7. Testar no dispositivo e observar uma sessão de uso infantil acompanhada de responsável.

## Critérios de aceite

- A WB validada desenha no iPad alvo e o dedo não desenha no modo padrão.
- A criança consegue selecionar cores e desenhar sem precisar ler.
- Apoiar a mão não cria marcas nem navegação acidental recorrente.
- Borracha, três espessuras e desfazer/refazer funcionam sem comprometer o salvamento.
- Movimentação e zoom preservam os traços; o botão de reenquadramento recupera o desenho.
- Alternar orientação não perde nem deforma conteúdo.
- Após o salvamento automático concluir, fechar e reabrir restaura o desenho editável.
- Novo quadro preserva o anterior e ambos podem ser abertos na galeria.
- Exportação gera PNG utilizável; exclusão exige confirmação na área dos responsáveis.
- Todas as funções essenciais funcionam sem internet.

## Referências consultadas

- PencilKit: https://developer.apple.com/documentation/pencilkit
- PKCanvasView: https://developer.apple.com/documentation/pencilkit/pkcanvasview
- Política de entrada: https://developer.apple.com/documentation/pencilkit/pkcanvasview/drawingpolicy
- Procreate: https://procreate.com/procreate
- Sketchbook: https://www.sketchbook.com/apps
- Concepts: https://concepts.app/en/
- xtool: https://github.com/xtool-org/xtool
- Caneta WB: https://www.wb.com.br/caneta-pencil-wb-para-ipad-com-palm-rejection-e-ponta-de-alta-precisao-1-0mm-1-preto
