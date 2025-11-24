
import { WorkshopAccordion } from "@/components/workshop/WorkshopAccordion";
import { WorkshopItem } from "@/services/narrativeWorkshop/types";

// Sample Data from PHASE_8_TEST_OUTPUT.json
const SAMPLE_ITEMS: WorkshopItem[] = [
  {
    "id": "8b37c573-e027-42b8-8766-887a5eb78c79",
    "rubric_category": "opening_power_scene_entry",
    "severity": "critical",
    "quote": "In \"Classic Views on Entrepreneurship,\" an article of De Economist, Joseph Schumpeter suggested that entrepreneurs were responsible for innovations in search of profit. Meanwhile, Frank Knight presented them as the bearers of uncertainty responsible for risk premiums in financial markets, and Israel Kirszner thought of entrepreneurship as a process that leads to the discovery.",
    "problem": "This section scored 2/10 in opening_power_scene_entry.",
    "why_it_matters": "Opens with academic citations and theoretical definitions - classic warning sign of abstract opening. No concrete moment, scene, or compelling hook. Pure exposition about economic theory.",
    "suggestions": [
      {
        "text": "When I founded Polytechnic High School's Young Entrepreneur Society, I discovered that three economists had already mapped the territory I was about to explore.",
        "rationale": "This keeps the student's academic foundation but transforms the opening from dry citation into a personal discovery moment. It maintains their intellectual curiosity while creating forward momentum that draws readers into their entrepreneurial journey. The reference to 'mapping territory' connects theory to their actual experience of exploration.",
        "type": "polished_original"
      },
      {
        "text": "What defines an entrepreneur? As I prepared to launch Polytechnic High School's Young Entrepreneur Society, three economic theorists offered competing answers—profit-seekers, risk-bearers, or discoverers of opportunity.",
        "rationale": "This amplifies the student's signature rhetorical question opening while maintaining their academic voice. It preserves their pattern of theoretical framing but makes it more engaging by positioning the theories as competing perspectives they're actively wrestling with. The dash structure reflects their systematic analytical approach.",
        "type": "voice_amplifier"
      },
      {
        "text": "Why do we assume entrepreneurship begins with a business plan? When I founded our Young Entrepreneur Society, I started with a different question entirely.",
        "rationale": "Using the Rhetorical Pivot strategy, this challenges the common assumption that entrepreneurship is about business mechanics. It creates intrigue about what question the student actually started with, immediately positioning them as someone who thinks differently about entrepreneurship. This hooks readers while staying true to their reflective, question-driven voice.",
        "type": "divergent_strategy"
      }
    ]
  },
  {
    "id": "5cb55a3d-49e4-4bc6-a601-d0ef44aaa020",
    "rubric_category": "narrative_arc_stakes_turn",
    "severity": "critical",
    "quote": "What were the \"risks\" I was undertaking? We invested our time and labor, often being uncertain whether our innovations or products aligned with the market's interest.",
    "problem": "This section scored 3/10 in narrative_arc_stakes_turn.",
    "why_it_matters": "Mentions uncertainty and risk but stakes feel abstract and low-tension. The 'discovery' of being a specialist is more of a realization than a dramatic turn. No clear obstacle or meaningful consequence shown.",
    "suggestions": [
      {
        "text": "What were the \"risks\" I was undertaking? We invested countless hours into untested ideas, never knowing if our products would find an audience or fall flat. The stakes weren't just our time—they were our credibility as leaders and the trust our members placed in us.",
        "rationale": "This keeps the student's exact question format and risk concept while making the stakes more concrete and personal. The phrase 'fall flat' adds impact, and highlighting credibility/trust creates real consequences that feel meaningful rather than abstract.",
        "type": "polished_original"
      },
      {
        "text": "What were the \"risks\" I was undertaking? We invested our time and labor—our most precious resources as students—often being uncertain whether our innovations aligned with market demands. Yet this uncertainty became our greatest teacher, forcing us to develop what Knight called \"true entrepreneurial judgment.\"",
        "rationale": "This amplifies the student's academic voice by adding a theoretical reference (Knight's entrepreneurial judgment) and uses their signature hyphen technique to define resources. The parallel structure and quotation marks around 'risks' match their established voice markers perfectly.",
        "type": "voice_amplifier"
      },
      {
        "text": "What if risk isn't about what you might lose, but what you're brave enough to discover? We invested our time and labor into uncharted territory, uncertain whether our innovations would resonate. But perhaps that uncertainty was the point—the very catalyst that transformed us from students into entrepreneurs.",
        "rationale": "Uses the rhetorical pivot strategy by challenging the assumption that risk equals potential loss. This reframes the entire concept from negative stakes to positive discovery, creating narrative tension through transformation rather than failure. The question format maintains their voice while solving the low-stakes problem.",
        "type": "divergent_strategy"
      }
    ]
  },
  {
    "id": "bc57e893-ed71-4bac-85f7-1b65d05d0005",
    "rubric_category": "narrative_arc_stakes_turn",
    "severity": "critical",
    "quote": "However, I realized I was most fit to be a specialist-someone who deeply cares for the needs of customers",
    "problem": "This section scored 3/10 in narrative_arc_stakes_turn.",
    "why_it_matters": "Mentions uncertainty and risk but stakes feel abstract and low-tension. The 'discovery' of being a specialist is more of a realization than a dramatic turn. No clear obstacle or meaningful consequence shown.",
    "suggestions": [
      {
        "text": "However, I discovered I was most suited to be a specialist—someone who prioritizes customer needs above all—ensuring our members gained the confidence to transform their passions into tangible ventures.",
        "rationale": "This polished version maintains the student's core concept of being a 'specialist' while strengthening the language. 'Discovered' feels more active than 'realized,' and 'prioritizes customer needs above all' creates clearer stakes than the original vague phrasing. The parallel structure with the dash maintains their voice while making the impact more concrete.",
        "type": "polished_original"
      },
      {
        "text": "But what was my true entrepreneurial identity? Through systematic observation of my leadership approach, I recognized myself as a specialist—one who places 'customer-centricity' at the core of every decision—dedicated to ensuring our members developed the analytical framework to transform abstract passions into concrete business applications.",
        "rationale": "This amplifies the student's signature voice markers: opens with their characteristic rhetorical question format, uses academic terminology ('systematic observation,' 'analytical framework'), employs their hyphen-definition style, and puts theoretical terms in quotes. The methodical tone and structured analysis perfectly match their intellectual curiosity while raising the stakes through the framework concept.",
        "type": "voice_amplifier"
      },
      {
        "text": "I thought I was simply helping members brainstorm business ideas, but I was actually building something more fundamental—a systematic approach to understanding customer pain points that I didn't even recognize as entrepreneurship until months later.",
        "rationale": "Using the Retroactive Realization strategy, this creates dramatic tension by revealing the gap between past actions and current understanding. The stakes are elevated because the student was unknowingly developing crucial entrepreneurial skills while thinking they were doing something simpler. This transforms a flat realization into a compelling discovery narrative with real consequences and growth.",
        "type": "divergent_strategy"
      }
    ]
  },
  {
    "id": "eb86b213-f367-4e25-a7e5-b3c458507777",
    "rubric_category": "character_interiority_vulnerability",
    "severity": "critical",
    "quote": "often being uncertain whether our innovations or products aligned with the market's interest",
    "problem": "This section scored 1.5/10 in character_interiority_vulnerability.",
    "why_it_matters": "Very limited vulnerability - only mentions uncertainty briefly. No sustained introspection, no admission of real doubt or error. The tone remains confident and analytical throughout without showing emotional process.",
    "suggestions": [
      {
        "text": "We invested our time and labor, constantly questioning whether our innovations truly resonated with market demands or simply reflected our own assumptions.",
        "rationale": "This polished version maintains the student's analytical tone while deepening the vulnerability. It replaces 'often being uncertain' with 'constantly questioning,' which shows more sustained doubt, and adds the contrast between market reality and personal assumptions - revealing the specific nature of their uncertainty without changing the core concept.",
        "type": "polished_original"
      },
      {
        "text": "What was the true \"risk\" we faced? We invested our time and labor, perpetually wrestling with the question: were our innovations addressing genuine market needs, or were we simply projecting our own entrepreneurial enthusiasm onto indifferent consumers?",
        "rationale": "This amplifies the student's voice markers perfectly - opens with their signature rhetorical question format, uses quotation marks around theoretical terms, and employs their methodical question-answer rhythm. The parallel structure ('genuine market needs' vs 'projecting our own enthusiasm') shows deeper vulnerability while maintaining their academic precision.",
        "type": "voice_amplifier"
      },
      {
        "text": "We invested our time and labor, but I kept catching myself thinking: 'Are we solving problems that actually exist, or just problems we think should exist?'",
        "rationale": "Using internal monologue strategy, this reveals the specific doubt running through the student's mind. The direct thought 'Are we solving problems that actually exist, or just problems we think should exist?' shows genuine vulnerability and self-questioning. This moves beyond analytical uncertainty to expose the real fear every entrepreneur faces - the gap between vision and reality.",
        "type": "divergent_strategy"
      }
    ]
  },
  {
    "id": "fc713b1a-396c-4404-90c0-597673ed7702",
    "rubric_category": "show_dont_tell_craft",
    "severity": "critical",
    "quote": "My peers were tremendous motivators, not just to me",
    "problem": "This section scored 1/10 in show_dont_tell_craft.",
    "why_it_matters": "Pure exposition and summary. No dialogue, no concrete scenes, no sensory details. All abstract language about concepts like 'diversity of ideas' and 'invaluable branding skills' without showing these in action.",
    "suggestions": [
      {
        "text": "My peers brought diverse perspectives that energized our discussions and challenged my assumptions about what entrepreneurship could look like.",
        "rationale": "This polished version maintains the student's focus on peer motivation while adding concrete details about 'diverse perspectives' and 'challenged assumptions.' It flows naturally from the rhetorical question about profit and connects to the club structure mentioned next, staying true to their analytical voice.",
        "type": "polished_original"
      },
      {
        "text": "What did my peers offer beyond simple encouragement? They brought the theoretical 'human capital'—diverse skill sets, fresh perspectives, and entrepreneurial energy that transformed our club meetings into dynamic workshops.",
        "rationale": "This amplifies the student's voice markers perfectly: starts with a rhetorical question, uses academic terminology in quotes ('human capital'), employs hyphens to define concepts, and maintains their systematic analysis approach. It shows rather than tells by specifying what peers contributed while keeping the intellectual framework.",
        "type": "voice_amplifier"
      },
      {
        "text": "I expected to motivate my peers, but they ended up energizing me—Sarah's marketing insights, David's coding skills, and Maria's financial modeling expertise created the collaborative foundation I hadn't planned for.",
        "rationale": "Using the Contrast Frame strategy, this creates immediate tension between expectation (motivating others) and reality (being motivated). It shows specific peer contributions through concrete examples rather than abstract concepts, transforming the telling into vivid demonstration while maintaining the entrepreneurial context.",
        "type": "divergent_strategy"
      }
    ]
  }
];

export default function WorkshopDemo() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Narrative Workshop Demo</h1>
          <p className="text-muted-foreground">
            Reviewing surgical edits for the "2+1" Strategy (Polished, Voice, Divergent).
          </p>
        </div>
        
        <WorkshopAccordion items={SAMPLE_ITEMS} />
      </div>
    </div>
  );
}


