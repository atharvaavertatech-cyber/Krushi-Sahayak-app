export interface SampleLeaf {
  id: string;
  nameMr: string;
  nameEn: string;
  disease: string;
  description: string;
  confidence: number;
  svgIcon: string;
  remedies: string[];
}

export const SAMPLE_LEAF_PRESETS: SampleLeaf[] = [
  {
    id: 'anthracnose',
    nameMr: 'करपा रोग (Anthracnose)',
    nameEn: 'Anthracnose Leaf Blight',
    disease: 'Anthracnose (करपा रोग)',
    description: 'पानांवर तपकिरी ते काळे गोलाकार डाग, पानांचे कोपरे जळल्यासारखे दिसणे.',
    confidence: 0.91,
    svgIcon: '🍂',
    remedies: [
      'कॉपर ऑक्सिक्लोराईड (Copper Oxychloride) २५ ग्रॅम किंवा मॅन्कोझेब (Mancozeb) २० ग्रॅम १० लिटर पाण्यात मिसळून फवारा.',
      'झाडाखालील गळलेली रोगट पाने आणि सुकलेल्या फांद्या गोळा करून नष्ट करा.',
      'कोकणातील दमट हवेत पाऊस थांबल्यावर ताबडतोब बुरशीनाशक फवारावे.'
    ]
  },
  {
    id: 'powdery_mildew',
    nameMr: 'भुरी रोग (Powdery Mildew)',
    nameEn: 'Powdery Mildew',
    disease: 'Powdery Mildew (भुरी रोग)',
    description: 'नवीन पालवी व मोहरावर पांढुरकी बुरशीची भुकटी पसरणे, पाने आकसणे.',
    confidence: 0.88,
    svgIcon: '🌫️',
    remedies: [
      'विद्राव्य गंधक (Soluble Sulphur) २० ग्रॅम १० लिटर पाण्यात मिसळून फवारणी करा.',
      'जास्त प्रादुर्भाव असल्यास हेक्साकोनॅझोल (Hexaconazole) ५ मि.ली. प्रति १० लिटर पाण्यात मिसळा.',
      'मोहर येण्याच्या काळात सकाळी धुके पडल्यास तातडीने लक्ष ठेवा.'
    ]
  },
  {
    id: 'dieback',
    nameMr: 'डायबॅक / शेंडा सुकणे (Dieback)',
    nameEn: 'Dieback / Twig Blight',
    disease: 'Dieback (शेंडा सुकणे)',
    description: 'फांदीच्या शेंड्याकडून खाली वाळत जाणे, पाने तपकिरी पडून लटकून राहणे.',
    confidence: 0.84,
    svgIcon: '🪵',
    remedies: [
      'वाळलेला शेंडा निरोगी भागापासून ३-४ इंच खाली कापून काढावा.',
      'कापलेल्या भागावर बोर्डो पेस्ट (Bordeaux paste) किंवा कॉपर ऑक्सिक्लोराईडची पेस्ट लावावी.',
      'झाडाच्या मुळांशी पाणी साचू नये, योग्य निचरा ठेवावा.'
    ]
  },
  {
    id: 'bacterial_canker',
    nameMr: 'जिवाणू करपा (Bacterial Canker)',
    nameEn: 'Bacterial Canker',
    disease: 'Bacterial Canker (जिवाणू करपा)',
    description: 'पानांवर पाण्याचा थर आल्यासारखे तेलकट, काळे डाग व डिंक स्त्रवणे.',
    confidence: 0.82,
    svgIcon: '💧',
    remedies: [
      'स्ट्रेप्टोसायक्लिन (Streptocycline) १ ग्रॅम + कॉपर ऑक्सिक्लोराईड २५ ग्रॅम १० लिटर पाण्यात फवारा.',
      'छाटणीची अवजारे निर्जंतुक करूनच वापरा.',
      'झाडावरील जखमांवर बोर्डो पेस्ट लावा.'
    ]
  },
  {
    id: 'healthy_alphonso',
    nameMr: 'निरोगी हापूस पान (Healthy Alphonso Leaf)',
    nameEn: 'Healthy Alphonso Leaf',
    disease: 'Healthy Alphonso Leaf (निरोगी पान)',
    description: 'गडद हिरवे, चमकदार पान, कोणताही रोग किंवा बुरशीची लक्षणे नाहीत.',
    confidence: 0.98,
    svgIcon: '🍃',
    remedies: [
      'पान निरोगी आहे! नियमित संतुलित खत व्यवस्थापन आणि निंबोळी अर्काची प्रतिबंधक फवारणी सुरू ठेवा.',
      'जांभा मातीत दरवर्षी झाडाला २५-३० किलो शेणखत किंवा गांडूळ खत द्या.'
    ]
  }
];

export const KONKAN_SOIL_FACTS = [
  {
    titleMr: 'जांभा माती (Laterite Soil)',
    titleEn: 'Laterite Soil Characteristics',
    descMr: 'कोकणातील मुख्य माती जांभा दगड फुटून तयार झालेली असून तांबूस-लाल रंगाची असते. यामध्ये लोह (Iron) आणि ॲल्युमिनियमचे प्रमाण भरपूर असते, पण सेंद्रिय कर्ब आणि नायट्रोजन कमी असतो.',
  },
  {
    titleMr: 'सामू (Soil pH 5.5 - 6.5)',
    titleEn: 'Acidic Soil Reaction',
    descMr: 'जांभा माती आम्लधर्मीय (Acidic) असते. हा सामू हापूस आंबा, काजू आणि नारळ यांच्या मुळांच्या वाढीसाठी आणि सुगंधी फळांच्या गुणवत्तेसाठी अत्यंत योग्य मानला जातो.',
  },
  {
    titleMr: 'उत्तम निचरा (Well Draining)',
    titleEn: 'Superior Drainage & Slopes',
    descMr: 'ही माती सच्छिद्र असल्याने मुळांमध्ये पाणी साचून राहत नाही. यामुळे आंब्याच्या मुळांना सड लागत नाही. डोंगरउतारावर वसलेल्या बागांमध्ये जलद निचरा होतो.',
  },
  {
    titleMr: 'पावसाळी धूप व उपाय (Erosion Control)',
    titleEn: 'Heavy Monsoon Soil Runoff',
    descMr: 'कोकणात ३००० ते ३५०० मिमी मुसळधार पाऊस पडतो. डोंगरउतारावरील बागांमध्ये दगडी बांध, समपातळी चर आणि ताग/धैंचाचे आच्छादन (Mulching) करून मातीची धूप थांबवावी.',
  },
  {
    titleMr: 'सेंद्रिय खतांची आवश्यकता',
    titleEn: 'Organic Matter Amendment',
    descMr: 'जांभा मातीची पाणी धरून ठेवण्याची क्षमता वाढवण्यासाठी दरवर्षी ऑक्टोबर-नोव्हेंबरमध्ये प्रत्येक झाडाला २५-५० किलो कुजलेले शेणखत किंवा गांडूळ खत देणे आवश्यक आहे.',
  }
];

export const QUICK_VOICE_PROMPTS = [
  'हापूसच्या पानांवर काळे डाग पडले आहेत, काय करू?',
  'जांभा मातीत खत व्यवस्थापन कसे करावे?',
  'मोहोर संरक्षणासाठी पहिली फवारणी कोणती करावी?',
  'आंब्याच्या शेंड्याची पाने सुकत आहेत, उपाय सांगा.'
];
