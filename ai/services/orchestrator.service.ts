import type {
  AiChatRequest,
  AiModel,
  ChatMessage,
  ChatTurn,
  Creativity,
  PreparedChat,
  ProviderService,
} from '../types'

const MAX_HISTORY = 20

/** A criatividade muda as instruções em todos os modelos... */
const CREATIVITY_INSTRUCTIONS: Record<Creativity, string> = {
  preciso: 'Seja objetivo: siga o SQL do usuário à risca e não invente tabelas nem colunas que ele não pediu.',
  equilibrado: 'Dê a solução recomendada e, quando fizer sentido, uma alternativa curta.',
  criativo: 'Sugira alternativas de modelagem e melhorias, explicando os prós e contras.',
}

/** ...e, nos modelos que aceitam, também a temperatura. */
const CREATIVITY_TEMPERATURES: Record<Creativity, number> = {
  preciso: 0.2,
  equilibrado: 0.7,
  criativo: 1.0,
}

/** Marca do bloco que a IA usa para devolver o SQL completo que vai para o editor. */
const EDITOR_SQL_BLOCK = /```sql-brdiagrama\s*\n([\s\S]*?)```/

const EDIT_PERMISSION_INSTRUCTIONS = {
  allowed:
    'Você tem permissão para alterar o SQL do editor. Quando o usuário pedir uma mudança no esquema, devolva o SQL COMPLETO já alterado (todas as tabelas, não só o trecho novo) dentro de um único bloco ```sql-brdiagrama e explique a mudança em poucas palavras. Esse bloco substitui o SQL do editor, então use-o só quando for para aplicar a mudança.',
  denied:
    'Você NÃO tem permissão para alterar o SQL do editor: só sugira mudanças em blocos ```sql comuns, e o usuário decide se copia.',
}

/** Separa a resposta em texto para mostrar e SQL para aplicar no editor (quando a IA mandou o bloco). */
export function extractEditorSql(reply: string): { text: string; sql?: string } {
  const match = reply.match(EDITOR_SQL_BLOCK)
  if (!match) return { text: reply }
  return { text: reply.replace(match[0], '').trim(), sql: match[1].trim() }
}

export function buildSystemPrompt(context: AiChatRequest['context'], creativity: Creativity): string {
  const instructions = [
    'Você é o assistente de IA do BrDiagrama, uma ferramenta brasileira que gera diagramas ER a partir de SQL.',
    'Ajude com modelagem de banco de dados: tabelas, colunas, tipos, chaves primárias e estrangeiras, relacionamentos, cardinalidade, normalização, índices e SQL.',
    'Responda sempre em português do Brasil, de forma clara e direta.',
    'O chat mostra texto puro, então não use tabelas Markdown; para código, use blocos ```sql.',
    `Escreva SQL no dialeto ${context.dialect}.`,
    'Se a pergunta não tiver relação com banco de dados ou com o diagrama, responda em poucas palavras e volte ao assunto.',
    CREATIVITY_INSTRUCTIONS[creativity],
    EDIT_PERMISSION_INSTRUCTIONS[context.canEditSql ? 'allowed' : 'denied'],
  ].join(' ')
  const sql = context.sql.trim()
  const sqlSection = sql ? `SQL atual do editor do usuário:\n\`\`\`sql\n${sql}\n\`\`\`` : 'O editor está vazio.'
  return `${instructions}\n\n${sqlSection}`
}

/**
 * Prepara o histórico enviado: sem erros nem respostas vazias, sem duas mensagens seguidas do
 * mesmo papel (fica a última, então pergunta bloqueada ou sem resposta não volta), só as últimas
 * 20 e começando pelo usuário. A última é sempre a pergunta nova do usuário.
 */
export function prepareHistory(messages: ChatMessage[]): ChatTurn[] {
  const turns = messages
    .filter((message) => !message.error && (message.role === 'user' || message.content.trim()))
    .map(({ role, content }) => ({ role, content }))
  const recent = turns.filter((turn, index) => turns[index + 1]?.role !== turn.role).slice(-MAX_HISTORY)
  return recent.slice(recent.findIndex((turn) => turn.role === 'user'))
}

export function orchestrateChat(request: AiChatRequest, model: AiModel, service: ProviderService): AsyncGenerator<string> {
  const chat: PreparedChat = {
    model,
    apiKey: request.apiKey,
    systemPrompt: buildSystemPrompt(request.context, request.creativity),
    messages: prepareHistory(request.messages),
    temperature: model.supportsTemperature ? CREATIVITY_TEMPERATURES[request.creativity] : undefined,
    signal: request.signal,
  }
  return service(chat)
}
