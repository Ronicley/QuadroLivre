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

Primeira entrega aprovada: desenho livre por caneta, zoom e movimentação com dois dedos, desfazer/refazer e salvamento local offline. Continuação solicitada: galeria local, vários quadros e funções restantes; responsável escolheu abrir o app na galeria e continuar com Seguir contorno, Colorir e catálogo existente. Inclui exportação composta, restauração do backup web como cópia e exclusão confirmada por responsável. Mouse permite testar no computador; seletor Dedo/Caneta habilita desenho por toque ou preserva entrada somente por caneta/mouse. Caneta é o padrão de cada sessão; dois dedos movem/ampliam nos dois modos. Modo Dedo não garante rejeição de palma. Manter quadro branco e controles grandes. Conversão de PKDrawing fica fora do escopo. A primeira abertura exige conexão e HTTPS (localhost é permitido para desenvolvimento).

## Evidence on Hand

`../Sources/QuadroLivre/DrawingScreen.swift` define a interface existente. `../Support/AppIcon.png` é o ícone original. `catalog/` contém cópias exatas das ilustrações referenciadas pelo catálogo nativo, com versões arquivadas. Coleção mantém estado de revisão: seis pares-piloto aprovados, 94 artes aguardando revisão final; funcionalidade web não constitui aprovação artística.

## Product Principles

- Preservar o aplicativo Swift e seus dados.
- Não enviar desenhos para servidores.
- Nunca informar sucesso de salvamento antes da confirmação do IndexedDB.
- Validar caneta, palma e desempenho no aparelho antes de ampliar o escopo.

## Accessibility & Inclusion

Controles grandes, nomes acessíveis, navegação por teclado e mensagens de erro com recuperação. Rejeição de palma depende do navegador e da caneta; não presumir equivalência com PencilKit.
