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
        requiredAspectRatio: '9:16'
      },
      {
        id: 'inciting-incident',
        name: 'The Problem',
        description: 'Show the conflict or the challenge you are facing.',
        durationHint: '5-10s',
        requiredAspectRatio: '9:16'
      },
      {
        id: 'climax',
        name: ' The Solution/Action',
        description: 'The peak moment of change or action.',
        durationHint: '5-10s',
        requiredAspectRatio: '9:16'
      },
      {
        id: 'resolution',
        name: 'The Payoff',
        description: 'Show the result and a Call to Action.',
        durationHint: '3-5s',
        requiredAspectRatio: '9:16'
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
        requiredAspectRatio: '9:16'
      },
      {
        id: 'step-1',
        name: 'Step 1: Prep',
        description: 'Gather materials or start the process.',
        durationHint: '5s',
        requiredAspectRatio: '9:16'
      },
      {
        id: 'step-2',
        name: 'Step 2: Execution',
        description: 'The main action.',
        durationHint: '10s',
        requiredAspectRatio: '9:16'
      },
      {
        id: 'outro',
        name: 'Result',
        description: 'Final look and goodbye.',
        durationHint: '5s',
        requiredAspectRatio: '9:16'
      }
    ]
  }
];
