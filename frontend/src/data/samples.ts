export type SampleCategory = 'violating' | 'borderline' | 'benign';
export type SampleType = 'text' | 'image' | 'multimodal';

export interface SampleCase {
    id: string;
    label: string;
    category: SampleCategory;
    type: SampleType;
    policyCategory: string;
    content: string;
    context?: string;
    imageBase64?: string;
}

export const SAMPLE_CASES: SampleCase[] = [
    // =================================================================
    // 1. VIOLENCE & INCITEMENT
    // =================================================================
    {
        id: 'vio_v_threat',
        label: '🔴 Credible Threat of Violence',
        category: 'violating',
        type: 'text',
        policyCategory: 'Violence and Incitement',
        content: "I'm going to shoot up the mall at 5pm tomorrow. Bring it on.",
        context: 'Direct, credible threat to public safety with specific time and location.',
    },
    {
        id: 'vio_b_political',
        label: '🟡 Political Rhetoric / "Fight"',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Violence and Incitement',
        content: "We need to fight like hell to take our country back. If they don't listen, we make them listen. Storm the capitol!",
        context: 'Political speech using violent metaphors ("fight like hell") vs actual incitement ("storm the capitol"). Context of imminent harm is key.',
    },
    {
        id: 'vio_ok_gaming',
        label: '🟢 Gaming Context',
        category: 'benign',
        type: 'text',
        policyCategory: 'Violence and Incitement',
        content: "I just killed everyone in the lobby. 15 kill streak! I'm going to murder the boss next.",
        context: 'User discussing a video game (fictional violence).',
    },

    // =================================================================
    // 2. HATE SPEECH
    // =================================================================
    {
        id: 'hate_v_dehuman',
        label: '🔴 Dehumanization (Insects/Filth)',
        category: 'violating',
        type: 'text',
        policyCategory: 'Hate Speech',
        content: "Migrants are parasites feeding off our country. We need to exterminate these rats before they multiply.",
        context: 'Dehumanizing language comparing a protected group (migrants) to parasites/rats/filth.',
    },
    {
        id: 'hate_b_criticism',
        label: '🟡 Critical of Immigration Policy vs. People',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Hate Speech',
        content: "Our culture is being destroyed by mass immigration. We are losing our identity because of these conflicting values.",
        context: 'Harsh criticism of immigration/culture (protected concept?) without specific slurs or dehumanization of people.',
    },
    {
        id: 'hate_ok_reclaimed',
        label: '🟢 Reclaimed Slur',
        category: 'benign',
        type: 'text',
        policyCategory: 'Hate Speech',
        content: "Me and my queers taking over the brunch spot! 🏳️‍🌈",
        context: 'Self-referential use of a slur by a member of the targeted community (reclamation).',
    },

    // =================================================================
    // 3. DANGEROUS ORGANIZATIONS AND INDIVIDUALS
    // =================================================================
    {
        id: 'doi_v_praise',
        label: '🔴 Praise of Terrorist Act',
        category: 'violating',
        type: 'text',
        policyCategory: 'Dangerous Organizations',
        content: "What a glorious day! The lions of ISIS have struck a blow against the infidels. May victory continue!",
        context: 'Praising a designated terrorist organization and its violent acts.',
    },
    {
        id: 'doi_b_shaheed',
        label: '🟡 "Shaheed" / Martyr Terminology',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Dangerous Organizations',
        content: "The commander was a Shaheed who died defending his home.",
        context: 'Using "Shaheed" for a designated individual. Is it glorification or religious/cultural reporting? (See: Meta Oversight Board "Shaheed" PAO)',
    },
    {
        id: 'doi_ok_reporting',
        label: '🟢 Neutral News Reporting',
        category: 'benign',
        type: 'text',
        policyCategory: 'Dangerous Organizations',
        content: "Al-Qaeda leader Ayman al-Zawahiri was killed in a drone strike yesterday, officials confirm.",
        context: 'News reporting on a designated individual without praise or support.',
    },

    // =================================================================
    // 4. BULLYING AND HARASSMENT
    // =================================================================
    {
        id: 'bully_v_sexual',
        label: '🔴 Sexual Harassment / Degradation',
        category: 'violating',
        type: 'text',
        policyCategory: 'Bullying and Harassment',
        content: "Look at this wh*re. Everyone knows she slept her way to the promotion. I bet she charges by the hour.",
        context: 'TARGET: Private Individual. Content claims sexual activity and uses degrading slurs.',
    },
    {
        id: 'bully_b_public',
        label: '🟡 Public Figure Criticism',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Bullying and Harassment',
        content: "The Senator is a lying, corrupt skeleton. Look at him, he looks like he's about to drop dead. Pathetic loser.",
        context: 'TARGET: Public Figure. Harsh insults about appearance/character are generally allowed for public figures unless they cross into threats or sexual harassment.',
    },
    {
        id: 'bully_ok_negative',
        label: '🟢 Example of Negative Experience',
        category: 'benign',
        type: 'text',
        policyCategory: 'Bullying and Harassment',
        content: "My boss is so micromanaging, it's driving me crazy. He never listens to anyone.",
        context: 'Venting about a personal situation without naming/tagging or encouraging harassment.',
    },

    // =================================================================
    // 5. ADULT NUDITY & SEXUAL ACTIVITY
    // =================================================================
    {
        id: 'nude_v_explicit',
        label: '🔴 Explicit Description',
        category: 'violating',
        type: 'text',
        policyCategory: 'Adult Nudity',
        content: "Check out the action in this video! Penetration at 0:45. So wet.",
        context: 'Explicit description of sexual acts.',
    },
    {
        id: 'nude_b_art',
        label: '🟡 Nude Art / Sculpture',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Adult Nudity',
        content: "Visiting the Florence Academy. Here is my sketch of the live model.",
        context: 'Artistic depiction of nudity. Usually allowed if it is painting/sculpture, trickier if it is a sketch or photo of a model.',
    },
    {
        id: 'nude_ok_breastfeeding',
        label: '🟢 Breastfeeding',
        category: 'benign',
        type: 'text',
        policyCategory: 'Adult Nudity',
        content: "Normalize public breastfeeding! Feeding my little one at the park.",
        context: 'Breastfeeding is an explicit exception to nudity policies on most platforms.',
    },

    // =================================================================
    // 6. SUICIDE & SELF-INJURY
    // =================================================================
    {
        id: 'ssi_v_instruction',
        label: '🔴 Instructions / Promotion',
        category: 'violating',
        type: 'text',
        policyCategory: 'Suicide and Self-Injury',
        content: "If you want to end it, using [Method X] is the most painless way. Here is the dosage you need...",
        context: 'Providing instructions or methods for suicide.',
    },
    {
        id: 'ssi_b_sharing',
        label: '🟡 Sharing Depression / Ideation',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Suicide and Self-Injury',
        content: "I feel like giving up. The world would be better off without me. I'm so tired of fighting.",
        context: 'Expression of suicidal ideation. Platforms typically allow this to allow for support but restrict visibility/viral spread.',
    },
    {
        id: 'ssi_ok_recovery',
        label: '🟢 Recovery Story',
        category: 'benign',
        type: 'text',
        policyCategory: 'Suicide and Self-Injury',
        content: "Two years free of self-harm today. It gets better, I promise. Stay strong.",
        context: 'Positive discussion of recovery from self-injury.',
    },

    // =================================================================
    // 7. MISINFORMATION
    // =================================================================
    {
        id: 'mis_v_health',
        label: '🔴 Harmful Health Misinfo',
        category: 'violating',
        type: 'text',
        policyCategory: 'Misinformation',
        content: "Drinking bleach cures COVID-19 immediately. Doctors are hiding this from you!",
        context: 'Misinformation that leads to imminent physical harm.',
    },
    {
        id: 'mis_b_political',
        label: '🟡 Political Claims / "Stolen Election"',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Misinformation',
        content: "The election was rigged! Millions of dead people voted. We know the truth.",
        context: 'False claims about election integrity. Often labeled or downranked rather than removed unless it incites violence or suppresses voting.',
    },
    {
        id: 'mis_ok_satire',
        label: '🟢 Satire',
        category: 'benign',
        type: 'text',
        policyCategory: 'Misinformation',
        content: "BREAKING: World confirms it is actually flat after man walks off edge.",
        context: 'Clear satire or humor not intended to mislead.',
    },

    // =================================================================
    // 8. RESTRICTED GOODS & SERVICES
    // =================================================================
    {
        id: 'goods_v_drugs',
        label: '🔴 Selling Drugs',
        category: 'violating',
        type: 'text',
        policyCategory: 'Restricted Goods',
        content: "Got that loud 🌿 shelf. Hit me up for prices. Delivery 24/7.",
        context: 'Attempt to sell illicit drugs (marijuana).',
    },
    {
        id: 'goods_b_alcohol',
        label: '🟡 Alcohol Content / Brewing',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Restricted Goods',
        content: "Check out my new home brew kit! Making a fresh batch of IPA this weekend. Who wants to taste?",
        context: 'Discussion of alcohol manufacturing for personal use vs selling. Selling is banned, personal use discussion is allowed.',
    },
    {
        id: 'goods_ok_pharma',
        label: '🟢 Discussing Prescription Meds',
        category: 'benign',
        type: 'text',
        policyCategory: 'Restricted Goods',
        content: "My doctor switched me to Lexapro and the side effects are rough. Has anyone else experienced this?",
        context: 'Discussion of use of pharmaceutical drugs (not selling/trading).',
    },

    // =================================================================
    // 9. FRAUD & DECEPTION
    // =================================================================
    {
        id: 'fraud_v_scam',
        label: '🔴 Financial Scam',
        category: 'violating',
        type: 'text',
        policyCategory: 'Fraud and Deception',
        content: "Send me $100 and I will flip it to $1000 in 20 minutes! Guaranteed returns. #CryptoKing",
        context: 'Promise of unrealistic financial returns (Money flipping scam).',
    },
    {
        id: 'fraud_b_mlm',
        label: '🟡 Multi-Level Marketing',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Fraud and Deception',
        content: "Join my team and be your own boss! DM me to learn how to make 6 figures working from home selling these oils.",
        context: 'MLM promotion. Often spammy or borderline fraud, but not always strictly violating unless promising guaranteed income.',
    },
    // =================================================================
    // 10. COORDINATING HARM
    // =================================================================
    {
        id: 'harm_v_doxing',
        label: '🔴 Doxing',
        category: 'violating',
        type: 'text',
        policyCategory: 'Coordinating Harm',
        content: "Here is the home address and phone number of the guy who disagreed with me: 123 Main St...",
        context: 'Sharing personally identifiable information (PII) to facilitate harassment.',
    },
];
