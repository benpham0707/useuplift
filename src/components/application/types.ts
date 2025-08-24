// Personal Information Types
export interface PersonalBasicsData {
  firstName: string;
  lastName: string;
  preferredName?: string;
  pronouns?: string;
  dateOfBirth?: string;
  phone?: string;
  email: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country: string;
  };
  demographics: {
    ethnicity: string[];
    gender?: string;
    lgbtq?: boolean;
    firstGen: 'yes' | 'no' | 'unsure';
    languages: string[];
  };
}

// Experiences & Activities Types
export interface Activity {
  id: string;
  category: string;
  name: string;
  organization?: string;
  description: string;
  position?: string;
  hoursPerWeek: number;
  weeksPerYear: number;
  grades: string[];
  leadership?: boolean;
  awards?: string[];
}

export interface WorkExperience {
  id: string;
  employer: string;
  position: string;
  description: string;
  startDate: string;
  endDate?: string;
  hoursPerWeek: number;
  paid: boolean;
}

export interface VolunteerService {
  id: string;
  organization: string;
  description: string;
  startDate: string;
  endDate?: string;
  hoursPerWeek: number;
  totalHours?: number;
}

export interface Leadership {
  id: string;
  position: string;
  organization: string;
  description: string;
  startDate: string;
  endDate?: string;
  impact: string;
}

export interface ExperiencesActivitiesData {
  activities: Activity[];
  workExperience: WorkExperience[];
  volunteerService: VolunteerService[];
  leadership: Leadership[];
}

// Academic Journey Types
export interface AcademicJourneyData {
  currentSchool: {
    name: string;
    type: string;
    city?: string;
    state?: string;
    country: string;
    ceebCode?: string;
  };
  gpa: {
    value?: string;
    scale: string;
    weighted?: boolean;
  };
  classRank: {
    rank?: string;
    classSize?: string;
  };
  coursework: {
    apCourses: string[];
    ibCourses: string[];
    dualEnrollment: string[];
    honors: string[];
  };
  testScores: {
    sat?: { score?: string; date?: string };
    act?: { score?: string; date?: string };
    subjectTests: Array<{ subject: string; score: string; date: string }>;
  };
}

// Community & Family Types
export interface CommunityFamilyData {
  family: {
    parentEducation: {
      parent1: { degree?: string; college?: string };
      parent2: { degree?: string; college?: string };
    };
    householdSize?: string;
    dependents?: string;
    income?: string;
  };
  circumstances: {
    fosterCare?: boolean;
    homeless?: boolean;
    ward?: boolean;
    refugee?: boolean;
    military?: boolean;
    additionalInfo?: string;
  };
}

// Awards & Recognition Types
export interface Award {
  id: string;
  name: string;
  category: string;
  levelOfRecognition: string[];
  type: 'academic' | 'non-academic';
  gradeReceived: string[];
  eligibilityRequirements?: string;
  description?: string;
}

export interface AwardsRecognitionData {
  awards: Award[];
}

// Personal Growth & Stories Types
export interface PersonalGrowthData {
  essays: {
    personalStatement: string;
    whyMajor?: string;
    whySchool?: string;
    diversity?: string;
    challenge?: string;
    achievement?: string;
    additional?: string;
  };
  shortAnswers: Array<{
    id: string;
    question: string;
    answer: string;
    wordLimit?: number;
  }>;
}