import type { Meta, StoryObj } from '@storybook/react';
import { MacSlides } from './MacSlides';
import {
  createDenseDeckMarkdown,
  createEmptyDeckMarkdown,
  DEFAULT_MARKDOWN,
} from './sampleData';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import '@hypercard/rich-widgets/theme';

const alignmentDeck = [
  '<!-- align: center -->\n# Centered Title\n\nThis deck starts centered.',
  '<!-- align: left -->\n# Left Notes\n\n- Keep content left\n- Keep bullets aligned\n- Review parser output',
  '# Auto Layout\n\nAuto keeps headings centered while paragraphs remain left-aligned.',
].join('\n---\n');

const meta: Meta<typeof MacSlides> = {
  title: 'RichWidgets/MacSlides',
  component: MacSlides,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof MacSlides>;

export const Default: Story = {
  args: {
    fileName: 'Quarterly Deck',
  },
  decorators: [fullscreenDecorator],
};

export const EmptyDeck: Story = {
  args: {
    fileName: 'Blank Deck',
    initialMarkdown: createEmptyDeckMarkdown(),
  },
  decorators: [fullscreenDecorator],
};

export const DenseDeck: Story = {
  args: {
    fileName: 'Roadmap Review',
    initialMarkdown: createDenseDeckMarkdown(),
  },
  decorators: [fullscreenDecorator],
};

export const AlignmentStates: Story = {
  args: {
    fileName: 'Alignment Demo',
    initialMarkdown: alignmentDeck,
    initialSlide: 1,
  },
  decorators: [fullscreenDecorator],
};

export const PresentationOpen: Story = {
  args: {
    fileName: 'Presentation Mode',
    initialMarkdown: DEFAULT_MARKDOWN,
    initialSlide: 2,
    initialShowPresentation: true,
  },
  decorators: [fullscreenDecorator],
};

export const PaletteOpen: Story = {
  args: {
    fileName: 'Palette Demo',
    initialMarkdown: DEFAULT_MARKDOWN,
    initialShowPalette: true,
  },
  decorators: [fixedFrameDecorator(960, 620)],
};
