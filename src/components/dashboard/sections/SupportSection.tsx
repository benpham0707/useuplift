import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';

interface SectionFormProps {
  profileId: string;
  onSaveComplete: () => void;
}

interface CounselorData {
  name: string;
  email: string;
  relationship_quality: string;
}

interface TeacherData {
  name: string;
  subject: string;
  relationship: string;
}

interface CommunityOrgData {
  name: string;
  role: string;
  how_they_help: string;
}

interface PortfolioItemData {
  title: string;
  description: string;
  url?: string;
}

interface SupportNetworkData {
  counselor: CounselorData;
  teachers: TeacherData[];
  has_community_support: boolean;
  community_organizations: CommunityOrgData[];
  has_portfolio_items: boolean;
  portfolio_items: PortfolioItemData[];
  wants_to_upload_documents: boolean;
  documents: Array<{ name: string; type: string }>;
}

export default function SupportSection({ profileId, onSaveComplete }: SectionFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [counselor, setCounselor] = useState<CounselorData>({
    name: '',
    email: '',
    relationship_quality: ''
  });
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [hasCommunitySupport, setHasCommunitySupport] = useState(false);
  const [communityOrgs, setCommunityOrgs] = useState<CommunityOrgData[]>([]);
  const [hasPortfolioItems, setHasPortfolioItems] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItemData[]>([]);
  const [wantsToUploadDocuments, setWantsToUploadDocuments] = useState(false);

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('support_network')
          .select('*')
          .eq('profile_id', profileId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Counselor
          if (data.counselor && typeof data.counselor === 'object') {
            setCounselor(data.counselor as CounselorData);
          }

          // Teachers
          if (Array.isArray(data.teachers)) {
            setTeachers(data.teachers as TeacherData[]);
          }

          // Community support
          setHasCommunitySupport(data.has_community_support ?? false);
          if (Array.isArray(data.community_organizations)) {
            setCommunityOrgs(data.community_organizations as CommunityOrgData[]);
          }

          // Portfolio items
          setHasPortfolioItems(data.has_portfolio_items ?? false);
          if (Array.isArray(data.portfolio_items)) {
            setPortfolioItems(data.portfolio_items as PortfolioItemData[]);
          }

          // Documents
          setWantsToUploadDocuments(data.wants_to_upload_documents ?? false);
        }
      } catch (err) {
        console.error('[SupportSection] Error loading data:', err);
        toast({
          title: 'Error',
          description: 'Failed to load support network data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [profileId, toast]);

  // Handlers
  const addTeacher = () => {
    setTeachers([...teachers, { name: '', subject: '', relationship: '' }]);
  };

  const removeTeacher = (index: number) => {
    setTeachers(teachers.filter((_, i) => i !== index));
  };

  const updateTeacher = (index: number, field: keyof TeacherData, value: string) => {
    const updated = [...teachers];
    updated[index] = { ...updated[index], [field]: value };
    setTeachers(updated);
  };

  const addCommunityOrg = () => {
    setCommunityOrgs([...communityOrgs, { name: '', role: '', how_they_help: '' }]);
  };

  const removeCommunityOrg = (index: number) => {
    setCommunityOrgs(communityOrgs.filter((_, i) => i !== index));
  };

  const updateCommunityOrg = (index: number, field: keyof CommunityOrgData, value: string) => {
    const updated = [...communityOrgs];
    updated[index] = { ...updated[index], [field]: value };
    setCommunityOrgs(updated);
  };

  const addPortfolioItem = () => {
    setPortfolioItems([...portfolioItems, { title: '', description: '', url: '' }]);
  };

  const removePortfolioItem = (index: number) => {
    setPortfolioItems(portfolioItems.filter((_, i) => i !== index));
  };

  const updatePortfolioItem = (index: number, field: keyof PortfolioItemData, value: string) => {
    const updated = [...portfolioItems];
    updated[index] = { ...updated[index], [field]: value };
    setPortfolioItems(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const supportData: SupportNetworkData = {
        counselor,
        teachers,
        has_community_support: hasCommunitySupport,
        community_organizations: hasCommunitySupport ? communityOrgs : [],
        has_portfolio_items: hasPortfolioItems,
        portfolio_items: hasPortfolioItems ? portfolioItems : [],
        wants_to_upload_documents: wantsToUploadDocuments,
        documents: [] // Placeholder for now per spec
      };

      const { error } = await supabase
        .from('support_network')
        .upsert({
          profile_id: profileId,
          ...supportData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'profile_id'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Support network saved successfully'
      });

      onSaveComplete();
    } catch (err) {
      console.error('[SupportSection] Error saving:', err);
      toast({
        title: 'Error',
        description: 'Failed to save support network',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Who's in your corner? These are people who can write recommendations, connect you to opportunities, or vouch for your character.
      </div>

      {/* Counselor */}
      <Card className="p-4 space-y-4">
        <h3 className="font-medium">School Counselor</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="counselor-name">Name</Label>
            <Input
              id="counselor-name"
              value={counselor.name}
              onChange={(e) => setCounselor({ ...counselor, name: e.target.value })}
              placeholder="e.g., Ms. Johnson"
            />
          </div>
          <div>
            <Label htmlFor="counselor-email">Email</Label>
            <Input
              id="counselor-email"
              type="email"
              value={counselor.email}
              onChange={(e) => setCounselor({ ...counselor, email: e.target.value })}
              placeholder="counselor@school.edu"
            />
          </div>
          <div>
            <Label htmlFor="counselor-relationship">Relationship Quality</Label>
            <Textarea
              id="counselor-relationship"
              value={counselor.relationship_quality}
              onChange={(e) => setCounselor({ ...counselor, relationship_quality: e.target.value })}
              placeholder="How well do they know you? What have you worked on together?"
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* Teachers */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Teachers Who Know You Well</h3>
          <Button type="button" variant="outline" size="sm" onClick={addTeacher}>
            <Plus className="h-4 w-4 mr-1" />
            Add Teacher
          </Button>
        </div>

        {teachers.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No teachers added yet. Click "Add Teacher" to start.
          </div>
        ) : (
          <div className="space-y-4">
            {teachers.map((teacher, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="text-sm font-medium">Teacher {index + 1}</div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTeacher(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Input
                    value={teacher.name}
                    onChange={(e) => updateTeacher(index, 'name', e.target.value)}
                    placeholder="Teacher name"
                  />
                  <Input
                    value={teacher.subject}
                    onChange={(e) => updateTeacher(index, 'subject', e.target.value)}
                    placeholder="Subject (e.g., AP Biology)"
                  />
                  <Textarea
                    value={teacher.relationship}
                    onChange={(e) => updateTeacher(index, 'relationship', e.target.value)}
                    placeholder="Describe your relationship"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Community Support */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Community Support</h3>
          <Switch
            checked={hasCommunitySupport}
            onCheckedChange={setHasCommunitySupport}
          />
        </div>

        {hasCommunitySupport && (
          <>
            <div className="flex items-center justify-between">
              <Label>Community Organizations</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCommunityOrg}>
                <Plus className="h-4 w-4 mr-1" />
                Add Organization
              </Button>
            </div>

            {communityOrgs.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No organizations added yet.
              </div>
            ) : (
              <div className="space-y-4">
                {communityOrgs.map((org, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="text-sm font-medium">Organization {index + 1}</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCommunityOrg(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Input
                        value={org.name}
                        onChange={(e) => updateCommunityOrg(index, 'name', e.target.value)}
                        placeholder="Organization name"
                      />
                      <Input
                        value={org.role}
                        onChange={(e) => updateCommunityOrg(index, 'role', e.target.value)}
                        placeholder="Your role"
                      />
                      <Textarea
                        value={org.how_they_help}
                        onChange={(e) => updateCommunityOrg(index, 'how_they_help', e.target.value)}
                        placeholder="How they support you"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Portfolio Items */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Portfolio & Documents</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Do you have portfolio items to showcase?</Label>
            <Switch
              checked={hasPortfolioItems}
              onCheckedChange={setHasPortfolioItems}
            />
          </div>

          {hasPortfolioItems && (
            <>
              <div className="flex items-center justify-between">
                <Label>Portfolio Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPortfolioItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {portfolioItems.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No portfolio items added yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {portfolioItems.map((item, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="text-sm font-medium">Item {index + 1}</div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePortfolioItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Input
                          value={item.title}
                          onChange={(e) => updatePortfolioItem(index, 'title', e.target.value)}
                          placeholder="Title"
                        />
                        <Textarea
                          value={item.description}
                          onChange={(e) => updatePortfolioItem(index, 'description', e.target.value)}
                          placeholder="Description"
                          rows={2}
                        />
                        <Input
                          value={item.url || ''}
                          onChange={(e) => updatePortfolioItem(index, 'url', e.target.value)}
                          placeholder="URL (optional)"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Want to upload documents?</Label>
              <div className="text-xs text-muted-foreground mt-1">
                (Upload functionality coming soon)
              </div>
            </div>
            <Switch
              checked={wantsToUploadDocuments}
              onCheckedChange={setWantsToUploadDocuments}
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save & Close'
          )}
        </Button>
      </div>
    </div>
  );
}
