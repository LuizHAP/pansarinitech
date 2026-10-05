import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PreviewViewer, type PreviewViewerLabels } from './preview-viewer';

const labels: PreviewViewerLabels = {
  preview: 'Website preview',
  brand: 'Luiz Pansarini, open portfolio in a new tab',
  viewport: 'Screen size',
  desktop: 'Desktop',
  mobile: 'Mobile',
  frame: 'Cliente Exemplo website',
};

function renderViewer() {
  return render(
    <PreviewViewer
      client="Cliente Exemplo"
      src="/client-previews/exemplo/index.html"
      labels={labels}
    />,
  );
}

describe('PreviewViewer', () => {
  it('renders the client site in a titled iframe', () => {
    renderViewer();
    expect(screen.getByTitle('Cliente Exemplo website')).toHaveAttribute(
      'src',
      '/client-previews/exemplo/index.html',
    );
  });

  it('names the preview and the client in the level-1 heading', () => {
    renderViewer();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Website preview');
    expect(heading).toHaveTextContent('Cliente Exemplo');
  });

  it('starts in desktop mode with a full-width frame', () => {
    renderViewer();
    const group = screen.getByRole('group', { name: 'Screen size' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desktop' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Mobile' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTitle('Cliente Exemplo website')).not.toHaveAttribute('style');
  });

  it('switches the frame to 390px in mobile mode and back to full width in desktop mode', async () => {
    const user = userEvent.setup();
    renderViewer();
    const frame = screen.getByTitle('Cliente Exemplo website');
    const desktop = screen.getByRole('button', { name: 'Desktop' });
    const mobile = screen.getByRole('button', { name: 'Mobile' });

    await user.click(mobile);
    expect(mobile).toHaveAttribute('aria-pressed', 'true');
    expect(desktop).toHaveAttribute('aria-pressed', 'false');
    expect(frame).toHaveStyle({ width: '390px' });

    await user.click(desktop);
    expect(desktop).toHaveAttribute('aria-pressed', 'true');
    expect(mobile).toHaveAttribute('aria-pressed', 'false');
    // React clears the declarations but leaves an empty style="" behind.
    expect(frame.style.width).toBe('');
  });

  it('links the brand to the portfolio home in a new tab', () => {
    renderViewer();
    const link = screen.getByRole('link', { name: 'Luiz Pansarini, open portfolio in a new tab' });
    expect(link).toHaveAttribute('href', '/');
    expect(link).toHaveAttribute('target', '_blank');
    const rel = link.getAttribute('rel') ?? '';
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });
});
