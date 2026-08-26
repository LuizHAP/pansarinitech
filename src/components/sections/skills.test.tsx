import { render, screen } from '@/test/render';
import { describe, expect, it } from 'vitest';
import { Skills } from './skills';

describe('<Skills />', () => {
  it('renders the section heading in en locale', () => {
    render(<Skills />, { locale: 'en' });

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Stack & Skills');
    expect(screen.getByText(/Underlined = daily use/i)).toBeInTheDocument();
  });

  it('renders all 7 categories', () => {
    render(<Skills />, { locale: 'en' });

    const categories = [
      'Frontend',
      'Mobile',
      'Backend',
      'Testing',
      'Cloud / DevOps',
      'Databases',
      'Tools',
    ];
    for (const cat of categories) {
      expect(screen.getByText(cat)).toBeInTheDocument();
    }
  });

  it('renders daily-use skills with underline', () => {
    render(<Skills />, { locale: 'en' });

    // These are the 6 daily-use skills (textBadge skills render their mono abbreviation)
    const dailySkills = [
      'Next.js',
      'TypeScript',
      'Tailwind CSS',
      'ui', // Shadcn/UI renders as mono abbreviation
      'React Native',
      'Vercel',
    ];
    for (const skill of dailySkills) {
      const el = screen.getByText(skill);
      expect(el).toHaveClass('underline');
    }
  });

  it('renders Portuguese categories', () => {
    render(<Skills />, { locale: 'pt' });

    const categories = [
      'Frontend',
      'Mobile',
      'Backend',
      'Testes',
      'Cloud / DevOps',
      'Bancos de Dados',
      'Ferramentas',
    ];
    for (const cat of categories) {
      expect(screen.getByText(cat)).toBeInTheDocument();
    }
  });

  it('renders mono abbreviations for textBadge skills', () => {
    render(<Skills />, { locale: 'en' });

    const abbreviations = ['ui', 'rdx', '{ }', 'RSC', 'axe', 'bio'];
    for (const abbr of abbreviations) {
      expect(screen.getByText(abbr)).toBeInTheDocument();
    }
  });
});
