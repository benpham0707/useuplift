// src/core/domain/entities/AcademicRecord.ts

import { v4 as uuidv4 } from 'uuid';

export enum GPAScale {
  FOUR_POINT = '4.0',
  FIVE_POINT = '5.0',
  HUNDRED_POINT = '100',
  INTERNATIONAL = 'international'
}

export enum CourseLevel {
  REGULAR = 'regular',
  HONORS = 'honors',
  AP = 'ap',
  IB = 'ib',
  DUAL_ENROLLMENT = 'dual_enrollment',
  COLLEGE = 'college'
}

export interface Course {
  name: string;
  level: CourseLevel;
  grade?: string;
  credits?: number;
  year: string; // e.g., "2023-2024"
  semester?: 'fall' | 'spring' | 'summer' | 'full_year';
  subject: string; // math, science, english, etc.
}

export interface StandardizedTest {
  type: 'SAT' | 'ACT' | 'AP' | 'IB' | 'TOEFL' | 'IELTS' | 'OTHER';
  score: string; // String to handle various formats
  percentile?: number;
  dateTaken: Date;
  subscores?: Record<string, string>;
}

export interface School {
  name: string;
  type: 'public' | 'private' | 'charter' | 'magnet' | 'homeschool' | 'international';
  city: string;
  state?: string;
  country: string;
  graduationYear?: number;
}

export class AcademicRecord {
  public readonly id: string;
  public readonly profileId: string;
  public readonly createdAt: Date;
  public updatedAt: Date;
  
  // School Information
  public school: School;
  public currentGrade: string; // 9th, 10th, etc.
  
  // GPA Information
  public gpa?: number;
  public gpaScale: GPAScale;
  public weightedGPA?: number;
  public classRank?: number;
  public classSize?: number;
  
  // Coursework
  public coursework: Course[] = [];
  public plannedCourses: Course[] = []; // For future semesters
  
  // Test Scores
  public standardizedTests: StandardizedTest[] = [];
  
  // Academic Interests
  public strongSubjects: string[] = [];
  public strugglingSubjects: string[] = [];
  public academicInterests: string[] = [];
  
  // Additional Academic Info
  public academicHonors: string[] = [];
  public summerPrograms: string[] = [];
  
  constructor(data: {
    profileId: string;
    school: School;
    currentGrade: string;
    gpaScale: GPAScale;
    gpa?: number;
    weightedGPA?: number;
  }) {
    this.id = uuidv4();
    this.profileId = data.profileId;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    this.school = data.school;
    this.currentGrade = data.currentGrade;
    this.gpaScale = data.gpaScale;
    this.gpa = data.gpa;
    this.weightedGPA = data.weightedGPA;
  }
  
  // Domain Methods
  
  public addCourse(course: Course): void {
    // Validate course doesn't already exist
    const exists = this.coursework.some(c => 
      c.name === course.name && 
      c.year === course.year && 
      c.semester === course.semester
    );
    
    if (!exists) {
      this.coursework.push(course);
      this.updatedAt = new Date();
    }
  }
  
  public addPlannedCourse(course: Course): void {
    this.plannedCourses.push(course);
    this.updatedAt = new Date();
  }
  
  public addStandardizedTest(test: StandardizedTest): void {
    // Update if same test type exists, otherwise add
    const existingIndex = this.standardizedTests.findIndex(t => t.type === test.type);
    
    if (existingIndex >= 0) {
      // Keep the better score
      const existing = this.standardizedTests[existingIndex];
      if (this.compareTestScores(test, existing) > 0) {
        this.standardizedTests[existingIndex] = test;
      }
    } else {
      this.standardizedTests.push(test);
    }
    
    this.updatedAt = new Date();
  }
  
  public updateClassRank(rank: number, classSize: number): void {
    this.classRank = rank;
    this.classSize = classSize;
    this.updatedAt = new Date();
  }
  
  public addAcademicHonor(honor: string): void {
    if (!this.academicHonors.includes(honor)) {
      this.academicHonors.push(honor);
      this.updatedAt = new Date();
    }
  }
  
  public addSummerProgram(program: string): void {
    if (!this.summerPrograms.includes(program)) {
      this.summerPrograms.push(program);
      this.updatedAt = new Date();
    }
  }
  
  // Calculation Methods
  
  public calculateAcademicRigor(): number {
    if (this.coursework.length === 0) return 0;
    
    const rigorPoints: Record<CourseLevel, number> = {
      [CourseLevel.REGULAR]: 1,
      [CourseLevel.HONORS]: 2,
      [CourseLevel.AP]: 3,
      [CourseLevel.IB]: 3,
      [CourseLevel.DUAL_ENROLLMENT]: 3,
      [CourseLevel.COLLEGE]: 3
    };
    
    const totalRigor = this.coursework.reduce((sum, course) => 
      sum + rigorPoints[course.level], 0
    );
    
    const averageRigor = totalRigor / this.coursework.length;
    return Math.min(averageRigor / 3, 1); // Normalize to 0-1
  }
  
  public calculateCourseBalance(): Record<string, number> {
    const subjectCounts: Record<string, number> = {};
    
    this.coursework.forEach(course => {
      subjectCounts[course.subject] = (subjectCounts[course.subject] || 0) + 1;
    });
    
    return subjectCounts;
  }
  
  public getStandardizedGPA(): number | null {
    if (!this.gpa) return null;
    
    // Convert to 4.0 scale for comparison
    switch (this.gpaScale) {
      case GPAScale.FOUR_POINT:
        return this.gpa;
      case GPAScale.FIVE_POINT:
        return (this.gpa / 5) * 4;
      case GPAScale.HUNDRED_POINT:
        return (this.gpa / 100) * 4;
      default:
        return null;
    }
  }
  
  public getClassRankPercentile(): number | null {
    if (!this.classRank || !this.classSize) return null;
    return ((this.classSize - this.classRank + 1) / this.classSize) * 100;
  }
  
  public getAcademicStrength(): {
    overall: number;
    factors: Record<string, number>;
  } {
    const factors: Record<string, number> = {
      gpa: 0,
      rigor: 0,
      testing: 0,
      consistency: 0,
      extras: 0
    };
    
    // GPA Factor (30%)
    const standardizedGPA = this.getStandardizedGPA();
    if (standardizedGPA !== null) {
      factors.gpa = Math.min(standardizedGPA / 4, 1) * 0.3;
    }
    
    // Rigor Factor (25%)
    factors.rigor = this.calculateAcademicRigor() * 0.25;
    
    // Testing Factor (20%)
    if (this.standardizedTests.length > 0) {
      const bestSAT = this.getBestTestScore('SAT');
      const bestACT = this.getBestTestScore('ACT');
      
      let testScore = 0;
      if (bestSAT) {
        testScore = Math.max(testScore, parseInt(bestSAT.score) / 1600);
      }
      if (bestACT) {
        testScore = Math.max(testScore, parseInt(bestACT.score) / 36);
      }
      
      factors.testing = testScore * 0.2;
    }
    
    // Consistency Factor (15%)
    factors.consistency = this.calculateGradeConsistency() * 0.15;
    
    // Extras Factor (10%)
    const extrasScore = (
      Math.min(this.academicHonors.length / 3, 1) * 0.5 +
      Math.min(this.summerPrograms.length / 2, 1) * 0.5
    );
    factors.extras = extrasScore * 0.1;
    
    const overall = Object.values(factors).reduce((a, b) => a + b, 0);
    
    return { overall, factors };
  }
  
  public suggestImprovements(): string[] {
    const suggestions: string[] = [];
    const strength = this.getAcademicStrength();
    
    if (strength.factors.gpa < 0.2) {
      suggestions.push('Focus on improving grades in current courses');
    }
    
    if (strength.factors.rigor < 0.15) {
      suggestions.push('Consider taking more challenging courses (Honors/AP/IB)');
    }
    
    if (strength.factors.testing === 0) {
      suggestions.push('Take SAT or ACT to strengthen college applications');
    }
    
    if (this.strugglingSubjects.length > 0) {
      suggestions.push(`Seek help in ${this.strugglingSubjects.join(', ')} to improve overall GPA`);
    }
    
    if (this.academicHonors.length === 0) {
      suggestions.push('Pursue academic competitions or honor societies');
    }
    
    return suggestions;
  }
  
  // Validation Methods
  
  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // GPA validation
    if (this.gpa !== undefined) {
      if (this.gpaScale === GPAScale.FOUR_POINT && this.gpa > 4.0 && !this.weightedGPA) {
        errors.push('Unweighted GPA cannot exceed 4.0 on a 4.0 scale');
      }
      if (this.gpaScale === GPAScale.FIVE_POINT && this.gpa > 5.0) {
        errors.push('GPA cannot exceed 5.0 on a 5.0 scale');
      }
      if (this.gpaScale === GPAScale.HUNDRED_POINT && this.gpa > 100) {
        errors.push('GPA cannot exceed 100 on a 100-point scale');
      }
    }
    
    // Class rank validation
    if (this.classRank && this.classSize && this.classRank > this.classSize) {
      errors.push('Class rank cannot exceed class size');
    }
    
    // Course validation
    this.coursework.forEach((course, index) => {
      if (!course.name || !course.level || !course.subject) {
        errors.push(`Course at index ${index} is missing required fields`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Private Methods
  
  private compareTestScores(test1: StandardizedTest, test2: StandardizedTest): number {
    // Compare percentiles if available, otherwise raw scores
    if (test1.percentile && test2.percentile) {
      return test1.percentile - test2.percentile;
    }
    
    // For same test types, compare scores directly
    if (test1.type === test2.type) {
      const score1 = parseInt(test1.score);
      const score2 = parseInt(test2.score);
      return score1 - score2;
    }
    
    return 0;
  }
  
  private getBestTestScore(type: 'SAT' | 'ACT'): StandardizedTest | null {
    const tests = this.standardizedTests.filter(t => t.type === type);
    if (tests.length === 0) return null;
    
    return tests.reduce((best, current) => 
      this.compareTestScores(current, best) > 0 ? current : best
    );
  }
  
  private calculateGradeConsistency(): number {
    if (this.coursework.length === 0) return 0;
    
    // Calculate variance in grades (simplified)
    const gradesWithNumericValue = this.coursework
      .filter(c => c.grade)
      .map(c => this.gradeToNumeric(c.grade!));
    
    if (gradesWithNumericValue.length === 0) return 0;
    
    const avg = gradesWithNumericValue.reduce((a, b) => a + b, 0) / gradesWithNumericValue.length;
    const variance = gradesWithNumericValue.reduce((sum, grade) => 
      sum + Math.pow(grade - avg, 2), 0
    ) / gradesWithNumericValue.length;
    
    // Lower variance = higher consistency
    return Math.max(0, 1 - (variance / 16)); // 16 is max variance (0-4 scale)
  }
  
  private gradeToNumeric(grade: string): number {
    const gradeMap: Record<string, number> = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0
    };
    
    return gradeMap[grade.toUpperCase()] || 0;
  }
}

export default AcademicRecord;