# Quadro Livre — protótipo PWA

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React, escolhido pelo responsável. Vite para desenvolvimento e build estático; Canvas, Pointer Events e IndexedDB nativos do navegador. Sem backend.

## Users

Crianças de 3 a 5 anos desenhando no iPad com caneta; responsáveis acompanham instalação, testes e exportações.

## Product Purpose

Validar uma alternativa instalável e offline ao aplicativo Swift, sem substituir ou alterar o aplicativo existente.

## Capabilities and Constraints

Primeira entrega aprovada: desenho livre por caneta, zoom e movimentação com dois dedos, desfazer/refazer e salvamento local offline. Mouse permite testar no computador; dedo não desenha. Manter quadro branco e controles grandes. Catálogo completo, galeria e conversão de PKDrawing ficam para outra etapa. A primeira abertura exige conexão e HTTPS (localhost é permitido para desenvolvimento).

## Evidence on Hand

`../Sources/QuadroLivre/DrawingScreen.swift` define a interface existente. `../Support/AppIcon.png` é o ícone original. As ilustrações existentes não fazem parte deste protótipo.

## Product Principles

- Preservar o aplicativo Swift e seus dados.
- Não enviar desenhos para servidores.
- Nunca informar sucesso de salvamento antes da confirmação do IndexedDB.
- Validar caneta, palma e desempenho no aparelho antes de ampliar o escopo.

## Accessibility & Inclusion

Controles grandes, nomes acessíveis, navegação por teclado e mensagens de erro com recuperação. Rejeição de palma depende do navegador e da caneta; não presumir equivalência com PencilKit.
