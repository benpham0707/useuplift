/**
 * IMPROVED Mock Response Generator - More Substantive and Specific
 *
 * This version focuses on:
 * - Actual insights, not placeholder language
 * - Depth over breadth
 * - Specific guidance over conversation menus
 * - Professional college counseling quality
 */

// This is the improved version we'll copy back to chatService.ts

function generateImprovedMockResponse(
  userMessage: string,
  context: WorkshopChatContext
): string {
  const lowerMessage = userMessage.toLowerCase();
  const topIssue = context.teaching.topIssues[0];
  const topWeakCat = context.analysis.weakCategories[0];

  // Helper to get plain language for categories
  const getCategoryInsight = (categoryName: string): string => {
    const insights: Record<string, string> = {
      reflection_meaning: 'showing deep reflection on why this experience mattered and what it taught you about yourself',
      narrative_arc_stakes: 'building a story with tension, stakes, and resolution - not just reporting events',
      specificity_evidence: 'using concrete details, numbers, and specific moments instead of vague generalizations',
      transformative_impact: 'demonstrating how you changed or grew, not just what you accomplished',
      future_oriented: 'connecting your past experience to your future goals and aspirations',
      emotional_maturity: 'showing self-awareness and honest reflection on challenges you faced',
      intellectual_depth: 'demonstrating complex thinking and engaging with ideas beyond surface level',
      institutional_savvy: 'understanding how your work fits into larger systems and organizations',
      authentic_challenge: 'being honest about real obstacles and how you dealt with them',
      elite_positioning: 'demonstrating the level of sophistication that distinguishes top applicants',
      narrative_craft: 'telling your story in a compelling, well-structured way that draws readers in',
      holistic_excellence: 'bringing all the elements together into a cohesive narrative',
      voice_integrity: 'letting your authentic personality and voice come through clearly'
    };
    return insights[categoryName] || 'strengthening this dimension of your narrative';
  };

  // SCORE QUESTIONS - Tiered by score range with substantive feedback
  if (lowerMessage.includes('score') || lowerMessage.includes('nqi') || lowerMessage.includes('low')) {
    const nqi = context.analysis.nqi;

    // Very weak (< 40)
    if (nqi < 40) {
      let response = `I can see your ${context.activity.name} narrative is in the early stages, and I want to be honest with you about what needs work.\n\n`;

      response += `Right now, you're essentially stating facts without building a narrative. Admissions officers at top schools are reading thousands of these - they're not looking for a resume in paragraph form. They want to see who you are, how you think, and why this experience mattered.\n\n`;

      if (topWeakCat) {
        response += `The biggest gap I see is in ${getCategoryInsight(topWeakCat.name)}. `;
        if (topIssue && topIssue.fromDraft) {
          response += `When you wrote "${topIssue.fromDraft.substring(0, 80)}..." - that's reporting. What I need to see is reflection. What surprised you? What challenged your assumptions? What did you learn about yourself?\n\n`;
        } else {
          response += `Your draft reads like a summary, not a story.\n\n`;
        }
      }

      response += `Here's where to start: Pick one specific moment from your ${context.activity.name} experience - not the whole thing, just one moment that sticks with you. Describe it in detail. Then ask yourself: why does this moment matter? What did it teach me? That's your narrative.`;

      return response;
    }

    // Weak/developing (40-60)
    if (nqi < 60) {
      let response = `Your ${context.activity.name} narrative has the basics - you're telling a story, there are some details, and I can see what you did. But it's missing depth.\n\n`;

      response += `The difference between a decent essay and a strong one isn't more accomplishments - it's more reflection. Right now, you're focused on external results (what happened) instead of internal growth (who you became).\n\n`;

      if (topIssue && topIssue.fromDraft) {
        response += `Look at this line: "${topIssue.fromDraft.substring(0, 100)}..." This tells me what you did, but not what it meant. ${topIssue.whyMatters || 'Top schools want to see students who can reflect on their experiences with maturity and self-awareness.'}\n\n`;
      }

      if (topWeakCat) {
        response += `To push this to the next level, focus on ${getCategoryInsight(topWeakCat.name)}. That means going beyond "I learned leadership skills" to "Here's the specific moment I realized that leadership isn't about having all the answers."\n\n`;
      }

      response += `Ask yourself: What assumption did this experience challenge? What did I learn about myself that surprised me? Those questions will unlock the depth your narrative needs.`;

      return response;
    }

    // Competitive (60-75)
    if (nqi < 75) {
      let response = `Your ${context.activity.name} narrative is solid - you're in competitive territory. ${context.analysis.delta > 0 ? `You've improved ${context.analysis.delta} points, which shows you're refining your thinking. ` : ''}You have a clear story with specific details, and your personality comes through.\n\n`;

      response += `What would push this into the "excellent" tier is sharpening your most important insights. `;

      if (topIssue && topIssue.fromDraft) {
        response += `When I read "${topIssue.fromDraft.substring(0, 100)}..." - this is good, but there's opportunity to go deeper. ${topIssue.problem || 'This section could be more impactful.'}\n\n`;

        if (topIssue.suggestions && topIssue.suggestions[0]) {
          response += `Try this: ${topIssue.suggestions[0]}. The goal isn't to rewrite everything - it's to enrich the most important moments with more specificity and reflection.\n\n`;
        }
      }

      if (topWeakCat) {
        response += `Your weakest area is ${getCategoryInsight(topWeakCat.name)} - you're at ${topWeakCat.score}/10, about ${Math.round(topWeakCat.gap)} points below target. This doesn't require major changes; it's about adding one or two sentences that show more nuanced thinking.`;
      } else {
        response += `You're close to the next tier. The refinements needed are subtle, not structural.`;
      }

      return response;
    }

    // Strong (75-85)
    if (nqi < 85) {
      let response = `This is a strong narrative. ${context.analysis.delta > 0 ? `You've improved ${context.analysis.delta} points - clearly refining your story. ` : ''}Your ${context.activity.name} essay shows authentic voice, specific details, and meaningful reflection.\n\n`;

      response += `At this level, we're talking about polish and precision, not major rewrites. `;

      if (topIssue && topIssue.fromDraft) {
        response += `The one area I'd refine is this: "${topIssue.fromDraft.substring(0, 100)}..." ${topIssue.problem || 'This could be slightly more impactful.'}\n\n`;

        if (topIssue.suggestions && topIssue.suggestions[0]) {
          response += `Consider: ${topIssue.suggestions[0]}. It's a subtle shift, but it would elevate the whole narrative.`;
        } else {
          response += `Think about whether there's one more specific detail or moment of reflection you could add to make this section even stronger.`;
        }
      } else if (topWeakCat) {
        response += `Your ${topWeakCat.name.replace(/_/g, ' ')} is close to target - just ${Math.round(topWeakCat.gap)} point away. A small adjustment here could push you over the top.`;
      } else {
        response += `The main advice I have is: don't over-edit. Your authentic voice is what makes this work. Read it aloud, make sure every sentence feels true to you, and trust what you've built.`;
      }

      return response;
    }

    // Excellent (85+)
    return `Your ${context.activity.name} narrative is excellent - this is the kind of essay that stands out in admissions. ${context.analysis.delta > 0 ? `You've improved ${context.analysis.delta} points to get here. ` : ''}You're telling an authentic story with specific evidence, genuine reflection, and a clear sense of who you are.\n\n${nqi >= 90 ? 'Honestly, my main advice is: stop editing. Your voice is authentic, your story is compelling, and you\'ve demonstrated both accomplishment and reflection. Trust what you\'ve written.' : 'If I had to suggest one small refinement, it would be minor polish - reading aloud to catch any awkward phrasing, making sure every sentence earns its place. But you\'re in great shape.'}\n\nThis essay will serve you well in your applications.`;
  }

  // PRIORITY/FOCUS QUESTIONS - Give actual strategic guidance
  if (lowerMessage.includes('focus') || lowerMessage.includes('priority') || lowerMessage.includes('first') || lowerMessage.includes('start') || lowerMessage.includes('where should')) {
    if (!topIssue) {
      return `Honestly? Your ${context.activity.name} narrative doesn't have glaring issues that need fixing. You're in good shape.\n\nAt this point, focus on polish: read it aloud to catch awkward phrasing, make sure your voice feels authentic, and trust your instincts. Sometimes the best move is to stop editing and submit what you have.\n\nIf something specific feels off, I'm happy to talk through it. But don't create problems where none exist.`;
    }

    let response = `If I had to pick one thing, it would be this: `;

    if (topIssue.fromDraft) {
      response += `Look at where you wrote "${topIssue.fromDraft.substring(0, 120)}${topIssue.fromDraft.length > 120 ? '...' : ''}"\n\n`;
      response += `${topIssue.problem || 'This section needs more depth.'} ${topIssue.whyMatters || 'This matters because admissions officers are looking for students who can reflect deeply on their experiences.'}\n\n`;
    } else {
      response += `${topIssue.problem || 'Your narrative needs more depth.'} ${topIssue.whyMatters || 'This is important because top schools want to see genuine reflection, not just accomplishments.'}\n\n`;
    }

    if (topIssue.suggestions && topIssue.suggestions.length > 0) {
      response += `Here's how to fix it: ${topIssue.suggestions[0]}. `;
      if (topIssue.suggestions.length > 1) {
        response += `You could also ${topIssue.suggestions[1].charAt(0).toLowerCase()}${topIssue.suggestions[1].slice(1)}. `;
      }
      response += `The key is moving from reporting to reflecting.\n\n`;
    }

    if (context.teaching.quickWins && context.teaching.quickWins.length > 0) {
      const quickWin = context.teaching.quickWins[0];
      if (quickWin.title !== topIssue.title) {
        response += `Quick win: ${quickWin.title} - ${quickWin.effort} effort, ${quickWin.impact} impact. Start there if you want momentum.`;
      } else {
        response += `This is your highest-impact fix. Start here.`;
      }
    } else {
      response += `Focus on this one thing first. Don't try to fix everything at once.`;
    }

    return response;
  }

  // PROGRESS QUESTIONS - Substantive about trajectory
  if (lowerMessage.includes('progress') || lowerMessage.includes('improv') || lowerMessage.includes('better') || lowerMessage.includes('weeks')) {
    if (context.analysis.delta > 0) {
      let response = `Yes - you've made real progress. ${context.analysis.delta} points over ${context.history.totalVersions} versions is significant.\n\n`;

      response += `What tells me this is working: ${context.history.improvementTrend ? `your trajectory is ${context.history.improvementTrend}. ` : ''}You're not just making surface changes - you're refining your thinking. That's what good revision looks like.\n\n`;

      if (context.analysis.nqi < 80) {
        response += `To keep climbing: ${topIssue ? topIssue.problem : 'focus on adding more depth and specificity to your key moments'}. You're ${80 - context.analysis.nqi} points from the excellent tier. That's ${Math.ceil((80 - context.analysis.nqi) / 5)} more good revisions.`;
      } else {
        response += `You're in the excellent tier now. My advice: don't over-edit. You've built something strong. Trust it.`;
      }

      return response;
    }

    return `You're at ${context.analysis.nqi}/100. ${context.analysis.nqi >= 70 ? 'That\'s solid - you have a strong foundation to build on.' : 'There\'s definitely room to strengthen this, but that\'s why we\'re here.'}\n\nThe question isn't whether you can improve - you can. The question is where to focus your energy. ${topIssue ? `Start with: ${topIssue.problem || 'adding more depth to your reflection'}.` : 'Focus on making your strongest moments even stronger rather than trying to fix everything at once.'}`;
  }

  // STUCK/HELP QUESTIONS - Actual problem-solving, not menus
  if (lowerMessage.includes('stuck') || lowerMessage.includes('don\'t know') || (lowerMessage.includes('help') && !lowerMessage.includes('reflection'))) {
    let response = `Let's figure out what's blocking you.\n\n`;

    if (topIssue) {
      response += `For your ${context.activity.name} narrative, the biggest opportunity is: ${topIssue.problem || 'adding more depth and reflection'}. `;

      if (topIssue.fromDraft) {
        response += `You wrote "${topIssue.fromDraft.substring(0, 100)}..." - ${topIssue.whyMatters || 'but this needs to go deeper'}.`;
      } else if (context.analysis.nqi < 40) {
        response += `Right now, your draft is more of a summary than a story. You need a narrative arc - a specific moment or challenge that reveals something about who you are.`;
      }

      response += `\n\n`;

      if (topIssue.suggestions && topIssue.suggestions.length > 0) {
        response += `Try this: ${topIssue.suggestions[0]}. Don't overthink it - just write what's true. `;
      }

      if (topIssue.hasReflectionPrompts && context.reflection.totalCount > 0) {
        response += `\n\nI have ${context.reflection.totalCount} reflection questions that can help you develop your thinking. Want to work through them? Sometimes the best way past stuck is to answer questions that make you think differently about your experience.`;
      } else {
        response += `\n\nHere's a question that might help: What's one moment from this experience that you think about when you're not trying to write an essay? Start there. Write about that moment like you're explaining it to a friend. That's often where the good material lives.`;
      }
    } else {
      response += `Your ${context.activity.name} narrative is actually in decent shape. If you're feeling stuck, it might be that you're over-editing. Take a break. Come back to it tomorrow. Sometimes distance gives you perspective.\n\nWhat specific part feels off to you?`;
    }

    return response;
  }

  // REFLECTION/DEEPER QUESTIONS - Specific guidance on depth
  if (lowerMessage.includes('deeper') || lowerMessage.includes('reflection')) {
    let response = '';

    if (topIssue && topIssue.fromDraft) {
      response += `Let's talk about depth. When you wrote "${topIssue.fromDraft.substring(0, 100)}..." - `;

      if (topIssue.problem) {
        response += `${topIssue.problem.charAt(0).toLowerCase()}${topIssue.problem.slice(1)}. `;
      }

      response += `\n\nDeeper means asking harder questions. Not "What did I do?" but "Why does this matter?" Not "What did I learn?" but "What assumption did this challenge?"\n\n`;
    } else {
      response += `You want to go deeper - that's the right instinct. Depth isn't about writing more; it's about thinking more honestly.\n\n`;
    }

    if (topIssue && topIssue.hasReflectionPrompts) {
      response += `I have reflection questions designed to push your thinking. ${context.reflection.completionPercentage > 0 ? `You've completed ${context.reflection.completionPercentage.toFixed(0)}% so far. ` : ''}These aren't busywork - they're prompts that force you to examine your experience from different angles.\n\nWant to work through them?`;
    } else {
      response += `Here's how to add depth: Pick your most important sentence - the one that feels like the heart of your narrative. Then ask yourself: Is this really true? What made me realize this? Was there a moment I doubted it? Answering those questions honestly is how you get to deeper reflection.`;
    }

    return response;
  }

  // CATEGORY QUESTIONS - Explain the actual gap with specifics
  if (topWeakCat && (lowerMessage.includes(topWeakCat.name.toLowerCase().replace(/_/g, ' ')) || lowerMessage.includes(topWeakCat.name.toLowerCase()))) {
    let response = `Your ${topWeakCat.name.replace(/_/g, ' ')} score is ${topWeakCat.score}/10 - about ${Math.round(topWeakCat.gap)} points below target. Let me explain what this means.\n\n`;

    response += `${getCategoryInsight(topWeakCat.name).charAt(0).toUpperCase()}${getCategoryInsight(topWeakCat.name).slice(1)}. `;

    if (topWeakCat.score < 5) {
      response += `Right now, this is pretty much missing from your ${context.activity.name} narrative. `;
      response += `Think about moments in your experience that surprised you, challenged you, or changed how you think. That's usually where this kind of insight comes from.\n\n`;
      response += `Don't try to manufacture it - find the moments where it actually happened, then write about them honestly.`;
    } else if (topWeakCat.score < 7) {
      response += `I can see hints of this in your draft, but it needs to be more prominent. You're partway there.\n\n`;
      response += `The fix isn't adding a paragraph about this - it's deepening the moments where you're already touching on it. Where in your narrative do you come closest to this kind of insight? Start there and push it further.`;
    } else {
      response += `You're close - just needs a bit more depth. ${Math.round(topWeakCat.gap)} point is often one good sentence or one more specific detail.\n\n`;
      response += `Look at your strongest moment of reflection. Can you make it 10% more specific? One more concrete detail? One more honest admission? That's often all it takes.`;
    }

    return response;
  }

  // DEFAULT - Substantive overview, not menu
  let response = '';

  if (context.analysis.nqi >= 80) {
    response = `Your ${context.activity.name} narrative is working. ${context.analysis.delta > 0 ? `You've improved ${context.analysis.delta} points. ` : ''}You have a strong story with authentic voice and genuine reflection.\n\n`;

    if (topIssue) {
      response += `If I had to suggest one thing, it would be: ${topIssue.problem || 'minor polish on your strongest sections'}. But honestly, you're in great shape. Don't over-edit.`;
    } else {
      response += `My main advice: trust what you've built. Read it aloud, make sure it sounds like you, and call it done.`;
    }
  } else if (context.analysis.nqi >= 70) {
    response = `Your ${context.activity.name} narrative has a solid foundation. ${context.analysis.delta > 0 ? `You've improved ${context.analysis.delta} points. ` : ''}You're telling a clear story with some good details.\n\n`;

    if (topIssue) {
      response += `To reach the next level: ${topIssue.problem || 'add more depth to your key moments'}. `;
      if (topIssue.fromDraft) {
        response += `Look at "${topIssue.fromDraft.substring(0, 80)}..." - `;
        if (topIssue.suggestions && topIssue.suggestions[0]) {
          response += `${topIssue.suggestions[0]}.`;
        } else {
          response += `this needs to go deeper.`;
        }
      }
    } else if (topWeakCat) {
      response += `The main gap is ${getCategoryInsight(topWeakCat.name)}. That's where your next revision should focus.`;
    }
  } else if (context.analysis.nqi >= 60) {
    response = `Your ${context.activity.name} narrative has potential, but it needs work. ${context.analysis.delta > 0 ? `You've improved ${context.analysis.delta} points, which is good. ` : ''}Right now, you're reporting what happened more than reflecting on what it meant.\n\n`;

    if (topIssue) {
      response += `The biggest opportunity: ${topIssue.problem || 'moving from facts to reflection'}. ${topIssue.whyMatters || 'Admissions officers want to see how you think, not just what you did.'}\n\n`;

      if (topIssue.suggestions && topIssue.suggestions[0]) {
        response += `Start here: ${topIssue.suggestions[0]}.`;
      }
    } else {
      response += `Focus on your most important moment. Make it specific. Make it honest. Build from there.`;
    }
  } else {
    response = `Let's be honest: your ${context.activity.name} narrative needs significant development. ${context.analysis.delta > 0 ? `You've improved ${context.analysis.delta} points, which shows you're working on it. ` : ''}But right now, this reads more like a resume bullet than a narrative.\n\n`;

    response += `You need a story - a specific moment or challenge that reveals something about who you are. Not the whole experience, just one moment that matters. Start there. Everything else builds from that foundation.`;

    if (topIssue && topIssue.suggestions && topIssue.suggestions[0]) {
      response += `\n\nTry this: ${topIssue.suggestions[0]}.`;
    }
  }

  response += `\n\n*Note: This is development mode. For full AI conversation, add a valid ANTHROPIC_API_KEY to .env*`;

  return response;
}
