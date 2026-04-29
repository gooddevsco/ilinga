export const questionSeeds = [
  // Cluster: Problem
  {
    code: 'P1.1',
    cluster: 'Problem',
    label: 'Who has this problem most acutely?',
    helpText: 'Identify the segment that suffers the worst version of the pain.',
    inputType: 'text',
    sequence: 100,
  },
  {
    code: 'P1.2',
    cluster: 'Problem',
    label: 'What do they currently do about it?',
    inputType: 'text',
    sequence: 110,
  },
  {
    code: 'P1.3',
    cluster: 'Problem',
    label: 'What does it cost them to leave it unsolved?',
    inputType: 'text',
    sequence: 120,
  },
  // Cluster: Solution
  {
    code: 'S1.1',
    cluster: 'Solution',
    label: 'What is your wedge — the smallest valuable thing you can ship?',
    inputType: 'text',
    sequence: 200,
  },
  {
    code: 'S1.2',
    cluster: 'Solution',
    label: 'Why does this work where others have failed?',
    inputType: 'text',
    sequence: 210,
  },
  {
    code: 'S1.3',
    cluster: 'Solution',
    label: 'What needs to be true for this to succeed?',
    inputType: 'text',
    sequence: 220,
  },
  // Cluster: Market
  {
    code: 'M1.1',
    cluster: 'Market',
    label: 'How big is the addressable market today, in dollars?',
    inputType: 'number',
    sequence: 300,
  },
  {
    code: 'M1.2',
    cluster: 'Market',
    label: 'What is the market growth rate?',
    inputType: 'text',
    sequence: 310,
  },
  // Cluster: GTM
  {
    code: 'G1.1',
    cluster: 'GTM',
    label: 'What is your first acquisition channel?',
    inputType: 'text',
    sequence: 400,
  },
  {
    code: 'G1.2',
    cluster: 'GTM',
    label: 'What is your projected CAC and payback?',
    inputType: 'text',
    sequence: 410,
  },
  // Cluster: Risk
  {
    code: 'R1.1',
    cluster: 'Risk',
    label: 'What is the single biggest risk that could kill the business?',
    inputType: 'text',
    sequence: 500,
  },
  {
    code: 'R1.2',
    cluster: 'Risk',
    label: 'How will you de-risk it in the next 90 days?',
    inputType: 'text',
    sequence: 510,
  },
] as const;
