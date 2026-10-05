export const initialCourses = [
  {
    id: 'mhl-tfc-26',
    slug: 'tharbiyya-family-course-2026',
    title: 'Tharbiyya Family Course',
    course_code: 'TFC',
    category: 'MAHALLU',
    description: 'Comprehensive family enrichment, parenting, and moral education syllabus across Kerala Mahallu study centres.',
    evaluation_type: 'EXAM_ONLY',
    min_attendance_percentage: 75,
    total_planned_classes: 24,
    standard_fee: 1500,
    default_rp_remuneration_per_class: 800,
    admission_no_pattern: 'CPET-TFC-26-{SEQ}',
    status: 'ACTIVE',
    subjects: [
      { id: 'sub-1', name: 'Fiqh of Family Life', code: 'FFL', max_marks: 100, pass_marks: 40 },
      { id: 'sub-2', name: 'Child & Adolescent Psychology', code: 'CAP', max_marks: 100, pass_marks: 40 },
      { id: 'sub-3', name: 'Quranic Ethics & Relationships', code: 'QER', max_marks: 100, pass_marks: 40 }
    ],
    custom_questions: []
  },
  {
    id: 'mhl-ycb-26',
    slug: 'weekend-youth-character-building',
    title: 'Weekend Youth Character Building',
    course_code: 'YCB',
    category: 'MAHALLU',
    description: 'Short intensive 4-weekend character and leadership workshop conducted directly in Mahallu madrasa premises.',
    evaluation_type: 'ATTENDANCE_ONLY',
    min_attendance_percentage: 75,
    total_planned_classes: 4,
    standard_fee: 500,
    default_rp_remuneration_per_class: 1000,
    admission_no_pattern: 'CPET-YCB-26-{SEQ}',
    status: 'ACTIVE',
    subjects: [],
    custom_questions: []
  },
  {
    id: 'mhl-wel-26',
    slug: 'women-empowerment-islamic-life',
    title: 'Mahallu Women Empowerment & Islamic Life',
    course_code: 'WEL',
    category: 'MAHALLU',
    description: 'Empowering women with Islamic jurisprudence, family wellness, and community leadership.',
    evaluation_type: 'HYBRID',
    min_attendance_percentage: 70,
    total_planned_classes: 12,
    standard_fee: 1200,
    default_rp_remuneration_per_class: 750,
    admission_no_pattern: 'CPET-WEL-26-{SEQ}',
    status: 'ACTIVE',
    subjects: [
      { id: 'sub-4', name: 'Women Jurisprudence & Health', code: 'WJH', max_marks: 50, pass_marks: 20 },
      { id: 'sub-5', name: 'Holistic Home Management', code: 'HHM', max_marks: 50, pass_marks: 20 }
    ],
    custom_questions: []
  },
  {
    id: 'gen-dip-psych-26',
    slug: 'diploma-islamic-psychology-counseling',
    title: 'Diploma in Islamic Psychology & Counseling',
    course_code: 'DIP-IPC',
    category: 'GENERAL_ONLINE',
    description: '1-Year comprehensive online diploma on counseling theories, psychiatric orientation, and Prophetic guidance.',
    evaluation_type: 'EXAM_ONLY',
    payment_policy: 'PAY_AT_REGISTRATION',
    min_attendance_percentage: 80,
    total_planned_classes: 48,
    standard_fee: 6000,
    default_rp_remuneration_per_class: 1200,
    admission_no_pattern: 'CPET-DIP-26-{SEQ}',
    status: 'ACTIVE',
    subjects: [
      { id: 'sub-6', name: 'Foundations of Islamic Psychology', code: 'FIP', max_marks: 100, pass_marks: 40 },
      { id: 'sub-7', name: 'Clinical Counseling Techniques', code: 'CCT', max_marks: 100, pass_marks: 40 }
    ],
    custom_questions: [
      {
        id: 'q1',
        label: 'Highest Educational Qualification',
        type: 'DROPDOWN',
        required: true,
        options: ['Higher Secondary (+2)', 'Bachelor Degree', 'Master Degree', 'DHIU / Shari\'ah Graduate', 'Ph.D. / Other'],
        placeholder: 'Select qualification'
      },
      {
        id: 'q2',
        label: 'Current Madrasa / College / Institution',
        type: 'SHORT_TEXT',
        required: true,
        options: [],
        placeholder: 'Enter institution name'
      },
      {
        id: 'q3',
        label: 'Why do you want to join this counseling diploma?',
        type: 'PARAGRAPH',
        required: false,
        options: [],
        placeholder: 'Describe your goals and motivation...'
      }
    ]
  },
  {
    id: 'gen-camp-lead-26',
    slug: 'residential-youth-leadership-camp-2026',
    title: 'Residential Youth Leadership Camp 2026',
    course_code: 'CAMP-LD',
    category: 'GENERAL_OFFLINE',
    description: '3-Day residential camp at Darul Huda campus focusing on public speaking, character, and organizational management.',
    evaluation_type: 'ATTENDANCE_ONLY',
    payment_policy: 'PAY_AFTER_CONFIRMATION',
    min_attendance_percentage: 90,
    total_planned_classes: 6,
    standard_fee: 2500,
    default_rp_remuneration_per_class: 0,
    admission_no_pattern: 'CPET-CAMP-26-{SEQ}',
    status: 'ACTIVE',
    subjects: [],
    custom_questions: [
      {
        id: 'q4',
        label: 'Dietary Preference',
        type: 'RADIO',
        required: true,
        options: ['Standard Non-Veg (Chicken/Meat)', 'Strict Vegetarian'],
        placeholder: ''
      },
      {
        id: 'q5',
        label: 'T-Shirt Size',
        type: 'DROPDOWN',
        required: true,
        options: ['M (Medium)', 'L (Large)', 'XL (Extra Large)', 'XXL'],
        placeholder: 'Select T-Shirt Size'
      },
      {
        id: 'q6',
        label: 'Any medical allergies or health conditions?',
        type: 'SHORT_TEXT',
        required: false,
        options: [],
        placeholder: 'Write None if not applicable'
      }
    ]
  },
  {
    id: 'gen-work-teach-26',
    slug: 'teachers-training-workshop-masterclass',
    title: 'Teachers Training Workshop (1-Day Masterclass)',
    course_code: 'WRK-TT',
    category: 'GENERAL_OFFLINE',
    description: 'Intensive 1-day pedagogical training for madrasa and school educators on modern teaching aids and classroom psychology.',
    evaluation_type: 'ATTENDANCE_ONLY',
    payment_policy: 'PAY_ON_SPOT',
    min_attendance_percentage: 100,
    total_planned_classes: 1,
    standard_fee: 400,
    default_rp_remuneration_per_class: 1500,
    admission_no_pattern: 'CPET-WRK-26-{SEQ}',
    status: 'ACTIVE',
    subjects: [],
    custom_questions: [
      {
        id: 'q7',
        label: 'School / Madrasa Name',
        type: 'SHORT_TEXT',
        required: true,
        options: [],
        placeholder: 'e.g. Al-Anwar Islamic English School'
      },
      {
        id: 'q8',
        label: 'Years of Teaching Experience',
        type: 'NUMBER',
        required: true,
        options: [],
        placeholder: 'e.g. 5'
      },
      {
        id: 'q9',
        label: 'Subjects You Currently Teach',
        type: 'CHECKBOX',
        required: true,
        options: ['Islamic Studies', 'Language / Arabic', 'Mathematics / Science', 'General / All'],
        placeholder: ''
      }
    ]
  },
  {
    id: 'gen-web-parent-26',
    slug: 'free-community-parenting-webinar',
    title: 'Free Community Parenting Webinar',
    course_code: 'WEB-PW',
    category: 'GENERAL_ONLINE',
    description: 'Public awareness webinar on mindful parenting in the digital screen age.',
    evaluation_type: 'ATTENDANCE_ONLY',
    payment_policy: 'FREE_COURSE',
    min_attendance_percentage: 50,
    total_planned_classes: 1,
    standard_fee: 0,
    default_rp_remuneration_per_class: 0,
    admission_no_pattern: 'CPET-WEB-26-{SEQ}',
    status: 'ACTIVE',
    subjects: [],
    custom_questions: [
      {
        id: 'q10',
        label: 'Number of Children',
        type: 'DROPDOWN',
        required: true,
        options: ['Expecting / Newly Married', '1 Child', '2-3 Children', '4 or more'],
        placeholder: 'Select range'
      },
      {
        id: 'q11',
        label: 'District / Location',
        type: 'SHORT_TEXT',
        required: true,
        options: [],
        placeholder: 'e.g. Malappuram'
      }
    ]
  }
];

export const initialCentres = [
  {
    id: 'mhl-mlp-001',
    centre_code: 'MHL-MLP-001',
    centre_name: 'Bafakhy Thangal Memorial Mahallu Study Centre',
    place: 'Tanur',
    mahallu_name: 'Tanur Valiya Juma Masjid Mahallu',
    panchayath_municipality: 'Tanur Municipality',
    district: 'Malappuram',
    pincode: '676302',
    committee_president_name: 'Usman Haji',
    committee_president_phone: '9847110022',
    committee_secretary_name: 'Abdul Kareem',
    committee_secretary_phone: '9847220033',
    founded_by_rp_id: 'rp-1',
    founded_by_rp_name: 'Usthad Mahroof Hudawi',
    assigned_rp_id: 'rp-1',
    active_course_id: 'mhl-tfc-26',
    status: 'ACTIVE'
  },
  {
    id: 'mhl-kkd-002',
    centre_code: 'MHL-KKD-002',
    centre_name: 'Noorul Islam Jama\'ath Centre',
    place: 'Feroke',
    mahallu_name: 'Feroke Petta Juma Masjid',
    panchayath_municipality: 'Feroke Municipality',
    district: 'Kozhikode',
    pincode: '673631',
    committee_president_name: 'PK Bava',
    committee_president_phone: '9847330044',
    committee_secretary_name: 'Kunjahammed',
    committee_secretary_phone: '9847440055',
    founded_by_rp_id: 'rp-1',
    founded_by_rp_name: 'Usthad Mahroof Hudawi',
    assigned_rp_id: 'rp-1',
    active_course_id: 'mhl-tfc-26',
    status: 'ACTIVE'
  },
  {
    id: 'mhl-knr-003',
    centre_code: 'MHL-KNR-003',
    centre_name: 'Al-Huda Mahallu Centre',
    place: 'Taliparamba',
    mahallu_name: 'Taliparamba Town Juma Masjid',
    panchayath_municipality: 'Taliparamba Municipality',
    district: 'Kannur',
    pincode: '670141',
    committee_president_name: 'Musthafa Haji',
    committee_president_phone: '9847550066',
    committee_secretary_name: 'Rasheed Master',
    committee_secretary_phone: '9847660077',
    founded_by_rp_id: 'rp-2',
    founded_by_rp_name: 'Usthad Bilal Hudawi',
    assigned_rp_id: 'rp-2',
    active_course_id: 'mhl-ycb-26',
    status: 'ACTIVE'
  },
  {
    id: 'mhl-tsr-004',
    centre_code: 'MHL-TSR-004',
    centre_name: 'Sirajul Huda Study Centre',
    place: 'Chavakkad',
    mahallu_name: 'Manathala Juma Masjid',
    panchayath_municipality: 'Chavakkad Municipality',
    district: 'Thrissur',
    pincode: '680506',
    committee_president_name: 'Sulaiman Moulavi',
    committee_president_phone: '9847770088',
    committee_secretary_name: 'Hameed',
    committee_secretary_phone: '9847880099',
    founded_by_rp_id: 'rp-1',
    founded_by_rp_name: 'Usthad Mahroof Hudawi',
    assigned_rp_id: 'rp-1',
    active_course_id: 'mhl-wel-26',
    status: 'PENDING_APPROVAL'
  }
];

export const initialResourcePersons = [
  {
    id: 'rp-1',
    full_name: 'Usthad Mahroof Hudawi',
    phone: '9847012345',
    password: 'password123',
    email: 'mahroof.hudawi@cpet.dhiu.in',
    qualification: 'M.A. Islamic Studies, DHIU Alumni (2018)',
    bank_account_details: 'SBI Chemmad — A/C 38291048291, IFSC: SBIN0070188',
    status: 'ACTIVE'
  },
  {
    id: 'rp-2',
    full_name: 'Usthad Bilal Hudawi',
    phone: '9847123456',
    password: 'password123',
    email: 'bilal.hudawi@cpet.dhiu.in',
    qualification: 'M.Ed, DHIU Alumni (2016)',
    bank_account_details: 'Federal Bank — A/C 10928374619, IFSC: FDRL0001402',
    status: 'ACTIVE'
  },
  {
    id: 'rp-3',
    full_name: 'Dr. Anas Hudawi',
    phone: '9847234567',
    password: 'password123',
    email: 'anas.hudawi@cpet.dhiu.in',
    qualification: 'Ph.D. Counseling Psychology, DHIU Alumni',
    bank_account_details: 'Canara Bank — A/C 48201948201, IFSC: CNRB0002849',
    status: 'ACTIVE'
  }
];

export const initialStudents = [
  {
    account_phone: '9895112233',
    whatsapp_number: '9895112233',
    members: [
      {
        id: 'prof-1',
        full_name: 'Muhammed Ameen',
        gender: 'MALE',
        date_of_birth: '2008-04-12',
        relationship: 'Self / Son',
        place: 'Tanur',
        district: 'Malappuram'
      },
      {
        id: 'prof-2',
        full_name: 'Khadija Beevi',
        gender: 'FEMALE',
        date_of_birth: '1982-08-20',
        relationship: 'Mother',
        place: 'Tanur',
        district: 'Malappuram'
      }
    ]
  },
  {
    account_phone: '9744556677',
    whatsapp_number: '9744556677',
    members: [
      {
        id: 'prof-3',
        full_name: 'Aysha Mariyam',
        gender: 'FEMALE',
        date_of_birth: '2002-11-05',
        relationship: 'Self',
        place: 'Feroke',
        district: 'Kozhikode'
      }
    ]
  },
  {
    account_phone: '9496118899',
    whatsapp_number: '9496118899',
    members: [
      {
        id: 'prof-4',
        full_name: 'Zainudheen Master',
        gender: 'MALE',
        date_of_birth: '1988-06-15',
        relationship: 'Self / Father',
        place: 'Taliparamba',
        district: 'Kannur'
      },
      {
        id: 'prof-5',
        full_name: 'Nihad Zain',
        gender: 'MALE',
        date_of_birth: '2010-02-10',
        relationship: 'Son',
        place: 'Taliparamba',
        district: 'Kannur'
      }
    ]
  }
];

export const initialEnrollments = [
  {
    id: 'enr-1',
    account_phone: '9895112233',
    student_profile_id: 'prof-1',
    student_name: 'Muhammed Ameen',
    course_id: 'mhl-tfc-26',
    course_title: 'Tharbiyya Family Course',
    centre_id: 'mhl-mlp-001',
    centre_name: 'Bafakhy Thangal Memorial Mahallu Study Centre',
    admission_number: 'CPET-TFC-26-0001',
    enrollment_date: '2026-09-01',
    fee_status: 'PAID_TO_RP',
    amount_paid: 1500,
    completion_status: 'IN_PROGRESS',
    classes_attended: 8,
    marks: {
      'sub-1': 88,
      'sub-2': 92,
      'sub-3': 85
    },
    custom_responses: {}
  },
  {
    id: 'enr-2',
    account_phone: '9895112233',
    student_profile_id: 'prof-1',
    student_name: 'Muhammed Ameen',
    course_id: 'gen-camp-lead-26',
    course_title: 'Residential Youth Leadership Camp 2026',
    centre_id: null,
    centre_name: 'Darul Huda Campus, Chemmad',
    admission_number: 'CPET-CAMP-26-0014',
    enrollment_date: '2026-09-15',
    fee_status: 'OFFICE_CONFIRMED',
    amount_paid: 2500,
    completion_status: 'IN_PROGRESS',
    classes_attended: 0,
    marks: {},
    custom_responses: {
      'q4': 'Standard Non-Veg (Chicken/Meat)',
      'q5': 'L (Large)',
      'q6': 'None'
    }
  },
  {
    id: 'enr-3',
    account_phone: '9895112233',
    student_profile_id: 'prof-2',
    student_name: 'Khadija Beevi',
    course_id: 'gen-web-parent-26',
    course_title: 'Free Community Parenting Webinar',
    centre_id: null,
    centre_name: 'Online Zoom Session',
    admission_number: 'CPET-WEB-26-0089',
    enrollment_date: '2026-08-20',
    fee_status: 'FREE',
    amount_paid: 0,
    completion_status: 'COMPLETED',
    classes_attended: 1,
    marks: {},
    custom_responses: {
      'q10': '2-3 Children',
      'q11': 'Tanur'
    }
  },
  {
    id: 'enr-4',
    account_phone: '9744556677',
    student_profile_id: 'prof-3',
    student_name: 'Aysha Mariyam',
    course_id: 'gen-dip-psych-26',
    course_title: 'Diploma in Islamic Psychology & Counseling',
    centre_id: null,
    centre_name: 'Online Academic Portal',
    admission_number: 'CPET-DIP-26-0005',
    enrollment_date: '2026-09-10',
    fee_status: 'OFFICE_CONFIRMED',
    amount_paid: 6000,
    completion_status: 'IN_PROGRESS',
    classes_attended: 14,
    marks: {
      'sub-6': 84
    },
    custom_responses: {
      'q1': 'Bachelor Degree',
      'q2': 'Farook College, Kozhikode',
      'q3': 'Aspire to serve as a community family counselor in Mahallu units.'
    }
  },
  {
    id: 'enr-5',
    account_phone: '9496118899',
    student_profile_id: 'prof-4',
    student_name: 'Zainudheen Master',
    course_id: 'gen-work-teach-26',
    course_title: 'Teachers Training Workshop (1-Day Masterclass)',
    centre_id: null,
    centre_name: 'CPET Seminar Hall, Chemmad',
    admission_number: 'CPET-WRK-26-0031',
    enrollment_date: '2026-09-25',
    fee_status: 'PAID_ON_SPOT',
    amount_paid: 400,
    completion_status: 'COMPLETED',
    classes_attended: 1,
    marks: {},
    custom_responses: {
      'q7': 'Sirajul Huda English School',
      'q8': 7,
      'q9': ['Islamic Studies', 'Language / Arabic']
    }
  },
  {
    id: 'enr-6',
    account_phone: '9496118899',
    student_profile_id: 'prof-5',
    student_name: 'Nihad Zain',
    course_id: 'mhl-ycb-26',
    course_title: 'Weekend Youth Character Building',
    centre_id: 'mhl-knr-003',
    centre_name: 'Al-Huda Mahallu Centre',
    admission_number: 'CPET-YCB-26-0022',
    enrollment_date: '2026-09-05',
    fee_status: 'PAID_TO_RP',
    amount_paid: 500,
    completion_status: 'COMPLETED',
    classes_attended: 4,
    marks: {},
    custom_responses: {}
  }
];

export const initialClassLogs = [
  {
    id: 'log-1',
    rp_id: 'rp-1',
    rp_name: 'Usthad Mahroof Hudawi',
    centre_id: 'mhl-mlp-001',
    centre_name: 'Bafakhy Thangal Memorial Mahallu Study Centre',
    course_id: 'mhl-tfc-26',
    course_title: 'Tharbiyya Family Course',
    class_date: '2026-09-28',
    session_type: 'REGULAR_CLASS',
    hours_spent: 2.0,
    syllabus_covered: 'Fiqh of Marriage: Nikah essentials, mutual rights & responsibilities',
    standard_rate: 800,
    travel_allowance: 200,
    total_claim: 1000,
    status: 'VERIFIED_BY_ADMIN',
    admin_notes: 'Approved standard claim'
  },
  {
    id: 'log-2',
    rp_id: 'rp-1',
    rp_name: 'Usthad Mahroof Hudawi',
    centre_id: 'mhl-kkd-002',
    centre_name: 'Noorul Islam Jama\'ath Centre',
    course_id: 'mhl-tfc-26',
    course_title: 'Tharbiyya Family Course',
    class_date: '2026-10-01',
    session_type: 'REGULAR_CLASS',
    hours_spent: 2.0,
    syllabus_covered: 'Child Development Stages & Constructive Parenting Habits',
    standard_rate: 800,
    travel_allowance: 300,
    total_claim: 1100,
    status: 'SUBMITTED',
    admin_notes: ''
  },
  {
    id: 'log-3',
    rp_id: 'rp-1',
    rp_name: 'Usthad Mahroof Hudawi',
    centre_id: 'mhl-mlp-001',
    centre_name: 'Bafakhy Thangal Memorial Mahallu Study Centre',
    course_id: 'mhl-tfc-26',
    course_title: 'Tharbiyya Family Course',
    class_date: '2026-10-04',
    session_type: 'EXAM',
    hours_spent: 2.0,
    syllabus_covered: 'Subject 1 Evaluation Written Exam & viva review',
    standard_rate: 800,
    travel_allowance: 200,
    total_claim: 1000,
    status: 'SUBMITTED',
    admin_notes: ''
  },
  {
    id: 'log-4',
    rp_id: 'rp-2',
    rp_name: 'Usthad Bilal Hudawi',
    centre_id: 'mhl-knr-003',
    centre_name: 'Al-Huda Mahallu Centre',
    course_id: 'mhl-ycb-26',
    course_title: 'Weekend Youth Character Building',
    class_date: '2026-10-03',
    session_type: 'REGULAR_CLASS',
    hours_spent: 2.5,
    syllabus_covered: 'Module 1: Youth Mindset, Digital Detox & Islamic Identity',
    standard_rate: 1000,
    travel_allowance: 150,
    total_claim: 1150,
    status: 'VERIFIED_BY_ADMIN',
    admin_notes: 'Approved'
  }
];

export const initialRemittances = [
  {
    id: 'rem-1',
    rp_id: 'rp-1',
    rp_name: 'Usthad Mahroof Hudawi',
    centre_id: 'mhl-mlp-001',
    centre_name: 'Bafakhy Thangal Memorial Mahallu Study Centre',
    amount: 15000,
    payment_mode: 'BANK_TRANSFER',
    transaction_ref: 'SBIN0049281928',
    remittance_date: '2026-09-30',
    status: 'CONFIRMED_BY_OFFICE',
    student_count: 10,
    notes: 'Tanur batch September first installment fee collected'
  },
  {
    id: 'rem-2',
    rp_id: 'rp-1',
    rp_name: 'Usthad Mahroof Hudawi',
    centre_id: 'mhl-kkd-002',
    centre_name: 'Noorul Islam Jama\'ath Centre',
    amount: 9000,
    payment_mode: 'UPI',
    transaction_ref: 'UPI/492810482910',
    remittance_date: '2026-10-02',
    status: 'PENDING_VERIFICATION',
    student_count: 6,
    notes: 'Feroke centre batch enrollment collection'
  }
];

export const initialPayouts = [
  {
    id: 'pay-1',
    rp_id: 'rp-2',
    rp_name: 'Usthad Bilal Hudawi',
    billing_month: '2026-09',
    classes_count: 4,
    total_wages: 4000,
    total_travel_allowance: 600,
    final_payout_amount: 4600,
    payment_mode: 'BANK_TRANSFER',
    transaction_ref: 'UTR9384729104',
    disbursed_at: '2026-10-02',
    status: 'DISBURSED'
  }
];
