import { Document, Link, Page, Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';
import type { Proposal, ProposalSectionKey } from './schema';
import { proposalSections } from './schema';
import { colors, fonts, mm } from './theme';

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const SECTION_TITLES: Record<ProposalSectionKey, string> = {
  conversation: 'O que conversamos',
  idea: 'A ideia',
  scope: 'O que o site vai ter',
  investment: 'Investimento',
  nextSteps: 'Próximos passos',
  materials: 'O que eu preciso de vocês',
  preview: 'Veja como vai ficar',
};

const MONO_BASE = {
  fontFamily: fonts.mono,
  fontSize: 8,
  letterSpacing: 0.64,
  textTransform: 'uppercase',
} as const;
const MONO_LABEL = { ...MONO_BASE, lineHeight: 1.5 };

const PAGE_X = mm(18);

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.paper,
    color: colors.ink,
    fontFamily: fonts.display,
    paddingTop: mm(20),
    paddingHorizontal: PAGE_X,
    paddingBottom: mm(17.5),
  },
  // react-pdf resolves a unitless lineHeight against the fontSize of the same style object
  // and children inherit the result in points, so every style that sets fontSize sets its own
  // lineHeight. It stays off Page because a fixed footer with any lineHeight is not drawn.
  body: { flexGrow: 1, fontSize: 10.5, lineHeight: 1.5 },
  cover: {
    backgroundColor: colors.ink,
    color: colors.paper,
    fontFamily: fonts.display,
    fontSize: 10.5,
    lineHeight: 1.5,
    paddingVertical: mm(22),
    paddingHorizontal: mm(20),
  },
  prompt: { flexDirection: 'row', alignItems: 'center' },
  promptText: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 1.2, color: colors.paper },
  promptMark: { color: colors.signal, fontWeight: 500 },
  cursor: { width: 6.6, height: 11.5, marginLeft: 2, backgroundColor: colors.signal },
  coverLabel: { ...MONO_LABEL, color: colors.coverMuted, marginTop: mm(62) },
  coverTitle: {
    fontSize: 44,
    lineHeight: 1.02,
    fontWeight: 700,
    letterSpacing: -0.88,
    marginTop: mm(5),
  },
  lede: {
    fontSize: 15,
    lineHeight: 1.35,
    maxWidth: mm(135),
    marginTop: mm(8),
    color: colors.coverText,
  },
  bar: { width: mm(28), height: mm(3), marginTop: mm(12), backgroundColor: colors.signal },
  coverMeta: {
    marginTop: 'auto',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.coverRule,
    paddingTop: mm(6),
  },
  coverMetaItem: { flex: 1 },
  coverMetaGap: { width: mm(6) },
  coverMetaTerm: { ...MONO_LABEL, color: colors.coverMuted },
  coverMetaValue: { fontSize: 11, lineHeight: 1.5, marginTop: mm(1.5) },
  sectionSpaced: { marginTop: mm(9) },
  sectionNumber: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 1.1,
    fontWeight: 500,
    letterSpacing: 0.66,
    color: colors.signal,
    marginBottom: mm(2),
  },
  sectionHeading: {
    fontSize: 20,
    lineHeight: 1.1,
    fontWeight: 700,
    letterSpacing: -0.2,
    marginBottom: mm(4),
  },
  h3: { fontSize: 12, lineHeight: 1.5, fontWeight: 600, marginBottom: mm(1.5) },
  column: { flex: 1 },
  bulletRow: { flexDirection: 'row', marginTop: mm(3) },
  bulletRowFirst: { flexDirection: 'row' },
  bulletCell: { flex: 1, flexDirection: 'row' },
  bulletGap: { width: mm(8) },
  bulletMark: { width: mm(5), color: colors.signal, fontWeight: 700 },
  bulletText: { flex: 1 },
  flow: { flexDirection: 'row', marginTop: mm(5) },
  flowBox: {
    flex: 1,
    padding: mm(4),
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  flowBoxDark: {
    flex: 1,
    padding: mm(4),
    backgroundColor: colors.ink,
    borderWidth: 1,
    borderColor: colors.ink,
    color: colors.paper,
  },
  flowLabel: { ...MONO_LABEL, color: colors.muted, marginBottom: mm(1.5) },
  flowLabelDark: { ...MONO_LABEL, color: colors.coverMuted, marginBottom: mm(1.5) },
  flowTitle: { fontSize: 12, lineHeight: 1.5, fontWeight: 700, marginBottom: mm(1) },
  flowArrow: { width: mm(9), alignItems: 'center', justifyContent: 'center' },
  flowNote: { marginTop: mm(3), color: colors.muted },
  scopeRow: { flexDirection: 'row', marginTop: mm(3) },
  scopeRowFirst: { flexDirection: 'row' },
  scopeGap: { width: mm(3) },
  scopeItem: { flex: 1, borderTopWidth: 2, borderTopColor: colors.ink, paddingTop: mm(2) },
  scopeText: { fontSize: 9.5, lineHeight: 1.5, color: colors.muted },
  options: { flexDirection: 'row' },
  optionGap: { width: mm(5) },
  option: {
    flex: 1,
    padding: mm(5),
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.card,
  },
  optionTag: { ...MONO_LABEL, color: colors.signal },
  optionTitle: { fontSize: 15, lineHeight: 1.5, fontWeight: 600, marginTop: mm(1.5) },
  price: { fontSize: 24, fontWeight: 700, letterSpacing: -0.24, lineHeight: 1.1, marginTop: mm(3) },
  priceNote: { fontSize: 10, lineHeight: 1.5, color: colors.muted, marginTop: mm(1) },
  optionItems: { marginTop: mm(4) },
  optionItem: { flexDirection: 'row', fontSize: 9.8, lineHeight: 1.5 },
  optionItemNext: { flexDirection: 'row', fontSize: 9.8, lineHeight: 1.5, marginTop: mm(1.5) },
  check: { width: mm(5), paddingTop: 3 },
  addon: { marginTop: 'auto', paddingTop: mm(4) },
  addonBox: {
    padding: mm(3.5),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.signal,
    backgroundColor: colors.white,
    fontSize: 9.3,
    lineHeight: 1.5,
  },
  addonLead: { color: colors.signal, fontWeight: 700 },
  terms: {
    marginTop: 'auto',
    paddingTop: mm(4),
    fontSize: 9.3,
    lineHeight: 1.5,
    color: colors.muted,
  },
  report: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: mm(6),
    paddingVertical: mm(5),
    paddingHorizontal: mm(6),
    backgroundColor: colors.ink,
    color: colors.paper,
  },
  reportLead: { width: mm(38), marginRight: mm(6) },
  reportAccent: { color: colors.signal },
  reportBig: { fontSize: 30, fontWeight: 700, lineHeight: 1 },
  reportLabel: { ...MONO_LABEL, color: colors.coverMuted, marginTop: mm(1.5) },
  reportText: { flex: 1, fontSize: 9.8, lineHeight: 1.5, color: colors.coverText },
  extras: { flexDirection: 'row', marginTop: mm(8) },
  extrasGap: { width: mm(8) },
  dashItem: { flexDirection: 'row', fontSize: 9.8, lineHeight: 1.5 },
  dashItemNext: { flexDirection: 'row', fontSize: 9.8, lineHeight: 1.5, marginTop: mm(1.2) },
  dashMark: { width: mm(5), color: colors.muted },
  brandNote: { fontSize: 9.8, lineHeight: 1.5, color: colors.muted },
  steps: { borderBottomWidth: 1, borderBottomColor: colors.line },
  step: {
    flexDirection: 'row',
    paddingVertical: mm(3),
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  stepNumber: {
    width: mm(11),
    paddingTop: mm(0.6),
    fontFamily: fonts.mono,
    fontSize: 10,
    lineHeight: 1.5,
    fontWeight: 500,
    color: colors.signal,
  },
  stepTitle: { fontWeight: 700 },
  stepText: { fontSize: 9.8, lineHeight: 1.5, color: colors.muted },
  checklistRow: { flexDirection: 'row', marginTop: mm(2) },
  checklistRowFirst: { flexDirection: 'row' },
  checklistCell: { flex: 1, flexDirection: 'row', fontSize: 9.8, lineHeight: 1.5 },
  checklistBox: {
    width: mm(3),
    height: mm(3),
    marginTop: mm(1.2),
    marginRight: mm(3),
    borderWidth: 1.2,
    borderColor: colors.ink,
  },
  previewLink: { fontWeight: 700, color: colors.ink, textDecoration: 'underline' },
  contact: {
    marginTop: 'auto',
    marginBottom: mm(4),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: mm(7),
    paddingHorizontal: mm(8),
    backgroundColor: colors.signal,
    color: colors.white,
  },
  contactLabel: { ...MONO_LABEL, color: colors.contactMuted },
  contactHeading: { fontSize: 17, lineHeight: 1.15, fontWeight: 600, maxWidth: mm(95) },
  contactList: { alignItems: 'flex-end' },
  contactItem: { fontSize: 11, lineHeight: 1.5, marginBottom: mm(1.5) },
  contactLink: { color: colors.white, textDecoration: 'underline' },
  footer: {
    position: 'absolute',
    left: PAGE_X,
    right: PAGE_X,
    bottom: mm(9.5),
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: mm(4),
    ...MONO_BASE,
    color: colors.muted,
  },
});

function longDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} de ${MONTHS[month - 1]} de ${year}`;
}

function pairs<T>(items: readonly T[]): [T, T | undefined][] {
  const rows: [T, T | undefined][] = [];
  for (let index = 0; index < items.length; index += 2) {
    rows.push([items[index], items[index + 1]]);
  }
  return rows;
}

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function Arrow() {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24">
      <Path
        d="M3 12h17M13 5l7 7-7 7"
        stroke={colors.signal}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function Check() {
  return (
    <Svg width={9} height={9} viewBox="0 0 24 24">
      <Path
        d="M3 12.5l6 6L21 6"
        stroke={colors.signal}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function Cover({ proposal }: { proposal: Proposal }) {
  const meta = [
    ['Para', proposal.recipients],
    ['Data', longDate(proposal.date)],
    ['Válida até', longDate(proposal.validUntil)],
  ];
  return (
    <Page size="A4" style={styles.cover}>
      <View style={styles.prompt}>
        <Text style={styles.promptText}>
          <Text style={styles.promptMark}>&gt;</Text>pansarini
        </Text>
        <View style={styles.cursor} />
      </View>
      <Text style={styles.coverLabel}>Proposta · {proposal.projectLabel}</Text>
      <Text style={styles.coverTitle}>{proposal.clientName}</Text>
      <Text style={styles.lede}>{proposal.tagline}</Text>
      <View style={styles.bar} />
      <View style={styles.coverMeta}>
        {meta.flatMap(([term, value], index) => {
          const item = (
            <View key={term} style={styles.coverMetaItem}>
              <Text style={styles.coverMetaTerm}>{term}</Text>
              <Text style={styles.coverMetaValue}>{value}</Text>
            </View>
          );
          return index === 0
            ? [item]
            : [<View key={`gap-${term}`} style={styles.coverMetaGap} />, item];
        })}
      </View>
    </Page>
  );
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <View>
      <Text style={styles.sectionNumber}>{number}</Text>
      <Text style={styles.sectionHeading}>{title}</Text>
    </View>
  );
}

function Section({
  sections,
  name,
  spaced = false,
  children,
}: {
  sections: Map<ProposalSectionKey, string>;
  name: ProposalSectionKey;
  spaced?: boolean;
  children: React.ReactNode;
}) {
  const number = sections.get(name);
  if (!number) return null;
  return (
    <View style={spaced ? styles.sectionSpaced : {}}>
      <SectionTitle number={number} title={SECTION_TITLES[name]} />
      {children}
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View>
      {pairs(items).map(([left, right], index) => (
        <View
          key={left}
          style={index === 0 ? styles.bulletRowFirst : styles.bulletRow}
          wrap={false}
        >
          <View style={styles.bulletCell}>
            <Text style={styles.bulletMark}>›</Text>
            <Text style={styles.bulletText}>{left}</Text>
          </View>
          <View style={styles.bulletGap} />
          <View style={styles.bulletCell}>
            {right !== undefined && (
              <>
                <Text style={styles.bulletMark}>›</Text>
                <Text style={styles.bulletText}>{right}</Text>
              </>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

function FlowBoxes({ idea }: { idea: Proposal['idea'] }) {
  return (
    <View>
      <View style={styles.flow} wrap={false}>
        {idea.flow.flatMap((box, index) => {
          const dark = index === 1;
          const card = (
            <View key={box.label} style={dark ? styles.flowBoxDark : styles.flowBox}>
              <Text style={dark ? styles.flowLabelDark : styles.flowLabel}>{box.label}</Text>
              <Text style={styles.flowTitle}>{box.title}</Text>
              <Text>{box.text}</Text>
            </View>
          );
          if (index === 0) return [card];
          return [
            <View key={`arrow-${box.label}`} style={styles.flowArrow}>
              <Arrow />
            </View>,
            card,
          ];
        })}
      </View>
      {idea.note && <Text style={styles.flowNote}>{idea.note}</Text>}
    </View>
  );
}

function ScopeGrid({ scope }: { scope: Proposal['scope'] }) {
  return (
    <View>
      {pairs(scope).map(([left, right], index) => (
        <View
          key={left.title}
          style={index === 0 ? styles.scopeRowFirst : styles.scopeRow}
          wrap={false}
        >
          <View style={styles.scopeItem}>
            <Text style={styles.h3}>{left.title}</Text>
            <Text style={styles.scopeText}>{left.description}</Text>
          </View>
          <View style={styles.scopeGap} />
          {right ? (
            <View style={styles.scopeItem}>
              <Text style={styles.h3}>{right.title}</Text>
              <Text style={styles.scopeText}>{right.description}</Text>
            </View>
          ) : (
            <View style={styles.column} />
          )}
        </View>
      ))}
    </View>
  );
}

function Addon({ text }: { text: string }) {
  // The add-on arrives as one string; its first clause is the headline the design sets in bold.
  const cut = text.search(/[,.;](?:\s|$)/);
  const lead = cut > 0 ? text.slice(0, cut) : text;
  const rest = cut > 0 ? text.slice(cut) : '';
  return (
    <View style={styles.addon}>
      <View style={styles.addonBox}>
        <Text>
          <Text style={styles.addonLead}>{lead}</Text>
          {rest}
        </Text>
      </View>
    </View>
  );
}

function OptionCard({ option }: { option: Proposal['options'][number] }) {
  return (
    <View style={styles.option}>
      <Text style={styles.optionTag}>{option.label}</Text>
      <Text style={styles.optionTitle}>{option.title}</Text>
      <Text style={styles.price}>{option.price}</Text>
      <Text style={styles.priceNote}>{option.priceNote}</Text>
      {option.items.length > 0 && (
        <View style={styles.optionItems}>
          {option.items.map((item, index) => (
            <View key={item} style={index === 0 ? styles.optionItem : styles.optionItemNext}>
              <View style={styles.check}>
                <Check />
              </View>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      )}
      {option.addon && <Addon text={option.addon} />}
      {option.terms && <Text style={styles.terms}>{option.terms}</Text>}
    </View>
  );
}

function ReportBand({ text }: { text: string }) {
  return (
    <View style={styles.report} wrap={false}>
      <View style={styles.reportLead}>
        <Text style={styles.reportBig}>
          Dia <Text style={styles.reportAccent}>1º</Text>
        </Text>
        <Text style={styles.reportLabel}>Relatório mensal</Text>
      </View>
      <Text style={styles.reportText}>{text}</Text>
    </View>
  );
}

function ExtrasRow({ exclusions, brandNote }: { exclusions: string[]; brandNote?: string }) {
  if (exclusions.length === 0 && !brandNote) return null;
  return (
    <View style={styles.extras} wrap={false}>
      {exclusions.length > 0 && (
        <View style={styles.column}>
          <Text style={styles.h3}>Não está incluso</Text>
          {exclusions.map((item, index) => (
            <View key={item} style={index === 0 ? styles.dashItem : styles.dashItemNext}>
              <Text style={styles.dashMark}>–</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      )}
      {exclusions.length > 0 && brandNote && <View style={styles.extrasGap} />}
      {brandNote && (
        <View style={styles.column}>
          <Text style={styles.h3}>Sobre a marca</Text>
          <Text style={styles.brandNote}>{brandNote}</Text>
        </View>
      )}
    </View>
  );
}

function Steps({ steps }: { steps: Proposal['nextSteps'] }) {
  return (
    <View style={styles.steps}>
      {steps.map((step, index) => (
        <View key={step.title} style={styles.step} wrap={false}>
          <Text style={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</Text>
          <View style={styles.column}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepText}>{step.description}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function ChecklistCell({ item }: { item: string | undefined }) {
  if (item === undefined) return <View style={styles.column} />;
  return (
    <View style={styles.checklistCell}>
      <View style={styles.checklistBox} />
      <Text style={styles.bulletText}>{item}</Text>
    </View>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <View>
      {pairs(items).map(([left, right], index) => (
        <View
          key={left}
          style={index === 0 ? styles.checklistRowFirst : styles.checklistRow}
          wrap={false}
        >
          <ChecklistCell item={left} />
          <View style={styles.bulletGap} />
          <ChecklistCell item={right} />
        </View>
      ))}
    </View>
  );
}

function ContactBand({ contact }: { contact: Proposal['contact'] }) {
  return (
    <View style={styles.contact} wrap={false}>
      <View>
        <Text style={styles.contactLabel}>Ficou alguma dúvida?</Text>
        <Text style={styles.contactHeading}>É só me chamar no WhatsApp.</Text>
      </View>
      <View style={styles.contactList}>
        <Text style={styles.contactItem}>{contact.name}</Text>
        <Link
          style={[styles.contactItem, styles.contactLink]}
          src={`https://${displayUrl(contact.site)}`}
        >
          {displayUrl(contact.site)}
        </Link>
        <Link style={[styles.contactItem, styles.contactLink]} src={`mailto:${contact.email}`}>
          {contact.email}
        </Link>
      </View>
    </View>
  );
}

function Footer({ contact }: { contact: Proposal['contact'] }) {
  return (
    <View style={styles.footer} fixed>
      <Text>
        {contact.name} · {displayUrl(contact.site)}
      </Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function ContentPage({
  contact,
  children,
}: {
  contact: Proposal['contact'];
  children: React.ReactNode;
}) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.body}>{children}</View>
      <Footer contact={contact} />
    </Page>
  );
}

export function ProposalDocument({ proposal }: { proposal: Proposal }) {
  const sections = new Map(proposalSections(proposal).map(({ key, number }) => [key, number]));
  const { contact } = proposal;

  return (
    <Document title={`Proposta · ${proposal.clientName}`} author={contact.name} language="pt-BR">
      <Cover proposal={proposal} />

      <ContentPage contact={contact}>
        <Section sections={sections} name="conversation">
          <Bullets items={proposal.conversation} />
        </Section>
        <Section sections={sections} name="idea" spaced={sections.has('conversation')}>
          <Text>{proposal.idea.text}</Text>
          <FlowBoxes idea={proposal.idea} />
        </Section>
        <Section sections={sections} name="scope" spaced>
          <ScopeGrid scope={proposal.scope} />
        </Section>
      </ContentPage>

      <ContentPage contact={contact}>
        <SectionTitle number={sections.get('investment') ?? ''} title={SECTION_TITLES.investment} />
        <View style={styles.options}>
          {proposal.options.flatMap((option, index) => {
            const card = <OptionCard key={option.label} option={option} />;
            return index === 0
              ? [card]
              : [<View key={`gap-${option.label}`} style={styles.optionGap} />, card];
          })}
        </View>
        {proposal.monthlyReport && <ReportBand text={proposal.monthlyReport} />}
        <ExtrasRow exclusions={proposal.exclusions} brandNote={proposal.brandNote} />
      </ContentPage>

      <ContentPage contact={contact}>
        <Section sections={sections} name="nextSteps">
          <Steps steps={proposal.nextSteps} />
        </Section>
        <Section sections={sections} name="materials" spaced={sections.has('nextSteps')}>
          <Checklist items={proposal.materials} />
        </Section>
        {proposal.previewUrl && (
          <Section
            sections={sections}
            name="preview"
            spaced={sections.has('nextSteps') || sections.has('materials')}
          >
            <Text>
              A prévia que preparei continua no ar:{' '}
              <Link src={proposal.previewUrl} style={styles.previewLink}>
                {displayUrl(proposal.previewUrl)}
              </Link>
              . Ela é o ponto de partida; o site final ganha os ajustes que combinarmos.
            </Text>
          </Section>
        )}
        <ContactBand contact={contact} />
      </ContentPage>
    </Document>
  );
}
