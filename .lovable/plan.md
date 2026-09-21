# Corrigir acesso da Daiana, Histórico e sincronização

## Diagnóstico confirmado
- A conta informada existe, está confirmada e não está bloqueada.
- O Histórico e Clientes estão corretamente fechados para visitantes; a geração de contratos continua pública.
- A tabela compartilhada está com leitura e edição liberadas para usuários autenticados e habilitada para atualizações em tempo real.
- O app hoje recarrega toda a lista quando recebe uma atualização e não trata falha, desconexão ou reconexão do canal; isso pode deixar outro aparelho desatualizado sem aviso.

## Implementação
1. Reproduzir o login com a conta informada e identificar se a falha é senha inválida, restauração tardia da sessão ou erro de interface.
2. Restabelecer o acesso da conta sem alterar o acesso público à geração de contratos; melhorar a mensagem exibida quando as credenciais forem recusadas.
3. Garantir que a sessão seja restaurada antes de liberar ou bloquear Histórico e Clientes, evitando tela vazia ou estado incorreto após atualizar a página.
4. Tornar a sincronização resiliente: aplicar eventos recebidos imediatamente, recarregar após reconexão e ao voltar para a aba, e apresentar erro quando a nuvem não responder.
5. Manter a mesma fonte compartilhada para Histórico e Clientes, sem criar registros duplicados.
6. Validar em duas sessões independentes: login, recarga com sessão persistida, novo contrato, novo cliente e mudança Atendido/Não atendido aparecendo no outro aparelho.
7. Verificar a versão publicada separadamente da prévia e informar se será necessário publicar a correção.

## Segurança
- A senha fornecida será usada somente para o teste solicitado e não será gravada no projeto nem exibida em registros.
- Como a senha foi enviada em uma conversa, será recomendado trocá-la após a validação.
