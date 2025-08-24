import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2 } from 'lucide-react';
import type { PersonalGrowthData } from '../types';

interface PersonalGrowthStepProps {
  data: PersonalGrowthData;
  onChange: (data: PersonalGrowthData) => void;
}

const ESSAY_PROMPTS = {
  personalStatement: {
    title: "Personal Statement",
    prompt: "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story.",
    wordLimit: 650
  },
  whyMajor: {
    title: "Why This Major?",
    prompt: "Describe your interest in your intended major/field of study. What experiences have shaped this interest?",
    wordLimit: 500
  },
  whySchool: {
    title: "Why This School?",
    prompt: "Why are you interested in attending this particular college/university? What specific programs, opportunities, or aspects of the school appeal to you?",
    wordLimit: 400
  },
  diversity: {
    title: "Diversity Statement", 
    prompt: "How will you contribute to the diversity of thought, experience, and perspective in our community? What unique qualities or experiences will you bring?",
    wordLimit: 500
  },
  challenge: {
    title: "Overcoming Challenges",
    prompt: "Describe a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?",
    wordLimit: 500
  },
  achievement: {
    title: "Accomplishment",
    prompt: "Describe an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.",
    wordLimit: 500
  },
  additional: {
    title: "Additional Information",
    prompt: "Is there anything else you would like the admissions committee to know about you?",
    wordLimit: 500
  }
};

export default function PersonalGrowthStep({ data, onChange }: PersonalGrowthStepProps) {
  const [activeTab, setActiveTab] = useState('essays');

  const updateEssay = (essayType: keyof typeof data.essays, value: string) => {
    onChange({
      ...data,
      essays: {
        ...data.essays,
        [essayType]: value
      }
    });
  };

  const addShortAnswer = () => {
    const newShortAnswer = {
      id: Date.now().toString(),
      question: '',
      answer: '',
      wordLimit: 150
    };
    onChange({
      ...data,
      shortAnswers: [...data.shortAnswers, newShortAnswer]
    });
  };

  const updateShortAnswer = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      shortAnswers: data.shortAnswers.map(sa =>
        sa.id === id ? { ...sa, [field]: value } : sa
      )
    });
  };

  const removeShortAnswer = (id: string) => {
    onChange({
      ...data,
      shortAnswers: data.shortAnswers.filter(sa => sa.id !== id)
    });
  };

  const getWordCount = (text: string) => {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground">
          Share your story through essays and short answers. Take your time to craft thoughtful responses that showcase who you are beyond grades and test scores.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="essays">Personal Essays</TabsTrigger>
          <TabsTrigger value="shortAnswers">Short Answers</TabsTrigger>
        </TabsList>

        <TabsContent value="essays" className="space-y-6">
          <h3 className="text-lg font-semibold">Personal Essays</h3>
          
          {Object.entries(ESSAY_PROMPTS).map(([key, prompt]) => {
            const essayKey = key as keyof typeof data.essays;
            const currentText = data.essays[essayKey] || '';
            const wordCount = getWordCount(currentText);
            const isOverLimit = wordCount > prompt.wordLimit;
            
            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-base flex justify-between items-start">
                    <div>
                      <span>{prompt.title}</span>
                      {essayKey === 'personalStatement' && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </div>
                    <div className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {wordCount}/{prompt.wordLimit} words
                    </div>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    {prompt.prompt}
                  </p>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={currentText}
                    onChange={(e) => updateEssay(essayKey, e.target.value)}
                    placeholder="Begin writing your response here..."
                    rows={12}
                    className="resize-none"
                  />
                  {isOverLimit && (
                    <p className="text-xs text-red-500 mt-1">
                      Your response exceeds the word limit. Please revise to stay within {prompt.wordLimit} words.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="shortAnswers" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Short Answer Questions</h3>
              <p className="text-sm text-muted-foreground">
                These are typically school-specific questions that vary by institution.
              </p>
            </div>
            <Button onClick={addShortAnswer} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>

          {data.shortAnswers.map((shortAnswer, index) => {
            const wordCount = getWordCount(shortAnswer.answer);
            const isOverLimit = shortAnswer.wordLimit ? wordCount > shortAnswer.wordLimit : false;
            
            return (
              <Card key={shortAnswer.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">
                      Short Answer #{index + 1}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeShortAnswer(shortAnswer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                      <Label>Question Prompt</Label>
                      <Input
                        value={shortAnswer.question}
                        onChange={(e) => updateShortAnswer(shortAnswer.id, 'question', e.target.value)}
                        placeholder="Enter the question prompt..."
                      />
                    </div>
                    <div>
                      <Label>Word Limit</Label>
                      <Input
                        type="number"
                        min="1"
                        value={shortAnswer.wordLimit || ''}
                        onChange={(e) => updateShortAnswer(shortAnswer.id, 'wordLimit', 
                          e.target.value ? Number(e.target.value) : undefined
                        )}
                        placeholder="e.g., 150"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Your Response</Label>
                      {shortAnswer.wordLimit && (
                        <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {wordCount}/{shortAnswer.wordLimit} words
                        </span>
                      )}
                    </div>
                    <Textarea
                      value={shortAnswer.answer}
                      onChange={(e) => updateShortAnswer(shortAnswer.id, 'answer', e.target.value)}
                      placeholder="Write your response here..."
                      rows={4}
                    />
                    {isOverLimit && (
                      <p className="text-xs text-red-500 mt-1">
                        Your response exceeds the word limit. Please revise to stay within {shortAnswer.wordLimit} words.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {data.shortAnswers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No short answer questions added yet.</p>
              <p className="text-sm mt-2">
                Add questions specific to the schools you're applying to.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Writing Tips */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Writing Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>• <strong>Be authentic:</strong> Write in your own voice and share genuine experiences.</li>
            <li>• <strong>Show, don't tell:</strong> Use specific examples and stories rather than general statements.</li>
            <li>• <strong>Focus on growth:</strong> Highlight what you learned or how you changed from your experiences.</li>
            <li>• <strong>Be specific:</strong> Avoid clichés and generic responses. Make your essay uniquely yours.</li>
            <li>• <strong>Proofread:</strong> Check for grammar, spelling, and clarity before submitting.</li>
            <li>• <strong>Stay within limits:</strong> Respect word counts - they show you can follow directions.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}