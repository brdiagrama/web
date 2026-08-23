---
trigger: always_on
---

Regras de Implementação

Ao implementar qualquer solicitação neste projeto, siga estas regras:

Priorize simplicidade, clareza e resultado. Entregue a solução correta com o menor código necessário, sem sacrificar legibilidade, manutenção ou segurança.
Aplique SOLID de forma pragmática, principalmente Single Responsibility. Não crie abstrações, interfaces, classes, factories ou camadas apenas para cumprir um padrão.
Cada função deve ter uma responsabilidade clara. Divida funções quando isso realmente melhorar compreensão, teste ou manutenção, mas não fragmente funções pequenas sem necessidade.
Evite DRY excessivo. Remova duplicação quando representar a mesma regra ou conhecimento, mas não crie abstrações prematuras apenas para eliminar algumas linhas repetidas.
Use guard clauses somente quando realmente melhorarem o fluxo ou protegerem uma condição/invariante importante. Não transforme funções em sequências excessivas de validações, if e return.
Não crie fallbacks sem necessidade real. Se uma situação não deveria acontecer ou não existe uma alternativa válida, prefira tratar o erro explicitamente em vez de inventar um comportamento alternativo.
Não adicione código defensivo redundante quando o contrato da função já garante determinada condição.
Não mantenha código lixo: remova imports, variáveis, funções, classes, comentários, abstrações e arquivos que não possuem utilidade real.
Não deixe código morto, duplicado ou "por garantia".
Não implemente funcionalidades ou abstrações futuras que não são necessárias para a tarefa atual.
Não faça overengineering. Antes de criar uma solução complexa, procure a solução mais simples que resolva corretamente o problema.
Prefira funções simples a classes quando não houver estado ou comportamento que justifique uma classe.
Prefira tipos/interfaces simples quando forem suficientes. Use OOP quando houver benefício real de encapsulamento, estado ou comportamento.
Não altere partes não relacionadas ao problema. Faça mudanças focadas e minimamente invasivas.
Ao refatorar código legado, preserve o comportamento correto existente, mas não preserve código ruim apenas por ser legado. Aproveite a refatoração para remover responsabilidades misturadas, duplicações e código morto quando isso estiver diretamente relacionado à mudança.
Não replique padrões ruins existentes apenas para manter "consistência" com código legado. A nova implementação deve seguir a arquitetura definida para o projeto.
Mantenha as responsabilidades nas camadas corretas e evite acoplamento desnecessário.
Se houver duas soluções corretas, prefira a que tiver menos complexidade acidental, menos código e menos pontos de manutenção.
Não faça mudanças arquiteturais maiores do que o problema exige.
Antes de finalizar, revise a implementação e elimine tudo que puder ser removido sem alterar o comportamento correto.
Regra principal

Resolva o problema da forma mais simples, limpa e correta possível.

Não escreva código para demonstrar padrões ou sofisticação. Escreva apenas o código que o sistema realmente precisa.