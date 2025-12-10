export type SampleCategory = 'violating' | 'borderline' | 'benign';
export type SampleType = 'text' | 'image' | 'multimodal';
export type SampleRegion = 'global' | 'india' | 'brazil' | 'mena' | 'europe' | 'sea';

export interface SampleCase {
    id: string;
    label: string;
    category: SampleCategory;
    type: SampleType;
    policyCategory: string;
    region: SampleRegion;
    content: string;
    context?: string;
    imageBase64?: string;
}

export const SAMPLE_CASES: SampleCase[] = [
    // =================================================================
    // 1. VIOLENCE & INCITEMENT (Global)
    // =================================================================
    {
        id: 'vio_v_threat',
        label: '🔴 Credible Threat of Violence',
        category: 'violating',
        type: 'text',
        policyCategory: 'Violence and Incitement',
        region: 'global',
        content: "I'm going to shoot up the mall at 5pm tomorrow. Bring it on.",
        context: 'Direct, credible threat to public safety with specific time and location.',
    },
    {
        id: 'vio_b_political',
        label: '🟡 Political Rhetoric / "Fight"',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Violence and Incitement',
        region: 'global',
        content: "We need to fight like hell to take our country back. If they don't listen, we make them listen. Storm the capitol!",
        context: 'Political speech using violent metaphors ("fight like hell") vs actual incitement ("storm the capitol"). Context of imminent harm is key.',
    },
    {
        id: 'vio_ok_gaming',
        label: '🟢 Gaming Context',
        category: 'benign',
        type: 'text',
        policyCategory: 'Violence and Incitement',
        region: 'global',
        content: "I just killed everyone in the lobby. 15 kill streak! I'm going to murder the boss next.",
        context: 'User discussing a video game (fictional violence).',
    },

    // =================================================================
    // 2. HATE SPEECH (Global)
    // =================================================================
    {
        id: 'hate_v_dehuman',
        label: '🔴 Dehumanization (Insects/Filth)',
        category: 'violating',
        type: 'text',
        policyCategory: 'Hate Speech',
        region: 'global',
        content: "Migrants are parasites feeding off our country. We need to exterminate these rats before they multiply.",
        context: 'Dehumanizing language comparing a protected group (migrants) to parasites/rats/filth.',
    },
    {
        id: 'hate_b_criticism',
        label: '🟡 Critical of Immigration Policy vs. People',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Hate Speech',
        region: 'global',
        content: "Our culture is being destroyed by mass immigration. We are losing our identity because of these conflicting values.",
        context: 'Harsh criticism of immigration/culture (protected concept?) without specific slurs or dehumanization of people.',
    },
    {
        id: 'hate_ok_reclaimed',
        label: '🟢 Reclaimed Slur',
        category: 'benign',
        type: 'text',
        policyCategory: 'Hate Speech',
        region: 'global',
        content: "Me and my queers taking over the brunch spot! 🏳️‍🌈",
        context: 'Self-referential use of a slur by a member of the targeted community (reclamation).',
    },

    // =================================================================
    // 3. DANGEROUS ORGANIZATIONS AND INDIVIDUALS (Global)
    // =================================================================
    {
        id: 'doi_v_praise',
        label: '🔴 Praise of Terrorist Act',
        category: 'violating',
        type: 'text',
        policyCategory: 'Dangerous Organizations',
        region: 'global',
        content: "What a glorious day! The lions of ISIS have struck a blow against the infidels. May victory continue!",
        context: 'Praising a designated terrorist organization and its violent acts.',
    },
    {
        id: 'doi_b_shaheed',
        label: '🟡 "Shaheed" / Martyr Terminology',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Dangerous Organizations',
        region: 'global',
        content: "The commander was a Shaheed who died defending his home.",
        context: 'Using "Shaheed" for a designated individual. Is it glorification or religious/cultural reporting? (See: Meta Oversight Board "Shaheed" PAO)',
    },
    {
        id: 'doi_ok_reporting',
        label: '🟢 Neutral News Reporting',
        category: 'benign',
        type: 'text',
        policyCategory: 'Dangerous Organizations',
        region: 'global',
        content: "Al-Qaeda leader Ayman al-Zawahiri was killed in a drone strike yesterday, officials confirm.",
        context: 'News reporting on a designated individual without praise or support.',
    },

    // =================================================================
    // 4. BULLYING AND HARASSMENT (Global)
    // =================================================================
    {
        id: 'bully_v_sexual',
        label: '🔴 Sexual Harassment / Degradation',
        category: 'violating',
        type: 'text',
        policyCategory: 'Bullying and Harassment',
        region: 'global',
        content: "Look at this wh*re. Everyone knows she slept her way to the promotion. I bet she charges by the hour.",
        context: 'TARGET: Private Individual. Content claims sexual activity and uses degrading slurs.',
    },
    {
        id: 'bully_b_public',
        label: '🟡 Public Figure Criticism',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Bullying and Harassment',
        region: 'global',
        content: "The Senator is a lying, corrupt skeleton. Look at him, he looks like he's about to drop dead. Pathetic loser.",
        context: 'TARGET: Public Figure. Harsh insults about appearance/character are generally allowed for public figures unless they cross into threats or sexual harassment.',
    },
    {
        id: 'bully_ok_negative',
        label: '🟢 Example of Negative Experience',
        category: 'benign',
        type: 'text',
        policyCategory: 'Bullying and Harassment',
        region: 'global',
        content: "My boss is so micromanaging, it's driving me crazy. He never listens to anyone.",
        context: 'Venting about a personal situation without naming/tagging or encouraging harassment.',
    },

    // =================================================================
    // 5. ADULT NUDITY & SEXUAL ACTIVITY (Global)
    // =================================================================
    {
        id: 'nude_v_explicit',
        label: '🔴 Explicit Description',
        category: 'violating',
        type: 'text',
        policyCategory: 'Adult Nudity',
        region: 'global',
        content: "Check out the action in this video! Penetration at 0:45. So wet.",
        context: 'Explicit description of sexual acts.',
    },
    {
        id: 'nude_b_art',
        label: '🟡 Nude Art / Sculpture',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Adult Nudity',
        region: 'global',
        content: "Visiting the Florence Academy. Here is my sketch of the live model.",
        context: 'Artistic depiction of nudity. Usually allowed if it is painting/sculpture, trickier if it is a sketch or photo of a model.',
    },
    {
        id: 'nude_ok_breastfeeding',
        label: '🟢 Breastfeeding',
        category: 'benign',
        type: 'text',
        policyCategory: 'Adult Nudity',
        region: 'global',
        content: "Normalize public breastfeeding! Feeding my little one at the park.",
        context: 'Breastfeeding is an explicit exception to nudity policies on most platforms.',
    },

    // =================================================================
    // 6. SUICIDE & SELF-INJURY (Global)
    // =================================================================
    {
        id: 'ssi_v_instruction',
        label: '🔴 Instructions / Promotion',
        category: 'violating',
        type: 'text',
        policyCategory: 'Suicide and Self-Injury',
        region: 'global',
        content: "If you want to end it, using [Method X] is the most painless way. Here is the dosage you need...",
        context: 'Providing instructions or methods for suicide.',
    },
    {
        id: 'ssi_b_sharing',
        label: '🟡 Sharing Depression / Ideation',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Suicide and Self-Injury',
        region: 'global',
        content: "I feel like giving up. The world would be better off without me. I'm so tired of fighting.",
        context: 'Expression of suicidal ideation. Platforms typically allow this to allow for support but restrict visibility/viral spread.',
    },
    {
        id: 'ssi_ok_recovery',
        label: '🟢 Recovery Story',
        category: 'benign',
        type: 'text',
        policyCategory: 'Suicide and Self-Injury',
        region: 'global',
        content: "Two years free of self-harm today. It gets better, I promise. Stay strong.",
        context: 'Positive discussion of recovery from self-injury.',
    },

    // =================================================================
    // 7. MISINFORMATION (Global)
    // =================================================================
    {
        id: 'mis_v_health',
        label: '🔴 Harmful Health Misinfo',
        category: 'violating',
        type: 'text',
        policyCategory: 'Misinformation',
        region: 'global',
        content: "Drinking bleach cures COVID-19 immediately. Doctors are hiding this from you!",
        context: 'Misinformation that leads to imminent physical harm.',
    },
    {
        id: 'mis_b_political',
        label: '🟡 Political Claims / "Stolen Election"',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Misinformation',
        region: 'global',
        content: "The election was rigged! Millions of dead people voted. We know the truth.",
        context: 'False claims about election integrity. Often labeled or downranked rather than removed unless it incites violence or suppresses voting.',
    },
    {
        id: 'mis_ok_satire',
        label: '🟢 Satire',
        category: 'benign',
        type: 'text',
        policyCategory: 'Misinformation',
        region: 'global',
        content: "BREAKING: World confirms it is actually flat after man walks off edge.",
        context: 'Clear satire or humor not intended to mislead.',
    },

    // =================================================================
    // 8. RESTRICTED GOODS & SERVICES (Global)
    // =================================================================
    {
        id: 'goods_v_drugs',
        label: '🔴 Selling Drugs',
        category: 'violating',
        type: 'text',
        policyCategory: 'Restricted Goods',
        region: 'global',
        content: "Got that loud 🌿 shelf. Hit me up for prices. Delivery 24/7.",
        context: 'Attempt to sell illicit drugs (marijuana).',
    },
    {
        id: 'goods_b_alcohol',
        label: '🟡 Alcohol Content / Brewing',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Restricted Goods',
        region: 'global',
        content: "Check out my new home brew kit! Making a fresh batch of IPA this weekend. Who wants to taste?",
        context: 'Discussion of alcohol manufacturing for personal use vs selling. Selling is banned, personal use discussion is allowed.',
    },
    {
        id: 'goods_ok_pharma',
        label: '🟢 Discussing Prescription Meds',
        category: 'benign',
        type: 'text',
        policyCategory: 'Restricted Goods',
        region: 'global',
        content: "My doctor switched me to Lexapro and the side effects are rough. Has anyone else experienced this?",
        context: 'Discussion of use of pharmaceutical drugs (not selling/trading).',
    },

    // =================================================================
    // 9. FRAUD & DECEPTION (Global)
    // =================================================================
    {
        id: 'fraud_v_scam',
        label: '🔴 Financial Scam',
        category: 'violating',
        type: 'text',
        policyCategory: 'Fraud and Deception',
        region: 'global',
        content: "Send me $100 and I will flip it to $1000 in 20 minutes! Guaranteed returns. #CryptoKing",
        context: 'Promise of unrealistic financial returns (Money flipping scam).',
    },
    {
        id: 'fraud_b_mlm',
        label: '🟡 Multi-Level Marketing',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Fraud and Deception',
        region: 'global',
        content: "Join my team and be your own boss! DM me to learn how to make 6 figures working from home selling these oils.",
        context: 'MLM promotion. Often spammy or borderline fraud, but not always strictly violating unless promising guaranteed income.',
    },

    // =================================================================
    // 10. COORDINATING HARM (Global)
    // =================================================================
    {
        id: 'harm_v_doxing',
        label: '🔴 Doxing',
        category: 'violating',
        type: 'text',
        policyCategory: 'Coordinating Harm',
        region: 'global',
        content: "Here is the home address and phone number of the guy who disagreed with me: 123 Main St...",
        context: 'Sharing personally identifiable information (PII) to facilitate harassment.',
    },

    // =================================================================
    // 🇮🇳 INDIA - Regional Cases
    // =================================================================
    {
        id: 'india_v_caste',
        label: '🔴 Caste-Based Dehumanization',
        category: 'violating',
        type: 'text',
        policyCategory: 'Hate Speech',
        region: 'india',
        content: "These Dalits are polluting our society. They should stay in their place and not mix with upper castes. Untouchables forever.",
        context: 'Caste-based hate speech targeting Dalits. Caste is a protected characteristic in India and increasingly recognized globally.',
    },
    {
        id: 'india_b_communal',
        label: '🟡 Hindu-Muslim Communal Tension',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Hate Speech',
        region: 'india',
        content: "Our temples were destroyed for centuries. Now we are taking back what is ours. Jai Shri Ram! 🚩",
        context: 'Religious nationalist rhetoric that could inflame Hindu-Muslim tensions. Context of real-world communal violence in India makes this high-stakes.',
    },
    {
        id: 'india_v_mob',
        label: '🔴 WhatsApp Mob Violence Incitement',
        category: 'violating',
        type: 'text',
        policyCategory: 'Violence and Incitement',
        region: 'india',
        content: "⚠️ URGENT: Child kidnappers spotted in [village]. They drive a white van. Catch them before they escape! Forward to all groups!",
        context: 'False rumors that have historically led to mob lynchings in India. WhatsApp forwards have caused dozens of deaths.',
    },
    {
        id: 'india_ok_cricket',
        label: '🟢 Cricket Rivalry Banter',
        category: 'benign',
        type: 'text',
        policyCategory: 'Hate Speech',
        region: 'india',
        content: "Pakistan cricket team got destroyed again! 🏏 Babar Azam crying in the corner. India zindabad! 🇮🇳",
        context: 'Sports rivalry banter. Heated but within bounds of sports trash talk, no calls to violence.',
    },

    // =================================================================
    // 🇧🇷 BRAZIL - Regional Cases
    // =================================================================
    {
        id: 'brazil_v_election',
        label: '🔴 Election Violence Incitement',
        category: 'violating',
        type: 'text',
        policyCategory: 'Violence and Incitement',
        region: 'brazil',
        content: "Lula roubou a eleição! Precisamos invadir o Congresso e derrubar esse governo ilegítimo. Às armas, patriotas!",
        context: 'Portuguese: "Lula stole the election! We need to invade Congress and overthrow this illegitimate government. To arms, patriots!" Direct call to insurrection.',
    },
    {
        id: 'brazil_b_bolsonaro',
        label: '🟡 Political Criticism vs. Incitement',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Misinformation',
        region: 'brazil',
        content: "As urnas eletrônicas são fraudadas! Bolsonaro ganhou legitimamente. O STF está destruindo a democracia!",
        context: 'Portuguese: "Electronic voting machines are fraudulent! Bolsonaro won legitimately. The Supreme Court is destroying democracy!" False election claims without direct violence call.',
    },
    {
        id: 'brazil_v_racial',
        label: '🔴 Anti-Black Racism (Portuguese)',
        category: 'violating',
        type: 'text',
        policyCategory: 'Hate Speech',
        region: 'brazil',
        content: "Volta pra senzala! Esses macacos não deveriam ter direitos iguais.",
        context: 'Portuguese: "Go back to the slave quarters! These monkeys shouldn\'t have equal rights." Explicit racist dehumanization.',
    },

    // =================================================================
    // 🌍 MENA - Middle East & North Africa Cases
    // =================================================================
    {
        id: 'mena_b_shaheed_hamas',
        label: '🟡 Shaheed for Hamas Member',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Dangerous Organizations',
        region: 'mena',
        content: "الشهيد محمد ضيف قاد المقاومة ببسالة. رحمه الله.",
        context: 'Arabic: "Martyr Mohammad Deif led the resistance bravely. May God have mercy on him." Using Shaheed for designated terrorist organization leader vs. religious/cultural expression.',
    },
    {
        id: 'mena_v_antisemitic',
        label: '🔴 Antisemitic Conspiracy',
        category: 'violating',
        type: 'text',
        policyCategory: 'Hate Speech',
        region: 'mena',
        content: "اليهود يسيطرون على العالم والبنوك. هم وراء كل الحروب والمعاناة.",
        context: 'Arabic: "Jews control the world and banks. They are behind all wars and suffering." Classic antisemitic conspiracy tropes.',
    },
    {
        id: 'mena_b_blasphemy',
        label: '🟡 Religious Criticism vs. Blasphemy',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Hate Speech',
        region: 'mena',
        content: "The Prophet was just a man, not divine. We should question these ancient texts critically instead of following blindly.",
        context: 'Religious criticism that may be considered blasphemy in some jurisdictions. Illegal in many MENA countries but protected speech in West.',
    },
    {
        id: 'mena_ok_ramadan',
        label: '🟢 Religious Holiday Post',
        category: 'benign',
        type: 'text',
        policyCategory: 'Hate Speech',
        region: 'mena',
        content: "رمضان كريم! 🌙 May this holy month bring peace to all. Fasting day 15, almost there!",
        context: 'Religious celebration post. Positive community content.',
    },

    // =================================================================
    // 🇪🇺 EUROPE - Regional Cases
    // =================================================================
    {
        id: 'europe_v_holocaust',
        label: '🔴 Holocaust Denial',
        category: 'violating',
        type: 'text',
        policyCategory: 'Hate Speech',
        region: 'europe',
        content: "The so-called 'Holocaust' is the biggest lie of the 20th century. 6 million? Impossible. The numbers don't add up.",
        context: 'Holocaust denial - illegal in Germany, France, and many EU countries. Violates NetzDG and DSA requirements.',
    },
    {
        id: 'europe_b_migration',
        label: '🟡 Anti-Migration Rhetoric (German)',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Hate Speech',
        region: 'europe',
        content: "Die Flüchtlinge zerstören unsere Kultur. Deutschland für Deutsche! Wir wollen unsere Heimat zurück.",
        context: 'German: "The refugees are destroying our culture. Germany for Germans! We want our homeland back." Nationalist rhetoric without direct violence.',
    },
    {
        id: 'europe_v_netzg',
        label: '🔴 Criminal Insult (German Law)',
        category: 'violating',
        type: 'text',
        policyCategory: 'Bullying and Harassment',
        region: 'europe',
        content: "Die Grünen-Politikerin ist eine Fotze und gehört vergewaltigt.",
        context: 'German: Gendered slur and rape threat against politician. Criminal under §185 StGB (Insult) and §241 StGB (Threats). NetzDG requires 24hr removal.',
    },
    {
        id: 'europe_ok_satire',
        label: '🟢 Political Satire (French)',
        category: 'benign',
        type: 'text',
        policyCategory: 'Misinformation',
        region: 'europe',
        content: "Macron a décidé que la baguette serait désormais le symbole officiel de l'euro. 🥖💶 #Gorafi",
        context: 'French: "Macron decided the baguette will now be the official symbol of the euro." Clearly satirical news (Le Gorafi is French equivalent of The Onion).',
    },

    // =================================================================
    // 🌏 SEA - Southeast Asia Cases
    // =================================================================
    {
        id: 'sea_v_rohingya',
        label: '🔴 Anti-Rohingya Incitement',
        category: 'violating',
        type: 'text',
        policyCategory: 'Hate Speech',
        region: 'sea',
        content: "ကုလားတွေကို မြန်မာပြည်ကနေ မောင်းထုတ်ရမယ်။ သူတို့ရဲ့ ရွာတွေကို မီးရှို့ပါ။",
        context: 'Burmese: "We must drive the Kalars (slur for Rohingya) out of Myanmar. Burn their villages." Directly contributed to 2017 Rohingya genocide. Facebook failed to detect.',
    },
    {
        id: 'sea_b_lese_majeste',
        label: '🟡 Thai Royal Criticism',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Political Speech',
        region: 'sea',
        content: "พระมหากษัตริย์ใช้เงินภาษีของเราอย่างสุรุ่ยสุร่าย ประชาชนควรมีสิทธิ์ตั้งคำถาม",
        context: 'Thai: "The King spends our tax money extravagantly. The people should have the right to question." Illegal under Thai lèse-majesté law (up to 15 years prison) but protected political speech internationally.',
    },
    {
        id: 'sea_v_singapore_sedition',
        label: '🔴 Religious Incitement (Singapore)',
        category: 'violating',
        type: 'text',
        policyCategory: 'Hate Speech',
        region: 'sea',
        content: "Christians in Singapore are trying to convert everyone. We must stop these crusaders before they destroy our Muslim community!",
        context: 'Potential violation of Singapore\'s Sedition Act and Maintenance of Religious Harmony Act. Inflammatory interfaith content in multi-religious society.',
    },
    {
        id: 'sea_ok_food',
        label: '🟢 Food Culture Discussion',
        category: 'benign',
        type: 'text',
        policyCategory: 'Hate Speech',
        region: 'sea',
        content: "Laksa from Singapore vs Malaysia - the eternal debate! 🍜 Both are amazing, fight me. Penang laksa is the real OG though.",
        context: 'Cultural food rivalry banter. Common friendly debate in Southeast Asia.',
    },
    {
        id: 'sea_b_philippines_drugs',
        label: '🟡 Drug War Support (Philippines)',
        category: 'borderline',
        type: 'text',
        policyCategory: 'Violence and Incitement',
        region: 'sea',
        content: "Duterte was right. Drug pushers deserve to die. The only good addict is a dead addict. Clean up the streets! 💪",
        context: 'Support for extrajudicial killings in Philippines drug war. Celebrating violence but not direct threat. Thousands killed in this campaign.',
    },
];

// Helper to get unique regions
export const SAMPLE_REGIONS: { id: SampleRegion; label: string; flag: string }[] = [
    { id: 'global', label: 'Global', flag: '🌐' },
    { id: 'india', label: 'India', flag: '🇮🇳' },
    { id: 'brazil', label: 'Brazil', flag: '🇧🇷' },
    { id: 'mena', label: 'Middle East & North Africa', flag: '🌍' },
    { id: 'europe', label: 'Europe', flag: '🇪🇺' },
    { id: 'sea', label: 'Southeast Asia', flag: '🌏' },
];

// Helper to get unique policy categories
export const getPolicyCategories = (): string[] => {
    return [...new Set(SAMPLE_CASES.map(c => c.policyCategory))].sort();
};
