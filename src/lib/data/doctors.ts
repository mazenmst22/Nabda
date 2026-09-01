export type Doctor = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
  specialtyAr: string;
  specialtyEn: string;
  districtAr: string;
  districtEn: string;
  clinicAr: string;
  clinicEn: string;
  fee: number;
  rating: number;
  reviews: number;
  nextSlot: string;
  day: "today" | "tomorrow";
  gender: "female" | "male";
  onlinePayment: boolean;
  initialsAr: string;
  initialsEn: string;
};

export const doctors: Doctor[] = [
  {
    id: "dr-mariam-fouad",
    slug: "mariam-fouad",
    nameAr: "د. مريم فؤاد",
    nameEn: "Dr Mariam Fouad",
    titleAr: "استشاري أمراض القلب والقسطرة",
    titleEn: "Consultant of Cardiology & Catheterisation",
    specialtyAr: "قلب وأوعية دموية",
    specialtyEn: "Cardiology",
    districtAr: "المعادي",
    districtEn: "Maadi",
    clinicAr: "عيادات أندلسية",
    clinicEn: "Andalusia Clinics",
    fee: 450,
    rating: 4.9,
    reviews: 128,
    nextSlot: "18:30",
    day: "today",
    gender: "female",
    onlinePayment: true,
    initialsAr: "م ف",
    initialsEn: "MF",
  },
  {
    id: "dr-omar-el-shazly",
    slug: "omar-el-shazly",
    nameAr: "د. عمر الشاذلي",
    nameEn: "Dr Omar El Shazly",
    titleAr: "استشاري الباطنة والجهاز الهضمي",
    titleEn: "Consultant of Internal Medicine & Gastroenterology",
    specialtyAr: "باطنة وجهاز هضمي",
    specialtyEn: "Internal Medicine",
    districtAr: "مصر الجديدة",
    districtEn: "Heliopolis",
    clinicAr: "عيادات ميريديان",
    clinicEn: "Meridian Clinics",
    fee: 520,
    rating: 4.8,
    reviews: 94,
    nextSlot: "19:15",
    day: "today",
    gender: "male",
    onlinePayment: false,
    initialsAr: "ع ش",
    initialsEn: "OS",
  },
  {
    id: "dr-farida-hassan",
    slug: "farida-hassan",
    nameAr: "د. فريدة حسن",
    nameEn: "Dr Farida Hassan",
    titleAr: "استشاري الأطفال وحديثي الولادة",
    titleEn: "Consultant of Paediatrics & Neonatology",
    specialtyAr: "أطفال وحديثي الولادة",
    specialtyEn: "Paediatrics",
    districtAr: "الدقي",
    districtEn: "Dokki",
    clinicAr: "عيادات النيل",
    clinicEn: "Nile Clinics",
    fee: 400,
    rating: 4.9,
    reviews: 211,
    nextSlot: "20:00",
    day: "today",
    gender: "female",
    onlinePayment: true,
    initialsAr: "ف ح",
    initialsEn: "FH",
  },
  {
    id: "dr-karim-mansour",
    slug: "karim-mansour",
    nameAr: "د. كريم منصور",
    nameEn: "Dr Karim Mansour",
    titleAr: "أستاذ جراحة العظام والمفاصل",
    titleEn: "Professor of Orthopaedic Surgery",
    specialtyAr: "عظام ومفاصل",
    specialtyEn: "Orthopaedics",
    districtAr: "مدينة نصر",
    districtEn: "Nasr City",
    clinicAr: "مركز كايرو الطبي",
    clinicEn: "Cairo Medical Centre",
    fee: 650,
    rating: 4.7,
    reviews: 76,
    nextSlot: "10:30",
    day: "tomorrow",
    gender: "male",
    onlinePayment: false,
    initialsAr: "ك م",
    initialsEn: "KM",
  },
  {
    id: "dr-salma-nassar",
    slug: "salma-nassar",
    nameAr: "د. سلمى نصار",
    nameEn: "Dr Salma Nassar",
    titleAr: "استشاري الجلدية والتجميل والليزر",
    titleEn: "Consultant of Dermatology & Laser",
    specialtyAr: "جلدية",
    specialtyEn: "Dermatology",
    districtAr: "الشيخ زايد",
    districtEn: "Sheikh Zayed",
    clinicAr: "عيادات زايد التخصصية",
    clinicEn: "Zayed Specialty Clinics",
    fee: 700,
    rating: 4.8,
    reviews: 163,
    nextSlot: "13:00",
    day: "tomorrow",
    gender: "female",
    onlinePayment: true,
    initialsAr: "س ن",
    initialsEn: "SN",
  },
  {
    id: "dr-youssef-adly",
    slug: "youssef-adly",
    nameAr: "د. يوسف عدلي",
    nameEn: "Dr Youssef Adly",
    titleAr: "مدرس الأنف والأذن والحنجرة",
    titleEn: "Lecturer of ENT",
    specialtyAr: "أنف وأذن وحنجرة",
    specialtyEn: "ENT",
    districtAr: "المهندسين",
    districtEn: "Mohandessin",
    clinicAr: "عيادات الصفوة",
    clinicEn: "Al Safwa Clinics",
    fee: 350,
    rating: 4.6,
    reviews: 58,
    nextSlot: "16:45",
    day: "tomorrow",
    gender: "male",
    onlinePayment: false,
    initialsAr: "ي ع",
    initialsEn: "YA",
  },
];

export const specialties = [
  { key: "cardiology", ar: "قلب وأوعية", en: "Cardiology", icon: "heart" },
  { key: "paediatrics", ar: "أطفال", en: "Paediatrics", icon: "child" },
  { key: "dermatology", ar: "جلدية", en: "Dermatology", icon: "spark" },
  { key: "orthopaedics", ar: "عظام", en: "Orthopaedics", icon: "bone" },
  { key: "dentistry", ar: "أسنان", en: "Dentistry", icon: "tooth" },
  { key: "ent", ar: "أنف وأذن", en: "ENT", icon: "ear" },
  { key: "ophthalmology", ar: "عيون", en: "Ophthalmology", icon: "eye" },
  { key: "internal", ar: "باطنة", en: "Internal medicine", icon: "plus" },
] as const;
