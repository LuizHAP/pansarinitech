# API de leads

API HTTP para um bot (ou qualquer automação) encontrar um lead do quadro `/admin/leads` e gerar a
proposta em PDF no design aprovado. A proposta criada vira um registro "Proposta" no lead, com o PDF
anexado, igual a um PDF enviado à mão pelo formulário "Novo registro".

## Habilitar

A API só existe quando a variável `LEADS_API_TOKEN` está definida. Sem ela, todo endpoint em
`/api/leads` responde `404`.

1. Gere um token: `openssl rand -base64 32`
2. Cadastre `LEADS_API_TOKEN` nas variáveis de ambiente do projeto na Vercel (Production) e faça um
   novo deploy.
3. Entregue o token ao bot. Para revogar, troque ou apague a variável e faça um novo deploy.

## Autenticação

Toda chamada leva o cabeçalho:

```
Authorization: Bearer <LEADS_API_TOKEN>
```

Sem o cabeçalho, com outro esquema ou com um token errado, a resposta é `401`:

```
{ "error": "unauthorized" }
```

As respostas JSON saem com `Cache-Control: no-store`.

## GET /api/leads

Busca leads pelo nome, sem diferenciar maiúsculas nem acentos (`cafe` encontra "Café Central").
Sem `q`, ou com `q` vazio, lista todos. Devolve no máximo 50, em ordem alfabética.

| Parâmetro | Tipo   | Obrigatório | Descrição                    |
|-----------|--------|-------------|------------------------------|
| `q`       | string | não         | Trecho do nome do negócio    |

Resposta `200`:

```
{
  "leads": [
    {
      "id": "3f0c6a8e-2b1d-4c5e-9f7a-1b2c3d4e5f60",
      "name": "Estúdio Exemplo de Pilates",
      "stage": "em-conversa",
      "previewSlug": "exemplo",
      "instagram": "estudioexemplo"
    }
  ]
}
```

`stage` é um destes: `prospectado`, `previa-pronta`, `previa-enviada`, `contatado`, `em-conversa`,
`proposta`, `contraproposta`, `fechado`, `perdido`. `previewSlug` e `instagram` podem ser `null`.

## POST /api/leads/{id}/proposals

Valida o JSON, gera o PDF da proposta (A4, 4 páginas no tamanho típico), guarda o arquivo de forma
privada e cria no lead um registro do tipo "Proposta":

- título: `title`, ou `Proposta: <clientName>`
- data: `date`
- texto: resumo com opções e preços, escopo, o que não está incluso e validade
- link: `previewUrl`, quando houver
- anexo: o PDF, aberto pelo botão "Abrir PDF" na página do lead

O corpo é JSON (`Content-Type: application/json`), de até 256 KB. Campos fora da tabela são
rejeitados. Textos são aparados nas pontas; o limite vale depois disso.

| Campo                     | Tipo                       | Obrigatório | Limite                | Padrão |
|---------------------------|----------------------------|-------------|-----------------------|--------|
| `clientName`              | string                     | sim         | 1 a 120               | |
| `recipients`              | string                     | sim         | 1 a 160               | |
| `title`                   | string                     | não         | 160                   | `Proposta: <clientName>` |
| `projectLabel`            | string                     | não         | 60                    | `Site` (capa: "Proposta · Site") |
| `date`                    | data `AAAA-MM-DD`          | não         |                       | hoje em São Paulo |
| `validUntil`              | data `AAAA-MM-DD`          | não         | igual ou após `date`  | `date` + 7 dias |
| `tagline`                 | string                     | sim         | 1 a 240               | |
| `conversation`            | string[]                   | não         | 8 itens de 240        | `[]` (seção omitida) |
| `idea.text`               | string                     | sim         | 1 a 1200              | |
| `idea.flow`               | { label, title, text }[]   | não         | exatamente 3; 24, 60, 160 | Instagram → Site → WhatsApp |
| `idea.note`               | string                     | não         | 300                   | |
| `scope`                   | { title, description }[]   | não         | 8 itens; 60, 240      | `[]` (seção omitida) |
| `options`                 | objeto[]                   | sim         | 1 a 3                 | |
| `options[].label`         | string                     | sim         | 60                    | |
| `options[].title`         | string                     | sim         | 60                    | |
| `options[].price`         | string                     | sim         | 40                    | |
| `options[].priceNote`     | string                     | sim         | 120                   | |
| `options[].items`         | string[]                   | sim         | 8 itens de 200        | |
| `options[].addon`         | string                     | não         | 300                   | |
| `options[].terms`         | string                     | não         | 300                   | |
| `monthlyReport`           | string                     | não         | 600                   | (faixa omitida) |
| `exclusions`              | string[]                   | não         | 8 itens de 240        | `[]` |
| `brandNote`               | string                     | não         | 600                   | |
| `nextSteps`               | { title, description }[]   | não         | 8 itens; 80, 200      | 5 passos padrão |
| `materials`               | string[]                   | não         | 12 itens de 160       | `[]` (seção omitida) |
| `previewUrl`              | URL `http` ou `https`      | não         | 500                   | (seção omitida) |
| `contact`                 | { name, site, email }      | não         | 80, 80, e-mail        | Luiz Pansarini, pansarini.dev, lpansarini@gmail.com |

As seções vazias somem do PDF e a numeração continua sequencial. Em `options[].addon`, o trecho até a
primeira vírgula ou ponto sai em destaque.

### Exemplo completo (cliente fictício)

```json
{
  "clientName": "Estúdio Exemplo de Pilates",
  "recipients": "Ana e Bruno",
  "projectLabel": "Site do estúdio",
  "date": "2026-10-26",
  "validUntil": "2026-11-02",
  "tagline": "Um site que coloca o estúdio no Google e leva quem procura direto para o WhatsApp de vocês.",
  "conversation": [
    "O site precisa funcionar como cartão de visita, com um toque até o WhatsApp do estúdio.",
    "O destaque são as aulas em grupo reduzido e o pilates para gestantes.",
    "Aula experimental e avaliação postural são o que as pessoas procuram no Google.",
    "Os instrutores precisam aparecer como parte do estúdio.",
    "O Instagram continua sendo o principal canal de vocês.",
    "A identidade visual ainda está em discussão."
  ],
  "idea": {
    "text": "O Instagram mostra o dia a dia do estúdio para quem já segue vocês. O Google traz quem ainda não conhece o estúdio e está procurando agora. O site junta os dois caminhos e termina sempre no mesmo lugar: a conversa no WhatsApp.",
    "flow": [
      {
        "label": "Instagram",
        "title": "Quem já segue",
        "text": "vê as aulas e clica no link da bio"
      },
      {
        "label": "Site",
        "title": "O estúdio completo",
        "text": "modalidades, instrutores, endereço e horários"
      },
      {
        "label": "WhatsApp",
        "title": "Conversa e agenda",
        "text": "com uma mensagem já pronta para começar"
      }
    ],
    "note": "E pelo Google chega quem pesquisa, por exemplo, \"pilates perto de mim\" ou \"aula experimental de pilates\"."
  },
  "scope": [
    {
      "title": "Início",
      "description": "O estúdio e o jeito de dar aula: turmas pequenas e atenção a cada aluno."
    },
    {
      "title": "Modalidades",
      "description": "Pilates de aparelho, solo, gestantes e reabilitação, cada um explicado."
    },
    {
      "title": "Aula experimental",
      "description": "Uma página própria, para quem procura no Google encontrar e agendar."
    },
    {
      "title": "Instrutores",
      "description": "A equipe do estúdio, cada pessoa com a sua formação."
    },
    {
      "title": "Planos",
      "description": "Frequência semanal e valores, para quem está comparando antes de chamar."
    },
    {
      "title": "Contato",
      "description": "WhatsApp, mapa, endereço e horários, funcionando bem no celular."
    }
  ],
  "options": [
    {
      "label": "Opção A · pagamento único",
      "title": "Site + Google",
      "price": "R$ 1.500",
      "priceNote": "à vista, ou 10x de R$ 150",
      "items": [
        "Site completo, pensado para buscas no bairro",
        "Google Search Console e Google Analytics configurados, com contagem dos cliques no WhatsApp",
        "Hospedagem inclusa, sem mensalidade",
        "Entrega em até 5 dias úteis após receber o material",
        "Domínio em nome do estúdio, pago por vocês (a partir de cerca de R$ 40 por ano para .com.br)"
      ],
      "addon": "Opcional: acompanhamento por + R$ 119/mês, sem fidelidade. Relatório mensal no e-mail e um ajuste simples por mês. Cancela quando quiser."
    },
    {
      "label": "Opção B · entrada menor",
      "title": "Site + acompanhamento",
      "price": "R$ 790",
      "priceNote": "de entrada, + R$ 149/mês",
      "items": [
        "O mesmo site e a mesma configuração no Google da opção A",
        "Hospedagem e domínio inclusos",
        "Relatório mensal no e-mail desde o primeiro mês",
        "Um ajuste simples por mês: texto, foto, preço ou horário",
        "Entrega em até 5 dias úteis após receber o material"
      ],
      "terms": "Fidelidade de 12 meses. Depois disso, vocês podem cancelar o acompanhamento e o site continua no ar."
    }
  ],
  "monthlyReport": "No acompanhamento, todo mês chega no e-mail de vocês quantas pessoas encontraram o estúdio no Google, com quais buscas, e quantas clicaram para chamar no WhatsApp. Vocês não precisam abrir nenhum painel.",
  "exclusions": [
    "Anúncios pagos (Google Ads). Se quiserem anunciar depois, eu oriento a configuração.",
    "Criação de marca, logo ou identidade visual.",
    "Páginas ou seções novas depois da entrega, orçadas à parte."
  ],
  "brandNote": "O site não precisa esperar essa decisão. Ele sai com a identidade de hoje e, se a marca nova nascer, fazemos a troca preservando o que já foi conquistado no Google (orçamento à parte).",
  "nextSteps": [
    {
      "title": "Vocês escolhem a opção",
      "description": "e me avisam pelo WhatsApp."
    },
    {
      "title": "Pagamento",
      "description": "Pix ou parcelado no cartão, conforme a opção."
    },
    {
      "title": "Vocês me mandam o material",
      "description": "a lista está logo abaixo. Se faltar alguma foto, eu ajudo a resolver."
    },
    {
      "title": "Site no ar em até 5 dias úteis",
      "description": "já configurado no Google, no domínio do estúdio."
    },
    {
      "title": "Revisão com vocês",
      "description": "ajustamos juntos o que for preciso antes de divulgar."
    }
  ],
  "materials": [
    "Logo em boa resolução",
    "De 5 a 10 fotos: aulas, equipe, aparelhos e fachada",
    "Nome e formação de cada instrutor",
    "Horários das turmas, de segunda a sábado",
    "Confirmação das modalidades e dos textos",
    "Acesso ao Google Meu Negócio, para colocar o link do site"
  ],
  "previewUrl": "https://pansarini.dev/preview/exemplo"
}
```

### Prévia sem gravar nada

Com `?dryRun=1`, a API valida e devolve o próprio PDF (`application/pdf`), sem criar registro nem
guardar arquivo. Use para revisar a proposta antes de criar.

### Resposta de sucesso

`201`:

```
{
  "record": { "id": "8d6f1e2a-5b4c-4a3d-9e8f-7a6b5c4d3e2f", "title": "Proposta: Estúdio Exemplo de Pilates" },
  "pdfUrl": "https://pansarini.dev/admin/leads/3f0c6a8e-2b1d-4c5e-9f7a-1b2c3d4e5f60/records/8d6f1e2a-5b4c-4a3d-9e8f-7a6b5c4d3e2f/file",
  "leadUrl": "https://pansarini.dev/admin/leads/3f0c6a8e-2b1d-4c5e-9f7a-1b2c3d4e5f60"
}
```

As duas URLs são do admin e pedem login; servem para mandar ao Luiz, não ao cliente.

## Erros

| Status | Corpo | Quando |
|--------|-------|--------|
| `400`  | `{ "errors": [{ "path": "options.0.price", "message": "Use no máximo 40 caracteres." }] }` | JSON fora do esquema. `path` usa pontos; `""` é o objeto inteiro (por exemplo, campo desconhecido) |
| `400`  | `{ "errors": [{ "path": "", "message": "JSON inválido." }] }` | Corpo que não é JSON |
| `401`  | `{ "error": "unauthorized" }` | Sem token ou token errado (vem com `WWW-Authenticate: Bearer`) |
| `404`  | `{ "error": "not_found" }` | `LEADS_API_TOKEN` não está configurado |
| `404`  | `{ "error": "lead_not_found" }` | O id não é de um lead existente |
| `405`  | (vazio) | Método não suportado no endpoint |
| `413`  | `{ "error": "payload_too_large" }` | Corpo acima de 256 KB |
| `502`  | `{ "error": "upload_failed" }` | O PDF não pôde ser guardado; nada foi criado |
| `503`  | `{ "error": "unavailable" }` | O Redis não respondeu; nada foi criado |

As mensagens de `400` estão em português, prontas para repassar.

## Exemplos com curl

```
export LEADS_API=https://pansarini.dev/api/leads
export LEADS_API_TOKEN=...

# Buscar o lead
curl -s -H "Authorization: Bearer $LEADS_API_TOKEN" "$LEADS_API?q=exemplo"

# Revisar a proposta sem gravar (salva o PDF em proposta.pdf)
curl -s -X POST -H "Authorization: Bearer $LEADS_API_TOKEN" \
  -H "Content-Type: application/json" --data @proposta.json \
  "$LEADS_API/<lead-id>/proposals?dryRun=1" --output proposta.pdf

# Criar a proposta no lead
curl -s -X POST -H "Authorization: Bearer $LEADS_API_TOKEN" \
  -H "Content-Type: application/json" --data @proposta.json \
  "$LEADS_API/<lead-id>/proposals"
```

Um corpo mínimo válido:

```
{"clientName":"Estúdio Exemplo de Pilates","recipients":"Ana e Bruno","tagline":"Um site simples para o estúdio aparecer no Google.","idea":{"text":"O site reúne as aulas, os horários e o caminho até o WhatsApp do estúdio."},"options":[{"label":"Opção única","title":"Site + Google","price":"R$ 1.500","priceNote":"à vista, ou 10x de R$ 150","items":["Site completo","Hospedagem inclusa, sem mensalidade"]}]}
```
