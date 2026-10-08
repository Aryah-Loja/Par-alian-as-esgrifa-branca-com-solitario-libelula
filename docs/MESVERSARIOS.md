# Textos de mesversário

Nova seção “Nossos mesversários” em Nossa História e no menu de navegação. Poloni pode escrever várias cartas por mês, escolher o número de meses, data e título opcional, editar e excluir com confirmação. A sugestão de mês usa a data oficial do pedido; o número é editável para respeitar a contagem usada pelo casal.

Cada carta tem um ID e uma chave de configuração independente (`aurora_mesversario_item:<id>`), com relógio de modificação. Isso evita sobrescrever uma lista inteira ao criar cartas em aparelhos diferentes. As configurações já entram automaticamente no backup ZIP v4 e na sincronização incremental. Exclusão mantém uma marca no registro. Edições simultâneas da mesma carta seguem o mecanismo existente de resolução por relógio da configuração; não há edição colaborativa em tempo real.

O formulário guarda um rascunho local enquanto a pessoa digita e ao fechar. Rascunhos ficam somente neste aparelho e não integram o backup. Cartas efetivamente salvas integram banco, espelho local e backups futuros. Um backup antigo não contém cartas escritas depois de sua criação. Falha de salvamento mantém o texto e não informa sucesso. Sem internet, o texto fica local e o envio depende da próxima oportunidade de sincronização.

Textos são renderizados por textContent, preservando parágrafos sem executar HTML. São permitidos até 20.000 caracteres por carta. O recurso herda o acesso/privacidade da área Nossa História e do bucket existente; não cria login novo nem muda a proteção da nuvem.
