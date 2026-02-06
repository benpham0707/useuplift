/**
 * Quick test for Portfolio Narrative Service
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('Starting quick narrative test...');
console.log('API Key found:', !!process.env.ANTHROPIC_API_KEY);

import {
  portfolioNarrativeService,
} from '../src/services/portfolioStrategy/services/activityWorkshop';
import { ActivityWorkshopSessionInput } from '../src/services/portfolioStrategy/services/activityWorkshop/types';

console.log('Imports successful!');

const testInput: ActivityWorkshopSessionInput = {
  activities: [
    {
      id: 'act-1',
      title: 'Robotics Team Captain',
      organization: 'High School',
      role: 'Captain',
      description: 'Led team to state championship. Designed custom drivetrain. Mentored new members.',
      category: 'school_activity',
      hoursPerWeek: 15,
      weeksPerYear: 40,
    },
    {
      id: 'act-2',
      title: 'AI Research',
      organization: 'University Lab',
      role: 'Intern',
      description: 'Developed neural networks for autonomous vehicles. Published paper.',
      category: 'work',
      hoursPerWeek: 20,
      weeksPerYear: 12,
      isPaid: true,
    },
  ],
  studentContext: {
    intendedMajor: 'Computer Science',
    gradeLevel: 12,
  },
};

async function main() {
  console.log('\nRunning initial narrative analysis...');
  const sessionId = `quick-test-${Date.now()}`;

  try {
    const narrative = await portfolioNarrativeService.analyzeInitialNarrative(
      testInput,
      sessionId
    );

    console.log('\n✅ SUCCESS!');
    console.log('\nStory Pitch:', narrative.story.pitch);
    console.log('Coherence:', narrative.coherence.assessment, `(${narrative.coherence.score}/100)`);
    console.log('Threads:', narrative.threads.length);
    console.log('Elevations:', narrative.elevations.length);
    console.log('Cost:', `$${narrative.metadata.cost.toFixed(4)}`);

    // Cleanup
    portfolioNarrativeService.clearCachedNarrative(sessionId);
  } catch (error) {
    console.error('\n❌ ERROR:', error);
  }
}

main().catch(console.error);
