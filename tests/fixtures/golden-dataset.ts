
export interface EssayExample {
  id: string;
  tier: 'Elite' | 'Good' | 'Developing' | 'Weak';
  type: 'PIQ' | 'CommonApp';
  prompt?: string;
  text: string;
  metadata?: {
    major?: string;
    activities?: string[];
    demographics?: string;
  };
  expectedScores?: {
    role?: number;
    context?: number;
    voice?: number;
    initiative?: number;
    fit?: number;
  };
}

export const GOLDEN_DATASET: EssayExample[] = [
  {
    id: 'elite_translator',
    tier: 'Elite',
    type: 'PIQ',
    prompt: 'Educational Barrier',
    text: `My hands shook as I dialed the number for the third time. The counselor's voicemail clicked on again. It was 9 PM on a Sunday—of course no one would answer. But tomorrow was the scholarship deadline, and I still didn't have the documents I needed.

My family doesn't do paperwork. My dad works construction, paid in cash. My mom cleans houses—also cash. When the scholarship asked for "proof of income," I stared at the blank form, panic rising in my chest. We don't have W-2s. We don't have pay stubs. We don't even have bank statements because my parents don't trust banks.

For weeks, I'd been the go-between: translating forms into Spanish for my parents, then trying to translate their explanations back into bureaucratic English. "Tell them your father makes about $400 a week, más o menos," my mom had said. But "más o menos" doesn't fit into the neat boxes on a federal form.

I'd spent my whole life being resourceful—the family translator, the one who figured things out. But this felt different. I wasn't just translating words; I was trying to translate an entire way of life into a system that didn't have space for it.

That night, I made a decision. I wrote a letter to the scholarship committee explaining our situation. I attached my father's testimonial letter (which I helped him write), copies of rent receipts, and even grocery store receipts to show our family expenses. It felt makeshift, inadequate. But it was honest.

Two months later, I got the scholarship. But more importantly, I got something else: I stopped seeing my family's way of life as a problem to be solved. Their resilience—working without the safety net of official documentation, building a life brick by brick—that was its own kind of wealth. Now, I help other students navigate these systems at UC Berkeley, and I tell them: your story matters, even if it doesn't fit the form. I'm studying sociology and public policy to redesign systems that leave families like mine out.`,
    metadata: {
      major: 'Sociology / Public Policy',
      activities: ['Family Translator', 'Scholarship Applicant'],
      demographics: 'First-gen, Low-income'
    },
    expectedScores: {
      role: 9.0,
      context: 9.5,
      voice: 9.0,
      initiative: 8.5,
      fit: 9.0
    }
  },
  {
    id: 'good_debate',
    tier: 'Good',
    type: 'PIQ',
    prompt: 'Leadership',
    text: `I've always been the quiet one in debate class. While others jumped to speak, I sat back, thinking through arguments. My coach once told me I needed to "be more assertive." But I realized that listening first—really listening—gave me an advantage.

During our regional tournament, I noticed something our opponents kept doing: they'd make a strong opening claim but never address counterarguments. While my teammates practiced their rebuttals, I created a system for tracking patterns in opposing teams' arguments. I built a spreadsheet categorizing common debate tactics and their weaknesses.

When my turn came, I used my tracking system to predict their next move. It worked—we won that round. My coach was impressed and asked me to share my system with the team.

This experience showed me that leadership isn't always about being the loudest voice. Sometimes it's about noticing what others miss. At UC Davis, I want to study data science and continue finding patterns that help teams work smarter. I plan to join the debate team and bring this analytical approach to competitions.`,
    metadata: {
      major: 'Data Science',
      activities: ['Debate Team'],
    },
    expectedScores: {
      role: 7.5,
      context: 6.0,
      voice: 8.0,
      initiative: 8.0,
      fit: 7.5
    }
  },
  {
    id: 'developing_student_council',
    tier: 'Developing',
    type: 'PIQ',
    prompt: 'Leadership',
    text: `Through my experience as student council president, I learned the importance of teamwork and communication. We organized many events that helped our school community.

I was part of various initiatives including the food drive, spirit week, and prom planning. These activities taught me valuable leadership skills. I learned that it's important to listen to others and work together toward common goals.

Being involved in student council was challenging but rewarding. I had to balance schoolwork with my responsibilities. This taught me time management and dedication.

I realized that making a difference requires effort and commitment. The experience helped me grow as a leader and showed me the value of serving others. I want to continue being involved in leadership roles in college and help make a positive impact on campus.`,
    expectedScores: {
      role: 4.0,
      context: 3.0,
      voice: 4.0,
      initiative: 3.0,
      fit: 4.0
    }
  },
  {
    id: 'weak_generic',
    tier: 'Weak',
    type: 'PIQ',
    prompt: 'Community Service',
    text: `I like helping people and making a difference in my community. In high school, I participated in many activities like volunteering and clubs.

I was in student government and helped with events. I also did community service at the local food bank. These experiences were good because they taught me about helping others.

I think leadership is important. Through these activities, I learned to work with people and be a team player. I discovered that working together makes things better.

I want to study business in college and help make the world a better place. I hope to continue my leadership activities at UC and contribute to the campus community. I believe I can make a difference.`,
    expectedScores: {
      role: 2.0,
      context: 1.0,
      voice: 2.0,
      initiative: 1.0,
      fit: 2.0
    }
  },
  // Add more robust examples here as needed
  {
    id: 'elite_costco_style',
    tier: 'Elite',
    type: 'CommonApp',
    prompt: 'Personal Statement',
    text: `Specific, vivid, and authentic storytelling about a mundane topic. [Placeholder for full Costco-style essay synthesis if needed, but for now keeping the list focused on PIQ style for regression]`,
    expectedScores: {
      role: 9.5,
      context: 8.0,
      voice: 9.5,
      initiative: 7.0,
      fit: 8.0
    }
  }
];

