---
name: Quadro Livre — PWA
description: Sistema visual observado no protótipo React de desenho livre.
colors:
  ink: "#353345"
  accent: "#6353ba"
  accent-soft: "#eeebfa"
  teal: "#146e68"
  muted: "#686579"
  line: "#dedce9"
  surface: "#f4f4fb"
  white: "#fff"
  hand-selected: "#e1f4ef"
  eraser: "#bc3566"
  eraser-selected: "#fce8f0"
  width-selected: "#e3dff3"
  tool-hover: "#e7e3f6"
  accent-deep: "#514298"
  export-hover: "#ded7f3"
  save-error: "#aa3049"
  error-background: "#fff0f1"
  error-text: "#89293e"
  form-error: "#a22945"
typography:
  title: {fontFamily: 'ui-rounded, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', fontSize: "20px", fontWeight: 750, letterSpacing: "-0.025em"}
  headline: {fontSize: "clamp(25px, 4vw, 34px)", fontWeight: 650, letterSpacing: "-0.03em"}
  body: {fontSize: "14px", lineHeight: 1.65}
  label: {fontSize: "12px"}
  gate: {fontSize: "24px", fontWeight: 650}
rounded:
  radius: "16px"
  action: "10px"
  primary: "12px"
  dock: "24px"
  dock-mobile: "22px"
  circle: "50%"
spacing:
  gap-small: "8px"
  gap-medium: "10px"
  gap-large: "16px"
  palette-padding: "18px"
  dialog-padding: "28px"
  dialog-mobile-padding: "20px"
components:
  tool: {textColor: "{colors.accent}", rounded: "{rounded.radius}", padding: "0", size: "56px"}
  tool-selected: {backgroundColor: "{colors.accent-soft}"}
  tool-hover: {backgroundColor: "{colors.tool-hover}"}
  hand: {textColor: "{colors.teal}"}
  hand-selected: {backgroundColor: "{colors.hand-selected}"}
  eraser: {textColor: "{colors.eraser}"}
  eraser-selected: {backgroundColor: "{colors.eraser-selected}"}
  width-selected: {backgroundColor: "{colors.width-selected}"}
  button-primary: {backgroundColor: "{colors.accent}", textColor: "{colors.white}", rounded: "{rounded.primary}"}
  button-primary-hover: {backgroundColor: "{colors.accent-deep}"}
  button-export: {backgroundColor: "{colors.accent-soft}", textColor: "{colors.accent-deep}", rounded: "{rounded.action}", padding: "12px 14px"}
  button-export-hover: {backgroundColor: "{colors.export-hover}"}
  input: {backgroundColor: "{colors.surface}", textColor: "{colors.ink}", rounded: "{rounded.action}", padding: "12px 16px"}
  dock: {backgroundColor: "{colors.surface}", rounded: "{rounded.dock}", padding: "9px"}
  palette: {backgroundColor: "{colors.surface}", rounded: "{rounded.radius}", padding: "{spacing.palette-padding}", width: "264px"}
---

# Design System: Quadro Livre — PWA

## Overview
Registro da interface implementada em `src/style.css`, `src/App.jsx` e `src/Icon.jsx`, servida por `index.html`. Composição herdada de `../Sources/QuadroLivre/DrawingScreen.swift`; valores web vêm do CSS, não dos estilos SwiftUI.
Quadro branco e controles grandes são escolhas confirmadas. Não há metáfora ou voz de marca definida neste registro.
**Key Characteristics:**
- Canvas branco em tela inteira, com controles periféricos.
- Ferramentas arredondadas, ícones de contorno e seleção visível.
- Dock inferior central e área modal dos responsáveis.

## Colors
### Primary
`accent` colore caneta, histórico, foco e ação principal; `accent-soft` marca seleção e ações de exportação. `accent-deep` serve ao hover principal e ao texto da exportação.
### Secondary
`teal` identifica mover, reenquadrar e estado de salvamento; `hand-selected` acompanha a mão selecionada. `eraser` e `eraser-selected` identificam borracha e sua seleção.
### Neutral
`white` mantém quadro e superfícies superiores; `surface` preenche dock, paleta e campo. `ink`, `muted` e `line` distinguem texto, apoio e divisórias. Tokens de erro correspondem a salvamento, banner e formulário; mensagens também identificam o erro.
Paleta de desenho é separada das cores dos controles: 16 amostras de `src/model.mjs` (Preto, Roxo, Azul, Verde, Rosa, Vermelho, Laranja, Amarelo, Branco, Cinza, Marrom, Pêssego, Rosa claro, Lilás, Azul claro, Verde claro) e seletor nativo de cor com rótulo “Outra cor”. Não confundir verde da tinta com `teal` da interface.

## Typography
Toda interface herda a pilha de sistema de `typography.title`; botões e campos herdam a fonte. Não há fonte baixada ou escala proporcional declarada.
Título usa `title`; vazio usa `headline`; parágrafos do modal usam `body`; instruções e estados usam `label`; desafio usa `gate`. No mobile, título passa a (17px); cabeçalho do modal passa de (22px) para (20px). Campo usa (24px); exportação (13px/650); saída de zoom usa algarismos tabulares.

## Layout
Canvas absoluto ocupa (100% × 100dvh), sem rolagem do corpo. Topo distribui identidade à esquerda e ações à direita; margens incorporam `env(safe-area-inset-*)`. Dock e mensagens ficam centralizados embaixo; zoom fica à direita.
Até (1050px), zoom sobe para (152px) da base. Até (700px), topo compacta e salvamento passa abaixo. Até (599px), dock vira grade de cinco colunas, largura (310px), ferramentas (52px), espessuras ocupando três colunas; zoom sobe para (256px), sem sobrepor seletor de entrada. Até (350px), dock mede (286px), subtítulo desaparece e dica vazia sobe para 32% da altura.
Em altura máxima (500px) com largura mínima (600px), instruções secundárias somem e zoom fica a (120px) da base. Modal mede no máximo (560px), limitado à janela com margem total (32px); conteúdo pode rolar. Breakpoints completos constam no sidecar.

## Elevation & Depth
Dock, paleta, banner e modal compartilham `--elevation`, registrado no sidecar. Seleção usa contorno interno, não elevação. Modal aplica backdrop translúcido (`rgb(39 34 58 / 30%)`). Não há transições ou animações declaradas no CSS.

## Shapes
`radius` é a curva recorrente de ferramentas e painéis; dock usa curvas próprias. Campos e exportação usam `action`; ação principal e espessuras usam `primary`. Amostras de cor e indicadores de espessura são circulares. Divisória do dock mede (1px × 28px).

## Components
- **Entrada:** seletor textual Dedo/Caneta acima da instrução e do dock, sem acrescentar ferramentas ao dock. Grupo acessível “Desenhar com”; alvos mínimos (88 × 44px), superfície existente e seleção por `aria-pressed`, fundo e contorno. Caneta é padrão por sessão; Dedo habilita toque para tinta/borracha, mantendo gestos com dois dedos. Instruções e nome acessível do canvas acompanham a escolha. Reenquadramento reserva espaço para o seletor.
- **Ferramentas:** alvo padrão (56px); zoom, fechar e ações superiores compactas usam (44px). Seleção usa `aria-pressed`, fundo e contorno interno (2px); mão e borracha têm pares de cor próprios. Hover só existe em dispositivos com hover; desabilitado usa opacidade (0.32).
- **Foco:** botões, campos e canvas usam outline de (3px) em `accent`, afastado (4px). Não há estilo `:active` próprio, exceto cursor da mão no canvas.
- **Espessuras e paleta:** três círculos (6/12/18px) representam traços (4/10/22); botões de espessura medem (44 × 52px), largura (48px) no mobile. Paleta tem quatro colunas, 16 amostras (48px), check e outline na seleção; cores claras usam check em `ink` e branco tem borda interna visível. “Outra cor” usa `input type="color"` nativo (72 × 48px). Altura da paleta é limitada à janela, com rolagem interna em telas baixas.
- **Instrumentos:** um único botão no lugar da canetinha abre painel de (264px), com quatro opções em duas colunas e alvos de altura mínima (72px): Canetinha, Caneta, Lápis e Giz de cera. Ícone do botão e instrução do editor identificam escolha atual; seleção usa `aria-pressed`, `accent-soft` e contorno. Painel compartilha superfície, sombra e rolagem da paleta, fecha ao escolher, tocar fora ou pressionar Escape; Escape/escolha devolvem foco ao botão. Cor e espessura preservam instrumento escolhido, inclusive ao sair da mão/borracha. Dock não ganha colunas ou linhas. Traços têm aparências distintas e texturas fixas no quadro, não nos controles.
- **Modal e ações:** campo com altura mínima (56px), ação principal (52px) e exportação (48px). Banner oferece recuperação; erro do formulário aparece junto ao campo. Modal mantém rótulo e botão de fechar acessíveis.
- **Ícones:** SVG inline, viewBox (24 × 24), sem preenchimento, stroke (1.8), pontas e junções arredondadas; tamanho padrão (26px), variantes observadas (16/20/24px). Botões fornecem nomes acessíveis.

## Do's and Don'ts
### Do:
- **Do** manter quadro branco e controles grandes, conforme aprovação registrada.
- **Do** preservar foco visível, nomes acessíveis e seleção com fundo e contorno.
### Don't:
- **Don't** tratar cores da paleta de desenho como substitutas automáticas dos tokens da interface.
- **Don't** presumir validação em iPad físico a partir destas medidas ou capturas.
