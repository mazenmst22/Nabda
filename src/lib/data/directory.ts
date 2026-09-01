import type { IconName } from "@/components/ui/icon";
import type { AppLocale } from "@/i18n/routing";
import type { Clinic, DaySlots, Doctor, Specialty } from "@/lib/schemas";

type Localized = { ar: string; en: string };

const specialtyRows: Array<Specialty & { icon: IconName }> = [
  { key: "cardiology", nameAr: "قلب وأوعية", nameEn: "Cardiology", icon: "heart" },
  { key: "paediatrics", nameAr: "أطفال", nameEn: "Paediatrics", icon: "child" },
  { key: "dermatology", nameAr: "جلدية", nameEn: "Dermatology", icon: "spark" },
  { key: "orthopaedics", nameAr: "عظام", nameEn: "Orthopaedics", icon: "bone" },
  { key: "dentistry", nameAr: "أسنان", nameEn: "Dentistry", icon: "tooth" },
  { key: "ent", nameAr: "أنف وأذن", nameEn: "ENT", icon: "ear" },
  { key: "ophthalmology", nameAr: "عيون", nameEn: "Ophthalmology", icon: "eye" },
  { key: "internal", nameAr: "باطنة", nameEn: "Internal medicine", icon: "plus" },
];

export const directorySpecialties: Specialty[] = specialtyRows.map(({ key, nameAr, nameEn }) => ({
  key,
  nameAr,
  nameEn,
}));

export const specialtyIcons = Object.fromEntries(
  specialtyRows.map(({ key, icon }) => [key, icon]),
) as Record<string, IconName>;

const weeklyHours: Clinic["hours"] = [
  { day: "saturday", periods: [{ open: "09:00", close: "21:00" }] },
  { day: "sunday", periods: [{ open: "09:00", close: "21:00" }] },
  { day: "monday", periods: [{ open: "09:00", close: "21:00" }] },
  { day: "tuesday", periods: [{ open: "09:00", close: "21:00" }] },
  { day: "wednesday", periods: [{ open: "09:00", close: "21:00" }] },
  { day: "thursday", periods: [{ open: "09:00", close: "18:00" }] },
  { day: "friday", periods: [] },
];

const clinicRows: Array<Clinic & { districtEn: string; addressEn: string }> = [
  {
    id: "clinic-maadi",
    slug: "andalusia-maadi",
    nameAr: "عيادات أندلسية",
    nameEn: "Andalusia Clinics",
    city: "Cairo",
    district: "المعادي",
    districtEn: "Maadi",
    address: "شارع النصر، المعادي الجديدة",
    addressEn: "Al Nasr Street, New Maadi",
    phone: "+20225200001",
    hours: weeklyHours,
    theme: { accent: "var(--brand-lapis)" },
  },
  {
    id: "clinic-heliopolis",
    slug: "meridian-heliopolis",
    nameAr: "عيادات ميريديان",
    nameEn: "Meridian Clinics",
    city: "Cairo",
    district: "مصر الجديدة",
    districtEn: "Heliopolis",
    address: "شارع بيروت، مصر الجديدة",
    addressEn: "Beirut Street, Heliopolis",
    phone: "+20224100002",
    hours: weeklyHours,
    theme: { accent: "var(--brand-carnelian)" },
  },
  {
    id: "clinic-dokki",
    slug: "nile-dokki",
    nameAr: "عيادات النيل",
    nameEn: "Nile Clinics",
    city: "Giza",
    district: "الدقي",
    districtEn: "Dokki",
    address: "شارع التحرير، الدقي",
    addressEn: "Tahrir Street, Dokki",
    phone: "+20233300003",
    hours: weeklyHours,
    theme: { accent: "var(--brand-teal)" },
  },
  {
    id: "clinic-mohandessin",
    slug: "safwa-mohandessin",
    nameAr: "عيادات الصفوة",
    nameEn: "Al Safwa Clinics",
    city: "Giza",
    district: "المهندسين",
    districtEn: "Mohandessin",
    address: "شارع شهاب، المهندسين",
    addressEn: "Shehab Street, Mohandessin",
    phone: "+20233400004",
    hours: weeklyHours,
    theme: { accent: "var(--brand-gold-deep)" },
  },
  {
    id: "clinic-nasr-city",
    slug: "cairo-medical",
    nameAr: "مركز كايرو الطبي",
    nameEn: "Cairo Medical Centre",
    city: "Cairo",
    district: "مدينة نصر",
    districtEn: "Nasr City",
    address: "شارع عباس العقاد، مدينة نصر",
    addressEn: "Abbas El Akkad Street, Nasr City",
    phone: "+20222700005",
    hours: weeklyHours,
    theme: { accent: "var(--brand-lapis)" },
  },
  {
    id: "clinic-sheikh-zayed",
    slug: "zayed-specialty",
    nameAr: "عيادات زايد التخصصية",
    nameEn: "Zayed Specialty Clinics",
    city: "Giza",
    district: "الشيخ زايد",
    districtEn: "Sheikh Zayed",
    address: "المحور المركزي، الشيخ زايد",
    addressEn: "Central Axis, Sheikh Zayed",
    phone: "+20238500006",
    hours: weeklyHours,
    theme: { accent: "var(--brand-teal)" },
  },
];

export const directoryClinics: Clinic[] = clinicRows.map((clinic) => ({
  id: clinic.id,
  slug: clinic.slug,
  nameAr: clinic.nameAr,
  nameEn: clinic.nameEn,
  city: clinic.city,
  district: clinic.district,
  address: clinic.address,
  phone: clinic.phone,
  hours: clinic.hours,
  theme: clinic.theme,
}));

const clinicEnglish = Object.fromEntries(
  clinicRows.map((clinic) => [
    clinic.id,
    { district: clinic.districtEn, address: clinic.addressEn },
  ]),
) as Record<string, { district: string; address: string }>;

const hour = 60 * 60 * 1000;
type DoctorSeed = Omit<Doctor, "nextAvailable"> & { nextOffsetHours: number };

const doctorSeeds: DoctorSeed[] = [
  {
    id: "dr-mariam-fouad",
    slug: "mariam-fouad",
    nameAr: "د. مريم فؤاد",
    nameEn: "Dr Mariam Fouad",
    title: "consultant",
    specialties: ["cardiology"],
    subSpecialties: ["catheterisation", "hypertension"],
    gender: "female",
    clinicId: "clinic-maadi",
    rating: { average: 4.9, count: 128 },
    fee: { amount: 450, currency: "EGP" },
    acceptsOnlinePayment: true,
    bio: "cardiology_follow_up",
    nextOffsetHours: 1,
  },
  {
    id: "dr-omar-el-shazly",
    slug: "omar-el-shazly",
    nameAr: "د. عمر الشاذلي",
    nameEn: "Dr Omar El Shazly",
    title: "consultant",
    specialties: ["internal"],
    subSpecialties: ["gastroenterology"],
    gender: "male",
    clinicId: "clinic-heliopolis",
    rating: { average: 4.8, count: 94 },
    fee: { amount: 520, currency: "EGP" },
    acceptsOnlinePayment: false,
    bio: "internal_follow_up",
    nextOffsetHours: 2,
  },
  {
    id: "dr-farida-hassan",
    slug: "farida-hassan",
    nameAr: "د. فريدة حسن",
    nameEn: "Dr Farida Hassan",
    title: "consultant",
    specialties: ["paediatrics"],
    subSpecialties: ["neonatology"],
    gender: "female",
    clinicId: "clinic-dokki",
    rating: { average: 4.9, count: 211 },
    fee: { amount: 400, currency: "EGP" },
    acceptsOnlinePayment: true,
    bio: "paediatrics_follow_up",
    nextOffsetHours: 3,
  },
  {
    id: "dr-youssef-adly",
    slug: "youssef-adly",
    nameAr: "د. يوسف عدلي",
    nameEn: "Dr Youssef Adly",
    title: "lecturer",
    specialties: ["ent"],
    subSpecialties: ["sinus"],
    gender: "male",
    clinicId: "clinic-mohandessin",
    rating: { average: 4.6, count: 58 },
    fee: { amount: 350, currency: "EGP" },
    acceptsOnlinePayment: false,
    bio: "ent_follow_up",
    nextOffsetHours: 20,
  },
  {
    id: "dr-karim-mansour",
    slug: "karim-mansour",
    nameAr: "د. كريم منصور",
    nameEn: "Dr Karim Mansour",
    title: "professor",
    specialties: ["orthopaedics"],
    subSpecialties: ["joint_surgery"],
    gender: "male",
    clinicId: "clinic-nasr-city",
    rating: { average: 4.7, count: 76 },
    fee: { amount: 650, currency: "EGP" },
    acceptsOnlinePayment: false,
    bio: "orthopaedics_follow_up",
    nextOffsetHours: 22,
  },
  {
    id: "dr-salma-nassar",
    slug: "salma-nassar",
    nameAr: "د. سلمى نصار",
    nameEn: "Dr Salma Nassar",
    title: "consultant",
    specialties: ["dermatology"],
    subSpecialties: ["laser"],
    gender: "female",
    clinicId: "clinic-sheikh-zayed",
    rating: { average: 4.8, count: 163 },
    fee: { amount: 700, currency: "EGP" },
    acceptsOnlinePayment: true,
    bio: "dermatology_follow_up",
    nextOffsetHours: 24,
  },
  {
    id: "dr-laila-hamdy",
    slug: "laila-hamdy",
    nameAr: "د. ليلى حمدي",
    nameEn: "Dr Laila Hamdy",
    title: "consultant",
    specialties: ["ophthalmology"],
    subSpecialties: ["retina"],
    gender: "female",
    clinicId: "clinic-maadi",
    rating: { average: 4.9, count: 241 },
    fee: { amount: 900, currency: "EGP" },
    acceptsOnlinePayment: true,
    bio: "ophthalmology_follow_up",
    nextOffsetHours: 26,
  },
  {
    id: "dr-ahmed-tarek",
    slug: "ahmed-tarek",
    nameAr: "د. أحمد طارق",
    nameEn: "Dr Ahmed Tarek",
    title: "specialist",
    specialties: ["dentistry"],
    subSpecialties: ["restorative_dentistry"],
    gender: "male",
    clinicId: "clinic-dokki",
    rating: { average: 4.5, count: 47 },
    fee: { amount: 250, currency: "EGP" },
    acceptsOnlinePayment: false,
    bio: "dentistry_follow_up",
    nextOffsetHours: 28,
  },
];

export function getDirectoryDoctors(referenceTime = Date.now()) {
  const liveBase = referenceTime + hour;
  return doctorSeeds.map(({ nextOffsetHours, ...doctor }): Doctor => ({
    ...doctor,
    nextAvailable: new Date(liveBase + nextOffsetHours * hour).toISOString(),
  }));
}

export const directoryDoctors = getDirectoryDoctors();

const titleLabels: Record<string, Localized> = {
  consultant: { ar: "استشاري", en: "Consultant" },
  professor: { ar: "أستاذ", en: "Professor" },
  lecturer: { ar: "مدرس", en: "Lecturer" },
  specialist: { ar: "أخصائي", en: "Specialist" },
};

const subSpecialtyLabels: Record<string, Localized> = {
  catheterisation: { ar: "قسطرة القلب", en: "Cardiac catheterisation" },
  hypertension: { ar: "ضغط الدم", en: "Hypertension" },
  gastroenterology: { ar: "جهاز هضمي", en: "Gastroenterology" },
  neonatology: { ar: "حديثو الولادة", en: "Neonatology" },
  sinus: { ar: "الجيوب الأنفية", en: "Sinus care" },
  joint_surgery: { ar: "جراحة المفاصل", en: "Joint surgery" },
  laser: { ar: "ليزر علاجي", en: "Medical laser" },
  retina: { ar: "الشبكية", en: "Retina" },
  restorative_dentistry: { ar: "علاج تحفظي", en: "Restorative dentistry" },
};

const bios: Record<string, Localized> = {
  cardiology_follow_up: {
    ar: "متخصصة في متابعة أمراض القلب وضغط الدم واضطراب النبض، مع شرح واضح لخطة المتابعة.",
    en: "Specialises in heart disease, blood pressure, and rhythm follow-up with a clearly explained care plan.",
  },
  internal_follow_up: {
    ar: "متابعة أمراض الباطنة والجهاز الهضمي بخطة علاج واضحة.",
    en: "Internal medicine and digestive care with a clear follow-up plan.",
  },
  paediatrics_follow_up: {
    ar: "متابعة الأطفال وحديثي الولادة مع إرشادات واضحة للأسرة.",
    en: "Paediatric and newborn follow-up with clear guidance for families.",
  },
  ent_follow_up: {
    ar: "تشخيص ومتابعة أمراض الأنف والأذن والجيوب الأنفية.",
    en: "Diagnosis and follow-up for ear, nose, throat, and sinus conditions.",
  },
  orthopaedics_follow_up: {
    ar: "متابعة إصابات العظام والمفاصل وخطط التأهيل.",
    en: "Orthopaedic, joint injury, and rehabilitation follow-up.",
  },
  dermatology_follow_up: {
    ar: "متابعة الأمراض الجلدية والعلاجات الطبية بالليزر.",
    en: "Dermatology follow-up and medically indicated laser treatment.",
  },
  ophthalmology_follow_up: {
    ar: "فحوصات العيون ومتابعة أمراض الشبكية.",
    en: "Eye examinations and retina follow-up.",
  },
  dentistry_follow_up: {
    ar: "علاج الأسنان التحفظي وخطط الوقاية والمتابعة.",
    en: "Restorative dental care with prevention and follow-up plans.",
  },
};

export function localizedSpecialty(key: string, locale: AppLocale) {
  const specialty = directorySpecialties.find((item) => item.key === key);
  return locale === "ar" ? (specialty?.nameAr ?? key) : (specialty?.nameEn ?? key);
}

export function localizedTitle(key: string, locale: AppLocale) {
  return titleLabels[key]?.[locale] ?? key;
}

export function localizedSubSpecialty(key: string, locale: AppLocale) {
  return subSpecialtyLabels[key]?.[locale] ?? key;
}

export function localizedBio(key: string, locale: AppLocale) {
  return bios[key]?.[locale] ?? key;
}

export function clinicForDoctor(doctor: Doctor) {
  return directoryClinics.find((clinic) => clinic.id === doctor.clinicId);
}

export function localizedClinicDistrict(clinic: Clinic, locale: AppLocale) {
  return locale === "ar"
    ? clinic.district
    : (clinicEnglish[clinic.id]?.district ?? clinic.district);
}

export function localizedClinicAddress(clinic: Clinic, locale: AppLocale) {
  return locale === "ar" ? clinic.address : (clinicEnglish[clinic.id]?.address ?? clinic.address);
}

export function availabilityForDoctor(
  doctorId: string,
  doctors = getDirectoryDoctors(),
): DaySlots[] {
  const doctor = doctors.find((item) => item.id === doctorId);
  if (!doctor?.nextAvailable) return [];
  const first = new Date(doctor.nextAvailable);
  const slots = Array.from({ length: 5 }, (_, index) => {
    const start = new Date(first.getTime() + index * 30 * 60 * 1000);
    return {
      start: start.toISOString(),
      end: new Date(start.getTime() + 30 * 60 * 1000).toISOString(),
      available: index !== 2,
    };
  });
  return [{ date: first.toISOString().slice(0, 10), slots }];
}
