import type { ProposalInput } from './schema';

export const FULL_PROPOSAL_INPUT = {
  clientName: 'Estúdio Exemplo de Pilates',
  recipients: 'Ana e Bruno',
  projectLabel: 'Site do estúdio',
  date: '2026-10-26',
  validUntil: '2026-11-02',
  tagline:
    'Um site que coloca o estúdio no Google e leva quem procura direto para o WhatsApp de vocês.',
  conversation: [
    'O site precisa funcionar como cartão de visita, com um toque até o WhatsApp do estúdio.',
    'O destaque são as aulas em grupo reduzido e o pilates para gestantes.',
    'Aula experimental e avaliação postural são o que as pessoas procuram no Google.',
    'Os instrutores precisam aparecer como parte do estúdio.',
    'O Instagram continua sendo o principal canal de vocês.',
    'A identidade visual ainda está em discussão.',
  ],
  idea: {
    text: 'O Instagram mostra o dia a dia do estúdio para quem já segue vocês. O Google traz quem ainda não conhece o estúdio e está procurando agora. O site junta os dois caminhos e termina sempre no mesmo lugar: a conversa no WhatsApp.',
    flow: [
      {
        label: 'Instagram',
        title: 'Quem já segue',
        text: 'vê as aulas e clica no link da bio',
      },
      {
        label: 'Site',
        title: 'O estúdio completo',
        text: 'modalidades, instrutores, endereço e horários',
      },
      {
        label: 'WhatsApp',
        title: 'Conversa e agenda',
        text: 'com uma mensagem já pronta para começar',
      },
    ],
    note: 'E pelo Google chega quem pesquisa, por exemplo, "pilates perto de mim" ou "aula experimental de pilates".',
  },
  scope: [
    {
      title: 'Início',
      description: 'O estúdio e o jeito de dar aula: turmas pequenas e atenção a cada aluno.',
    },
    {
      title: 'Modalidades',
      description: 'Pilates de aparelho, solo, gestantes e reabilitação, cada um explicado.',
    },
    {
      title: 'Aula experimental',
      description: 'Uma página própria, para quem procura no Google encontrar e agendar.',
    },
    {
      title: 'Instrutores',
      description: 'A equipe do estúdio, cada pessoa com a sua formação.',
    },
    {
      title: 'Planos',
      description: 'Frequência semanal e valores, para quem está comparando antes de chamar.',
    },
    {
      title: 'Contato',
      description: 'WhatsApp, mapa, endereço e horários, funcionando bem no celular.',
    },
  ],
  options: [
    {
      label: 'Opção A · pagamento único',
      title: 'Site + Google',
      price: 'R$ 1.500',
      priceNote: 'à vista, ou 10x de R$ 150',
      items: [
        'Site completo, pensado para buscas no bairro',
        'Google Search Console e Google Analytics configurados, com contagem dos cliques no WhatsApp',
        'Hospedagem inclusa, sem mensalidade',
        'Entrega em até 5 dias úteis após receber o material',
        'Domínio em nome do estúdio, pago por vocês (a partir de cerca de R$ 40 por ano para .com.br)',
      ],
      addon:
        'Opcional: acompanhamento por + R$ 119/mês, sem fidelidade. Relatório mensal no e-mail e um ajuste simples por mês. Cancela quando quiser.',
    },
    {
      label: 'Opção B · entrada menor',
      title: 'Site + acompanhamento',
      price: 'R$ 790',
      priceNote: 'de entrada, + R$ 149/mês',
      items: [
        'O mesmo site e a mesma configuração no Google da opção A',
        'Hospedagem e domínio inclusos',
        'Relatório mensal no e-mail desde o primeiro mês',
        'Um ajuste simples por mês: texto, foto, preço ou horário',
        'Entrega em até 5 dias úteis após receber o material',
      ],
      terms:
        'Fidelidade de 12 meses. Depois disso, vocês podem cancelar o acompanhamento e o site continua no ar.',
    },
  ],
  monthlyReport:
    'No acompanhamento, todo mês chega no e-mail de vocês quantas pessoas encontraram o estúdio no Google, com quais buscas, e quantas clicaram para chamar no WhatsApp. Vocês não precisam abrir nenhum painel.',
  exclusions: [
    'Anúncios pagos (Google Ads). Se quiserem anunciar depois, eu oriento a configuração.',
    'Criação de marca, logo ou identidade visual.',
    'Páginas ou seções novas depois da entrega, orçadas à parte.',
  ],
  brandNote:
    'O site não precisa esperar essa decisão. Ele sai com a identidade de hoje e, se a marca nova nascer, fazemos a troca preservando o que já foi conquistado no Google (orçamento à parte).',
  nextSteps: [
    { title: 'Vocês escolhem a opção', description: 'e me avisam pelo WhatsApp.' },
    { title: 'Pagamento', description: 'Pix ou parcelado no cartão, conforme a opção.' },
    {
      title: 'Vocês me mandam o material',
      description: 'a lista está logo abaixo. Se faltar alguma foto, eu ajudo a resolver.',
    },
    {
      title: 'Site no ar em até 5 dias úteis',
      description: 'já configurado no Google, no domínio do estúdio.',
    },
    {
      title: 'Revisão com vocês',
      description: 'ajustamos juntos o que for preciso antes de divulgar.',
    },
  ],
  materials: [
    'Logo em boa resolução',
    'De 5 a 10 fotos: aulas, equipe, aparelhos e fachada',
    'Nome e formação de cada instrutor',
    'Horários das turmas, de segunda a sábado',
    'Confirmação das modalidades e dos textos',
    'Acesso ao Google Meu Negócio, para colocar o link do site',
  ],
  previewUrl: 'https://pansarini.dev/preview/exemplo',
} satisfies ProposalInput;

export const MINIMAL_PROPOSAL_INPUT = {
  clientName: 'Estúdio Exemplo de Pilates',
  recipients: 'Ana e Bruno',
  tagline: 'Um site simples para o estúdio aparecer no Google.',
  idea: {
    text: 'O site reúne as aulas, os horários e o caminho até o WhatsApp do estúdio.',
  },
  options: [
    {
      label: 'Opção única',
      title: 'Site + Google',
      price: 'R$ 1.500',
      priceNote: 'à vista, ou 10x de R$ 150',
      items: ['Site completo', 'Hospedagem inclusa, sem mensalidade'],
    },
  ],
} satisfies ProposalInput;
