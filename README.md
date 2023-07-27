# Aplicação REST API para WhatsApp

## Descrição

Esta aplicação é uma REST API para interagir com o WhatsApp. Ela permite que você envie mensagens e imagens para contatos e grupos do WhatsApp através de chamadas HTTP. A API utiliza a interface de automação do WhatsApp Web para realizar as ações.

Essa implementação é um exemplo de uso da biblioteca [whatsapp-web.js](https://wwebjs.dev/)

**Importante**: É necessário ter uma conta do WhatsApp ativa e um dispositivo com WhatsApp conectado à internet para que a API funcione corretamente.

## Como usar?

1. Instalação:
Antes de começar, certifique-se de ter o [Node.js](https://nodejs.org) instalado em sua máquina.
Clone o repositório e instale as dependências usando o seguinte comando:

```bash
git clone https://github.com/cassiusrde/whatsapp-api.git
cd whatsapp-api
npm install
```

2. Execução:
Inicie o servidor com o seguinte comando:

```bash
npm run start
```

A API estará disponível em http://localhost:8000

3. 
Abra o endereço `http://localhost:8000` no navegador 
Escaneie o QR Code pelo aplicativo WhatsApp


## Exemplos

1. Enviar uma mensagem:
* URL: `POST /send-message`
* Corpo da Requisição:
```json
{
  "number": "+5511987654321",
  "message": "Olá! Esta é uma mensagem enviada através da API do WhatsApp."
}
```

* Resposta:
```json
{
  "status": true,
  "response": ""
}
```

2. Enviar uma imagem:
* URL: `POST /send-media`
* Corpo da Requisição:
```json
{
  "number": "+5511987654321",
  "caption": "Olá! Esta é uma imagem enviada através da API do WhatsApp.",
  "file": "https://exemplo.com/imagem.jpg"
}
```

* Resposta:
```json
{
  "status": true,
  "response": ""
}
```

3. Enviar uma mensagem para um Grupo:
* URL: `POST /send-message-group`
* Corpo da Requisição:
```json
{
  "group": "Grupo de Teste",
  "message": "Olá! Esta é uma mensagem enviada através da API do WhatsApp."
}
```

* Resposta:
```json
{
  "status": true,
  "response": ""
}
```

##  Aviso Legal
Esta aplicação é apenas para fins educacionais e de aprendizado. O uso indevido ou excessivo da API pode violar os termos de serviço do WhatsApp e resultar em bloqueio da conta. Use com responsabilidade e de acordo com as políticas do WhatsApp.