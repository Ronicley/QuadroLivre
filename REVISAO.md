# Revisão por subagente

Revisor: processo independente do Pi em modo print, com apenas a ferramenta de leitura. Nenhuma permissão de edição foi delegada. Tentativas anteriores pelo Codex não chegaram à revisão devido à indisponibilidade dos modelos na conta.

## Achados e correções

1. **P1 — Canvas sem armazenamento após falha inicial:** bloquear interação quando não há quadro ativo e adicionar recuperação que reinicializa o armazenamento. Aplicado.
2. **P2 — Autosave pesado na thread principal:** serialização, escrita, miniatura e listagem do autosave passam por fila serial de background. Snapshot e revisão preservam ordem e descartam conclusões obsoletas. Transições e saída de primeiro plano usam flush síncrono para segurança. Aplicado.
3. **P2 — Controles cortados em janelas estreitas:** linhas de cores e ferramentas com rolagem horizontal; título permite redução. Aplicado. Avaliar usabilidade infantil na tela real.
4. **P2 — Recuperação não repetia listagem da galeria:** flush repete a listagem mesmo quando não há desenho sujo. Aplicado.

## Ajustes adicionais

- Erros exibidos também dentro da galeria e da área dos responsáveis, sem depender de alerta atrás de modal.
- Escala mínima de enquadramento calculada a partir do viewport para caber o quadro completo.
- Exportação limitada em dimensão e recortada ao conteúdo.

## Limites da revisão

Revisão estática não confirma compatibilidade da WB, rejeição de palma, comportamento do histórico do PencilKit, desempenho, orientação ou apresentação visual. Esses itens permanecem em `TESTES-IPAD.md`.
