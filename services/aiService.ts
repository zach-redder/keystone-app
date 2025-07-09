// AI Service for generating identity affirmation responses
// This is a mock implementation - replace with actual AI service integration

export const generateAffirmationResponse = async (userResponse, coreValues, questionType) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  const hasValues = coreValues.length > 0;
  const valuesText = hasValues 
    ? coreValues.map(cv => cv.description).join(', ')
    : 'your personal values and principles';

  const responses = {
    'daily-living': hasValues ? [
      `I appreciate your reflection on living out your values. Based on your core values (${valuesText}), it sounds like you're making conscious efforts to align your actions with what matters most to you. Remember that growth happens in small, consistent steps.`,
      `It's meaningful to see how you're actively integrating your values into your daily life. Your commitment to ${valuesText} shows through in your actions. Each conscious choice you make strengthens your character.`,
      `Your awareness of how you lived your values today is commendable. The fact that you're reflecting on ${valuesText} in your daily actions shows genuine commitment to personal growth.`,
    ] : [
      `I appreciate your reflection on how you lived authentically today. Even without explicitly defined core values, you're showing self-awareness about your actions and their alignment with your principles. This kind of reflection is the foundation of intentional living.`,
      `Your commitment to living authentically comes through in your reflection. While you may not have formal core values defined yet, your thoughtful approach to daily actions shows you're building the habits that matter.`,
      `The fact that you're taking time to reflect on your daily actions shows wisdom and intentionality. This practice of self-reflection is itself a valuable principle that will serve you well in defining your identity.`,
    ],
    'challenge': hasValues ? [
      `It's insightful that you recognize which values challenged you. This awareness is the first step toward growth. Your values of ${valuesText} are meant to guide you through difficult moments, not make life easy. Each challenge is an opportunity to strengthen your character.`,
      `Challenges often reveal our true character. Your reflection on how ${valuesText} were tested shows maturity and self-awareness. These difficult moments are where real growth happens.`,
      `I admire your honesty about the challenges you faced. Living by your values of ${valuesText} isn't always easy, but it's in these moments that you build resilience and authenticity.`,
    ] : [
      `It's insightful that you recognize what challenged you today. Even without explicitly defined values, you're showing self-awareness about what's difficult for you. This kind of honest reflection is the foundation of personal growth.`,
      `Challenges often reveal our true character. Your willingness to reflect on difficult moments shows maturity and self-awareness. These are the experiences that help us understand what truly matters to us.`,
      `I admire your honesty about the challenges you faced. Living authentically isn't always easy, but recognizing these moments of difficulty is the first step toward building resilience and understanding your principles.`,
    ],
    'future-self': hasValues ? [
      `Your future self would likely be proud of your commitment to self-reflection and growth. By actively working to align with your values of ${valuesText}, you're building the foundation for the person you want to become. Keep nurturing this intentional approach to living.`,
      `The fact that you're considering your future self's perspective shows wisdom beyond your years. Your dedication to ${valuesText} today is an investment in who you're becoming. Your future self will thank you for this intentional living.`,
      `Your future self would recognize the courage it takes to live authentically by your values. By consistently choosing to align with ${valuesText}, you're creating a life of integrity and purpose.`,
    ] : [
      `Your future self would likely be proud of your commitment to self-reflection and growth. By actively thinking about who you want to become, you're building the foundation for intentional living. This practice of reflection is itself a valuable principle.`,
      `The fact that you're considering your future self's perspective shows wisdom and intentionality. Your commitment to growth and self-awareness today is an investment in who you're becoming. Keep nurturing this thoughtful approach to life.`,
      `Your future self would recognize the courage it takes to live authentically and with purpose. By consistently choosing to reflect and grow, you're creating a life of integrity and meaning, even as you continue to discover what matters most to you.`,
    ],
  };

  // Determine response type based on question content
  let responseType = 'daily-living';
  if (userResponse.toLowerCase().includes('challenge') || userResponse.toLowerCase().includes('difficult')) {
    responseType = 'challenge';
  } else if (userResponse.toLowerCase().includes('future') || userResponse.toLowerCase().includes('become')) {
    responseType = 'future-self';
  }

  // Select a random response from the appropriate category
  const categoryResponses = responses[responseType];
  const randomIndex = Math.floor(Math.random() * categoryResponses.length);
  
  return categoryResponses[randomIndex];
};

// Additional helper function for more personalized responses
export const generatePersonalizedResponse = async (userResponse, coreValues, questionIndex) => {
  const questionTypes = ['daily-living', 'challenge', 'future-self'];
  const questionType = questionTypes[questionIndex] || 'daily-living';
  
  return await generateAffirmationResponse(userResponse, coreValues, questionType);
};
