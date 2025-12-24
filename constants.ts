import { Recipe } from './types';

export const MASTER_RECIPES: Recipe[] = [
  {
    id: 'hero-journey',
    name: 'The Hero\'s Journey (Short)',
    description: 'A classic 3-act structure condensed for social media.',
    slots: [
      {
        id: 'hook',
        name: 'The Hook',
        description: 'Start with a visual disruption or a burning question. Grab attention immediately.',
        durationHint: '3-5s',
        requiredAspectRatio: '9:16',
        hasSubtitles: true
      },
      {
        id: 'inciting-incident',
        name: 'The Problem',
        description: 'Show the conflict or the challenge you are facing.',
        durationHint: '5-10s',
        requiredAspectRatio: '9:16',
        hasSubtitles: true
      },
      {
        id: 'climax',
        name: ' The Solution/Action',
        description: 'The peak moment of change or action.',
        durationHint: '5-10s',
        requiredAspectRatio: '9:16',
        hasSubtitles: false
      },
      {
        id: 'resolution',
        name: 'The Payoff',
        description: 'Show the result and a Call to Action.',
        durationHint: '3-5s',
        requiredAspectRatio: '9:16',
        hasSubtitles: true
      }
    ]
  },
  {
    id: 'tutorial-flash',
    name: 'Flash Tutorial',
    description: 'Teach something in under 30 seconds.',
    slots: [
      {
        id: 'intro',
        name: 'What We Are Making',
        description: 'Show the finished result first.',
        durationHint: '3s',
        requiredAspectRatio: '9:16',
        hasSubtitles: true
      },
      {
        id: 'step-1',
        name: 'Step 1: Prep',
        description: 'Gather materials or start the process.',
        durationHint: '5s',
        requiredAspectRatio: '9:16',
        hasSubtitles: false
      },
      {
        id: 'step-2',
        name: 'Step 2: Execution',
        description: 'The main action.',
        durationHint: '10s',
        requiredAspectRatio: '9:16',
        hasSubtitles: false
      },
      {
        id: 'outro',
        name: 'Result',
        description: 'Final look and goodbye.',
        durationHint: '5s',
        requiredAspectRatio: '9:16',
        hasSubtitles: true
      }
    ]
  },
  {
    id: 'sales-pas',
    name: 'Problem / Agitate / Solve',
    description: 'The classic high-conversion sales structure.',
    slots: [
      {
        id: 'the-stab',
        name: 'The Stab',
        description: 'Identify the pain point clearly. (Front Camera)',
        durationHint: '5s',
        requiredAspectRatio: '9:16',
        hasSubtitles: true
      },
      {
        id: 'the-twist',
        name: 'The Twist',
        description: 'Show why ignoring this problem makes it worse. (B-Roll of chaos/failure)',
        durationHint: '5-10s',
        requiredAspectRatio: '9:16',
        hasSubtitles: false
      },
      {
        id: 'the-balm',
        name: 'The Balm',
        description: 'Introduce the solution or product. (Front Camera)',
        durationHint: '5s',
        requiredAspectRatio: '9:16',
        hasSubtitles: true
      },
      {
        id: 'the-proof',
        name: 'The Proof',
        description: 'Show one specific benefit or successful result. (B-Roll of success)',
        durationHint: '5s',
        requiredAspectRatio: '9:16',
        hasSubtitles: false
      }
    ]
  },
  {
    id: 'edu-socratic',
    name: 'The Socratic Question',
    description: 'Engage viewers by challenging common assumptions.',
    slots: [
      {
        id: 'the-query',
        name: 'The Query',
        description: 'Ask a question that contradicts common sense. (e.g., "Why do we sleep?")',
        durationHint: '5s',
        requiredAspectRatio: '9:16',
        hasSubtitles: true
      },
      {
        id: 'the-hypothesis',
        name: 'The Hypothesis',
        description: 'State the common wrong answer most people give.',
        durationHint: '5-10s',
        requiredAspectRatio: '9:16',
        hasSubtitles: true
      },
      {
        id: 'the-rebuttal',
        name: 'The Rebuttal',
        description: 'Reveal the actual truth or scientific fact.',
        durationHint: '10s',
        requiredAspectRatio: '9:16',
        hasSubtitles: true
      },
      {
        id: 'the-insight',
        name: 'The Insight',
        description: 'Give one actionable takeaway based on this truth.',
        durationHint: '5s',
        requiredAspectRatio: '9:16',
        hasSubtitles: true
      }
    ]
  },
  {
    id: 'visual-revelation',
    name: 'The Visual Revelation',
    description: 'A high-engagement format relying on visual curiosity.',
    slots: [
      {
        id: 'the-blind',
        name: 'The Blind',
        description: 'Extreme close-up on an object. Make the viewer guess what it is. (B-Roll)',
        durationHint: '3s',
        requiredAspectRatio: '9:16',
        hasSubtitles: false
      },
      {
        id: 'the-reveal',
        name: 'The Reveal',
        description: 'Pull back to show the object in its full context. (B-Roll)',
        durationHint: '3s',
        requiredAspectRatio: '9:16',
        hasSubtitles: false
      },
      {
        id: 'the-reaction',
        name: 'The Reaction',
        description: 'Your face reacting to the object or context. (Front Camera)',
        durationHint: '3-5s',
        requiredAspectRatio: '9:16',
        hasSubtitles: true
      }
    ]
  },
  {
    id: 'humble-brag',
    name: 'The Humble Brag',
    description: 'Build personal brand authority through vulnerability.',
    slots: [
      {
        id: 'the-old-me',
        name: 'The Old Me',
        description: 'State your past struggle. "3 years ago I was..." (Photo Overlay/B-Roll)',
        durationHint: '5s',
        requiredAspectRatio: '9:16',
        hasSubtitles: true
      },
      {
        id: 'the-shift',
        name: 'The Shift',
        description: 'Explain the one habit or decision that changed everything. (Front Camera)',
        durationHint: '10s',
        requiredAspectRatio: '9:16',
        hasSubtitles: true
      },
      {
        id: 'the-result',
        name: 'The Result',
        description: 'Show where you are now. The payoff. (B-Roll)',
        durationHint: '5s',
        requiredAspectRatio: '9:16',
        hasSubtitles: false
      }
    ]
  },
  {
    id: 'instructional-loop',
    name: 'The Instructional Loop',
    description: 'A rapid-fire How-To format perfect for loops.',
    slots: [
      {
        id: 'the-result',
        name: 'The Result',
        description: 'Show the finished product first to hook them.',
        durationHint: '3s',
        requiredAspectRatio: '9:16',
        hasSubtitles: false
      },
      {
        id: 'the-ingredients',
        name: 'The Ingredients',
        description: 'Quick flash of tools or ingredients needed.',
        durationHint: '3s',
        requiredAspectRatio: '9:16',
        hasSubtitles: false
      },
      {
        id: 'the-process',
        name: 'The Process',
        description: 'The assembly or action steps. Speed-ramped.',
        durationHint: '15s',
        requiredAspectRatio: '9:16',
        hasSubtitles: false
      },
      {
        id: 'the-recap',
        name: 'The Recap',
        description: 'Summary of steps or final beauty shot.',
        durationHint: '5s',
        requiredAspectRatio: '9:16',
        hasSubtitles: true
      }
    ]
  }
];