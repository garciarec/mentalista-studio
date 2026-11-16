# O Mentalista — Estúdio de conteúdo

Primeira versão preparada para Netlify. Criada em 16/11/2026.

## O que já funciona sem IA
- Interface responsiva com menu móvel.
- Biblioteca pesquisável com 33 módulos e princípios práticos.
- 12 estruturas de ganchos, com aplicação ao editor.
- Perfil de voz local.
- Notas e projetos locais, exportação de texto, backup e importação de projetos.

## O que precisa da conexão
Análise de transcrição ou vídeo, adaptação, roteiro, revisão, carrossel, Stories, legenda, plano, marca, vendas, métricas, comentários, mensagens, reaproveitamento, tradução, direção e produto digital.

A integração Gemini está implementada, mas não foi testada com credencial real. Os testes automáticos usam respostas simuladas. Modelo e cota dependem da conta do proprietário. Nenhuma IA paga ou cobrança está ativada no código.

Links públicos do YouTube e Shorts são enviados como fileData ao Gemini, sem transcrição manual. Instagram e TikTok ainda não têm importação por link: use o arquivo do vídeo. O formulário aceita MP4, MOV e WebM até 100 MB e 3 minutos (duração verificada no navegador). O envio ocorre em partes de 2 MB através da função video, com sessões assinadas válidas por uma hora e sem expor a chave da API. O Gemini armazena o arquivo temporariamente. A compatibilidade depende do codec e do modelo configurado. O envio consome requisições e créditos da hospedagem; os planos gratuitos têm cotas. Não há mudança automática para plano pago.

## Publicar pelo celular
1. Extraia este ZIP no app Arquivos do iPhone.
2. Crie um repositório Git e envie os arquivos, preservando as pastas. O envio pelo navegador pode ser trabalhoso no celular; uma sessão de edição Git no navegador facilita preservar a estrutura.
3. Na Netlify, importe esse repositório. A pasta de publicação é `public`; as funções estão em `netlify/functions`. O arquivo `netlify.toml` configura ambas. Não precisa de comando de build.
4. Em variáveis de ambiente das funções, configure:
   - `GEMINI_API_KEY`: sua chave do Google AI Studio. Não compartilhe no chat ou no código público.
   - `GEMINI_MODEL`: identificador de um modelo disponível na faixa gratuita da sua conta, compatível com `generateContent` e vídeo se for usar uploads.
   - `BETA_ACCESS_CODE`: código longo e exclusivo para os participantes do beta. Não use uma senha pessoal. Essa proteção é temporária e não substitui contas individuais.
5. Faça nova publicação. Abra “Conexão e privacidade” no site e confira o status.
6. Faça uma solicitação curta com consentimento e código do beta. “Configurada” verifica apenas presença de variáveis, não validade da chave ou cota.

IMPORTANTE: enviar só `public` ao Netlify Drop publica apenas a interface, sem as funções. Para IA, use a importação do projeto Git completo. O ZIP não é um pacote de funções pré-compiladas para Drop.

## Orçamento zero
Mantenha o plano gratuito da Netlify e o projeto Gemini sem faturamento pago. Confira as cotas na sua conta antes de abrir ao público. A configuração declara um limite de 5 solicitações por minuto por IP/domínio para a função; valide a aplicação desse limite na publicação. Não há contador global diário implementado. O bloqueio global depende das cotas do provedor. Não há fallback pago. Ao esgotar cotas, o serviço pode ficar indisponível.

## Privacidade
Projetos e perfil ficam no navegador, sem sincronização. O envio de geração inclui texto, perfil e eventual vídeo para o Google. A faixa gratuita pode usar dados para melhorar produtos. Não envie informações confidenciais. O site não mantém os vídeos no histórico. Infraestrutura e provedor têm suas próprias políticas e registros. O código não registra corpos de requisição nem chaves.

## Base do método
`server/methods.json` contém os 33 módulos disponíveis do plugin O Mentalista versão 1.0.65, com referências Markdown. Não contém memórias pessoais, dados financeiros ou conversas privadas. A cada pedido, o servidor seleciona módulos e trechos relevantes dentro de um orçamento de contexto. A biblioteca visual apresenta resumos editoriais, não todos os documentos na íntegra. Não equivale a transferir todo o conhecimento do modelo para o site. Atualizações futuras do plugin precisam de nova sincronização.

## Arquivos
- `public/`: interface, estilos, interações e catálogo.
- `server/engine.mjs`: seleção de métodos e regras editoriais.
- `server/methods.json`: base editorial.
- `netlify/functions/generate.mjs`: endpoint Gemini com chave no servidor.
- `netlify/functions/status.mjs`: estado da configuração, sem segredos.
- `tests/`: validação do endpoint, usando mocks do provedor.

## Verificação realizada
`npm test`: 5 testes passaram. Sintaxe JavaScript verificada. Navegação, busca, aplicação de método e salvamento de nota verificados no navegador. Layout observado em computador e frames de 320, 390 e 768 pixels. Não testado em aparelhos físicos nem em Safari iOS. Não publicado na Netlify e sem teste de IA real.

## Próximas etapas
Publicar e validar a integração real; avaliar consumo por análise; ampliar o envio de vídeos; conectar importação de redes quando possível; adicionar autenticação, dados sincronizados e assinaturas. A integração futura com GPT precisará de um adaptador de provedor e testes. Pagamentos não estão implementados.

## Documentação
https://docs.netlify.com/build/functions/get-started/
https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/
https://ai.google.dev/api/generate-content
https://ai.google.dev/gemini-api/docs/pricing
