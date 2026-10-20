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

  it('renders every skill by name, marking the daily-use ones', () => {
    render(<Skills />, { locale: 'en' });

    const daily = ['Next.js', 'TypeScript', 'Tailwind CSS', 'Shadcn/UI', 'React Native', 'Vercel'];
    for (const skill of daily) {
      expect(screen.getByText(skill)).toHaveClass('underline');
    }
    expect(screen.getByText('Radix UI')).not.toHaveClass('underline');
  });

  it('renders each category as a numbered heading', () => {
    render(<Skills />, { locale: 'en' });

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(7);
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('07')).toBeInTheDocument();
    expect(screen.getByText('// stack')).toBeInTheDocument();
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
});
