# Villela Contracts

Crie um sistema web para gerar contratos preenchidos em PDF a partir de um formulário, com suporte a 5 modelos diferentes do Grupo Villela.

Fluxo:

O usuário escolhe o tipo de contrato em um seletor: "Regularize Aqui (PRF)", "Renegocie Aqui Bancário - Adesão", "Renegocie Aqui Bancário - Parcelado", "Recupere Aqui - Recuperação de Créditos", "Renegocie Aqui Empresarial - Adesão".

Com base na escolha, o formulário mostra o bloco de dados do CONTRATANTE (comum a todos) + o bloco de campos financeiros específico daquele modelo (conforme tabela abaixo).

Ao clicar em "Gerar Contrato", o sistema carrega o PDF-modelo correspondente (farei upload dos 5 arquivos) e preenche os campos usando pdf-lib, sobrepondo texto nas coordenadas certas de cada campo (os PDFs não têm campos de formulário nativos).

Gera botão "Baixar Contrato Preenchido".

Bloco CONTRATANTE (comum a todos os modelos):
Razão Social/Nome, CPF ou CNPJ, Nome do responsável legal, CPF do responsável, Endereço, Bairro, Município, UF, CEP, Telefone, E-mail, Data da assinatura (dia/mês/ano).

Blocos financeiros por modelo:

Regularize Aqui (PRF): Valor total do contrato, Valor da entrada, Data de pagamento da entrada, Valor das parcelas, Quantidade de parcelas, Vencimento (todo dia), Esfera de atuação (Estadual ou Federal).

Renegocie Aqui Bancário - Adesão: Valor total da adesão, Dia de pagamento.

Renegocie Aqui Bancário - Parcelado: Valor total do contrato, Valor da entrada, Data de pagamento da entrada, Valor das parcelas, Quantidade de parcelas, Vencimento (todo dia).

Recupere Aqui: Dados do Contador (Nome, Telefone, E-mail), Valor da adesão, Data de pagamento, % sobre o benefício financeiro (êxito), Data de pagamento do êxito, Valor do contrato, Forma de pagamento (Pix, Débito, Crédito ou Boleto), Data de vencimento.

Renegocie Aqui Empresarial - Adesão: Valor total da adesão, Dia de pagamento.

Requisitos técnicos:

Formate automaticamente CPF/CNPJ, CEP e valores em Real (R$) enquanto o usuário digita.

Valide campos obrigatórios antes de gerar o PDF.

Mantenha um histórico local (nome do contratante + modelo escolhido + data de geração), com opção de baixar novamente qualquer contrato já gerado.

Interface limpa e em português, com o seletor de modelo no topo e o formulário mudando dinamicamente conforme a escolha.

Um ponto: como cada modelo tem layout próprio, as coordenadas de sobreposição de texto vão precisar ser ajustadas individualmente para cada um dos 5 PDFs — o Lovable provavelmente vai estimar de forma aproximada e você vai precisar testar e afinar depois, um modelo de cada vez.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/16d9388b-f318-4b7e-981c-5afa102e4457).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
