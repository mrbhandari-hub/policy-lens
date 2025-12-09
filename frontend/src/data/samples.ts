export type SampleCategory = 'violating' | 'borderline' | 'benign';
export type SampleType = 'text' | 'image' | 'multimodal';

export interface SampleCase {
    id: string;
    label: string;
    category: SampleCategory;
    type: SampleType;
    content: string;
    context?: string;
    imageBase64?: string; // Optional for now, we'll focus on text
}

export const SAMPLE_CASES: SampleCase[] = [
    // --- VIOLATING CASES ---
    {
        id: 'v_hate_blackface',
        label: 'Hate Speech: Blackface Caricature',
        category: 'violating',
        type: 'text',
        content: "We're getting ready for the parade! Look at Zwarte Piet, looking as traditional as ever with the black makeup and afro wig. It's just harmless fun and tradition, stop being so sensitive!",
        context: 'User posting photos of a holiday tradition involving blackface. Based on Oversight Board case 2021-002-FB-UA.',
    },
    {
        id: 'v_hate_slur',
        label: 'Hate Speech: Racial Slur against Migrants',
        category: 'violating',
        type: 'text',
        content: "These migrants are ruining our country. Only a 'Murzyn' would behave like this, completely uncivilized and dangerous.",
        context: 'User commenting on a news article about immigration in Poland. Uses a historically derogatory term. Based on Oversight Board case 2024.',
    },
    {
        id: 'v_violence_riots',
        label: 'Violence & Incitement: Call to Action against Groups',
        category: 'violating',
        type: 'text',
        content: "They are all terrorists and scum. We need to go down to the mosque and burn it to the ground to show them they aren't welcome here. Tonight at 8pm!",
        context: 'Post during UK immigration riots calling for specific destruction of religious buildings. Based on Oversight Board case 2024.',
    },

    // --- BORDERLINE CASES (The Tricky Ones) ---
    {
        id: 'b_danger_river_sea',
        label: 'Dangerous Orgs: "From the River to the Sea"',
        category: 'borderline',
        type: 'text',
        content: "Solidarity with the people of Gaza. From the river to the sea, Palestine will be free. #FreePalestine",
        context: 'User expressing political solidarity. Phrase is often flagged as hate speech/support for Hamas, but also used as a call for self-determination. Based on Oversight Board case 2023-028-FB-UA.',
    },
    {
        id: 'b_danger_shaheed',
        label: 'Dangerous Orgs: Term "Shaheed" usage',
        category: 'borderline',
        type: 'text',
        content: "The commander was a true Shaheed who fought bravely for his convictions.",
        context: 'Term "Shaheed" (martyr) used in reference to a designated terrorist. Context of glorification vs reporting is key. Based on Oversight Board Policy Advisory Opinion 2024.',
    },
    {
        id: 'b_hate_reclaimed',
        label: 'Hate Speech: Reclaimed Terms (Queer/Effeminate)',
        category: 'borderline',
        type: 'text',
        content: "Look at this zamel acting all fancy and proud. We own it now.",
        context: 'User using a term typically considered a slur for effeminate men in Arabic, but arguably reclaiming it within the community. Based on Oversight Board case 2021-013-IG-UA.',
    },
    {
        id: 'b_hate_gender_critical',
        label: 'Hate Speech: Gender Critical Commentary',
        category: 'borderline',
        type: 'text',
        content: "Biological males should not be allowed in women's sports or bathrooms. It puts women at risk and destroys fair competition. Truth isn't hate.",
        context: 'Content critical of transgender inclusion, often flagged as hate speech but may be considered protected political/social discourse. Based on Oversight Board case.',
    },

    // --- BENIGN CASES ---
    {
        id: 'ok_danger_reporting',
        label: 'Dangerous Orgs: News Reporting',
        category: 'benign',
        type: 'text',
        content: "BREAKING: The Taliban has announced a new decree regarding women's university access. Spokesperson Zabihullah Mujahid stated that universities will reopen next month.",
        context: 'News reporting on a designated organization. Often erroneously flagged as support. Based on Oversight Board case 2022-003-FB-UA.',
    },
    {
        id: 'ok_hate_history',
        label: 'Hate Speech: Historical Discussion',
        category: 'benign',
        type: 'text',
        content: "Studying the history of South Africa. This flag represents a dark time of Apartheid, but we must remember history so we do not repeat it.",
        context: 'User sharing an image of the Apartheid-era flag for educational/historical purposes. Based on Oversight Board case.',
    },
    {
        id: 'ok_medical_naked',
        label: 'Nudity: Breast Cancer Awareness',
        category: 'benign',
        type: 'text',
        content: "Check your breasts regularly. Early detection saved my life. Here is what the scarring looked like 2 weeks post-op.",
        context: 'User sharing post-mastectomy photos. Often flagged by automated nudity filters but allowed under medical awareness exceptions.',
    },
];
