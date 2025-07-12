import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { z } from "zod";
import type { BookingFormData } from "@/types";
import { ArrowLeft, CheckCircle, IndianRupee, CreditCard, Package, AlertTriangle } from "lucide-react";
import SubscriptionModal from "./SubscriptionModal";
import { useAuth } from "@/hooks/use-auth";

const bookingFormSchema = z.object({
  bookingType: z.enum(['FTL', 'LTL', 'part_load']),
  weight: z.number().optional(),
  distance: z.number().optional(),
  cargoDescription: z.string().optional(),
  itemCount: z.number().min(1, "Item count must be at least 1").default(1),
  vehicleId: z.string().min(1, "Please select a vehicle"),
  pickupAddress: z.string().min(1, "Pickup address is required"),
  pickupCity: z.string().min(1, "Pickup city is required"),
  pickupPinCode: z.string().min(6, "Valid PIN code is required"),
  pickupDateTime: z.string().min(1, "Pickup date and time is required"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  deliveryCity: z.string().min(1, "Delivery city is required"),
  deliveryPinCode: z.string().min(6, "Valid PIN code is required"),
  deliveryDateTime: z.string().optional(),
  senderName: z.string().min(1, "Sender name is required"),
  senderCompany: z.string().optional(),
  senderPhone: z.string().min(10, "Valid phone number is required"),
  senderEmail: z.string().optional(),
  senderGST: z.string().optional(),
  receiverName: z.string().min(1, "Receiver name is required"),
  receiverCompany: z.string().optional(),
  receiverPhone: z.string().min(10, "Valid phone number is required"),
  receiverEmail: z.string().optional(),
  receiverGST: z.string().optional(),
  handlingCharges: z.number().min(0, "Handling charges cannot be negative").optional(),
  paymentMethod: z.enum(["cash", "online", "pending", "free"]).default("pending"),
  paymentStatus: z.enum(["paid", "pending", "failed", "free"]).default("pending"),
  paidAmount: z.number().min(0, "Paid amount cannot be negative").default(0),
  transactionId: z.string().optional(),
  paymentNotes: z.string().optional()
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated?: (booking: any) => void;
}

function BookingModal({ isOpen, onClose, onBookingCreated }: BookingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Two-step process state
  const [step, setStep] = useState<'booking' | 'payment'>('booking');
  const [bookingData, setBookingData] = useState<any>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Calculate trial days remaining
  const trialDaysRemaining = user?.trialStartDate ? 
    Math.max(0, 14 - Math.floor((Date.now() - new Date(user.trialStartDate).getTime()) / (1000 * 60 * 60 * 24))) : 14;
  
  const [pricing, setPricing] = useState({
    baseRate: 0,
    gstAmount: 0,
    totalAmount: 0
  });

  const [useAutoRate, setUseAutoRate] = useState(false);
  const [baseRatePerKm, setBaseRatePerKm] = useState(12);

  // Fetch available vehicles
  const { data: vehicles } = useQuery({
    queryKey: ["/api/vehicles"],
  });

  // Fetch recent bookings to auto-fill receiver GST from last booking
  const { data: recentBookings } = useQuery({
    queryKey: ["/api/bookings/recent"],
  });

  // Auto-fetch pin code based on city - Comprehensive Indian database
  const fetchPinCode = async (city: string) => {
    if (!city) return '';

    try {
      const indianCityPinCodes: { [key: string]: string } = {
        // Major Metro Cities
        'mumbai': '400001', 'delhi': '110001', 'bangalore': '560001', 'hyderabad': '500001',
        'chennai': '600001', 'kolkata': '700001', 'pune': '411001', 'ahmedabad': '380001',
        
        // State Capitals & Major Cities
        'jaipur': '302001', 'lucknow': '226001', 'bhopal': '462001', 'gandhinagar': '382010',
        'chandigarh': '160001', 'shimla': '171001', 'srinagar': '190001', 'jammu': '180001',
        'dehradun': '248001', 'ranchi': '834001', 'bhubaneswar': '751001', 'raipur': '492001',
        'panaji': '403001', 'thiruvananthapuram': '695001', 'amaravati': '522020', 
        'dispur': '781006', 'patna': '800001', 'gangtok': '737101', 'aizawl': '796001', 
        'kohima': '797001', 'imphal': '795001', 'shillong': '793001', 'agartala': '799001', 
        'itanagar': '791111', 'port blair': '744101',
        
        // Uttar Pradesh Cities & Towns
        'agra': '282001', 'varanasi': '221001', 'meerut': '250001', 'allahabad': '211001',
        'prayagraj': '211001', 'bareilly': '243001', 'aligarh': '202001', 'moradabad': '244001',
        'saharanpur': '247001', 'gorakhpur': '273001', 'firozabad': '283201', 'jhansi': '284001',
        'muzaffarnagar': '251001', 'mathura': '281001', 'etawah': '206001', 'mainpuri': '205001',
        'bulandshahr': '203001', 'rampur': '244901', 'shahjahanpur': '242001', 'hardoi': '241001',
        'sitapur': '261001', 'lakhimpur': '262701', 'faizabad': '224001', 'ayodhya': '224001',
        'sultanpur': '228001', 'pratapgarh': '230001', 'jaunpur': '222001', 'azamgarh': '276001',
        'mau': '275101', 'ghazipur': '233001', 'ballia': '277001', 'deoria': '274001',
        'kushinagar': '274203', 'maharajganj': '273303', 'siddharthnagar': '272207',
        'basti': '272002', 'sant kabir nagar': '272175', 'ambedkar nagar': '224122',
        'farukhabad': '209625', 'kannauj': '209725', 'auraiya': '206122', 'kanpur dehat': '209625',
        'unnao': '209801', 'rae bareli': '229001', 'amethi': '227405', 'banda': '210001',
        'chitrakoot': '210205', 'mahoba': '210427', 'lalitpur': '284403',
        'fatehpur': '212601', 'kaushambi': '212201', 'mirzapur': '231001', 'sonbhadra': '231216',
        'chandauli': '232104', 'bijnor': '246701', 'amroha': '244221', 'sambhal': '244302',
        'bagpat': '250609', 'gautam buddha nagar': '201301', 'hapur': '245101',
        'shamli': '247776', 'hathras': '204101', 'kasganj': '207123', 'shravasti': '271845',
        'bahraich': '271801', 'balrampur': '271201', 'gonda': '271001', 'pilibhit': '262001',
        
        // Madhya Pradesh Cities & Towns
        'indore': '452001', 'gwalior': '474001', 'ujjain': '456001', 'dewas': '455001',
        'ratlam': '457001', 'mandsaur': '458001', 'neemuch': '458441', 'shajapur': '465001',
        'jabalpur': '482001', 'sagar': '470001', 'damoh': '470661', 'katni': '483501',
        'satna': '485001', 'rewa': '486001', 'sidhi': '486661', 'singrauli': '486889',
        'chhindwara': '480001', 'seoni': '480661', 'mandla': '481661', 'dindori': '481880',
        'balaghat': '481001', 'betul': '460001', 'harda': '461331', 'hoshangabad': '461001',
        'vidisha': '464001', 'sehore': '466001', 'raisen': '464551', 'rajgarh': '465661',
        'shahdol': '484001', 'anuppur': '484224', 'umaria': '484661', 'morena': '476001',
        'bhind': '477001', 'datia': '475661', 'shivpuri': '473551', 'guna': '473001',
        'ashoknagar': '473331', 'tikamgarh': '472001', 'chhatarpur': '471001', 'panna': '488001',
        'khandwa': '450001', 'khargone': '451001', 'barwani': '451551', 'dhar': '454001',
        'jhabua': '457661', 'alirajpur': '457887', 'burhanpur': '450331',
        
        // Gujarat Cities & Towns
        'surat': '395001', 'rajkot': '360001', 'vadodara': '390001', 'bhavnagar': '364001',
        'jamnagar': '361001', 'junagadh': '362001', 'anand': '388001', 'bharuch': '392001',
        'mehsana': '384001', 'morbi': '363641', 'surendranagar': '363001', 'navsari': '396445',
        'vapi': '396191', 'patan': '384265', 'palanpur': '385001', 'godhra': '389001',
        'dahod': '389151', 'himmatnagar': '383001', 'nadiad': '387001', 'botad': '364710',
        'amreli': '365601', 'veraval': '362266', 'porbandar': '360575', 'dwarka': '361335',
        'kutch': '370001', 'gandhidham': '370201', 'kandla': '370210', 'bhuj': '370001',
        'valsad': '396001', 'tapi': '394641', 'narmada': '393151', 'kheda': '387411',
        'aravalli': '383205', 'mahisagar': '389230', 'devbhoomi dwarka': '361335',
        'gir somnath': '362520', 'chhota udepur': '391165',
        
        // Maharashtra Cities & Towns
        'nagpur': '440001', 'thane': '400601', 'aurangabad': '431001', 'solapur': '413001',
        'kolhapur': '416001', 'sangli': '416416', 'satara': '415001', 'ahmednagar': '414001',
        'jalgaon': '425001', 'akola': '444001', 'amravati': '444601', 'chandrapur': '442401',
        'dhule': '424001', 'jalna': '431203', 'latur': '413512', 'nanded': '431601',
        'osmanabad': '413501', 'parbhani': '431401', 'yavatmal': '445001', 'wardha': '442001',
        'nashik': '422001', 'beed': '431122', 'hingoli': '431513', 'buldhana': '443001',
        'washim': '444505', 'gondia': '441601', 'gadchiroli': '442605', 'bhandara': '441904',
        'raigad': '402106', 'ratnagiri': '415612', 'sindhudurg': '416606', 'vasai': '401201',
        'kalyan': '421301', 'dombivli': '421201', 'bhiwandi': '421302', 'malegaon': '423203',
        'panvel': '410206', 'mira bhayandar': '401107', 'ichalkaranji': '416115', 'bid': '431122',
        
        // Karnataka Cities & Towns
        'mysore': '570001', 'mysuru': '570001', 'hubli': '580001', 'dharwad': '580001',
        'belgaum': '590001', 'belagavi': '590001', 'mangalore': '575001', 'gulbarga': '585101',
        'kalaburagi': '585101', 'bellary': '583101', 'ballari': '583101', 'bijapur': '586101',
        'vijayapura': '586101', 'shimoga': '577201', 'shivamogga': '577201', 'tumkur': '572101',
        'tumakuru': '572101', 'davangere': '577001', 'chitradurga': '577501', 'hassan': '573201',
        'mandya': '571401', 'raichur': '584101', 'koppal': '583231', 'gadag': '582101',
        'haveri': '581110', 'bagalkot': '587101', 'bidar': '585401', 'yadgir': '585202',
        'kolar': '563101', 'chikkaballapur': '562101', 'bangalore rural': '562157',
        'ramanagara': '562159', 'chamarajanagar': '571313', 'kodagu': '571201',
        'chikkamagaluru': '577101', 'udupi': '576101', 'dakshina kannada': '574142',
        'uttara kannada': '581301',
        
        // Tamil Nadu Cities & Towns
        'salem': '636001', 'tirupur': '641601', 'erode': '638001', 'vellore': '632001',
        'tirunelveli': '627001', 'dindigul': '624001', 'thanjavur': '613001', 'thoothukudi': '628001',
        'kanchipuram': '631501', 'cuddalore': '607001', 'karur': '639001', 'hosur': '635109',
        'nagercoil': '629001', 'kumbakonam': '612001', 'pudukkottai': '622001', 'namakkal': '637001',
        'virudhunagar': '626001', 'sivakasi': '626123', 'ramanathapuram': '623501',
        'theni': '625531', 'krishnagiri': '635001', 'dharmapuri': '636701', 'viluppuram': '605602',
        'tiruvallur': '602001', 'kancheepuram': '631501', 'thiruvallur': '602025',
        'tiruvannamalai': '606601', 'nilgiris': '643001', 'ooty': '643001', 'kodaikanal': '624101',
        'ariyalur': '621704', 'perambalur': '621212', 'tiruchirappalli': '620001',
        'trichy': '620001', 'tiruvarur': '610001', 'nagapattinam': '611001',
        'mayiladuthurai': '609001', 'chengalpattu': '603001', 'ranipet': '631151',
        'tirupathur': '635601', 'kallakurichi': '606202', 'tenkasi': '627811',
        
        // Rajasthan Cities & Towns
        'jodhpur': '342001', 'kota': '324001', 'bikaner': '334001', 'ajmer': '305001',
        'udaipur': '313001', 'bhilwara': '311001', 'alwar': '301001', 'bharatpur': '321001',
        'sikar': '332001', 'pali': '306401', 'tonk': '304001', 'churu': '331001',
        'jhunjhunu': '333001', 'nagaur': '341001', 'barmer': '344001', 'jaisalmer': '345001',
        'ganganagar': '335001', 'hanumangarh': '335512', 'jhalawar': '326001', 'bundi': '323001',
        'sawai madhopur': '322001', 'karauli': '322241', 'dholpur': '328001', 'dausa': '303501',
        'sirohi': '307001', 'jalore': '343001', 'banswara': '327001', 'dungarpur': '314001',
        'rajsamand': '313324', 'chittorgarh': '312001', 'pratapgarh rajasthan': '312605',
        
        // Punjab Cities & Towns
        'ludhiana': '141001', 'amritsar': '143001', 'jalandhar': '144001', 'patiala': '147001',
        'bathinda': '151001', 'mohali': '160055', 'pathankot': '145001', 'hoshiarpur': '146001',
        'batala': '143505', 'moga': '142001', 'abohar': '152116', 'malerkotla': '148023',
        'firozpur': '152002', 'fazilka': '152123', 'muktsar': '152026', 'faridkot': '151203',
        'kapurthala': '144601', 'gurdaspur': '143521', 'tarn taran': '143401', 'barnala': '148101',
        'mansa': '151505', 'sangrur': '148001', 'rupnagar': '140001', 'fatehgarh sahib': '140406',
        'nawanshahr': '144514',
        
        // Haryana Cities & Towns
        'faridabad': '121001', 'gurgaon': '122001', 'gurugram': '122001', 'panipat': '132103',
        'ambala': '134003', 'yamunanagar': '135001', 'rohtak': '124001', 'hisar': '125001',
        'karnal': '132001', 'sonipat': '131001', 'sirsa': '125055', 'bahadurgarh': '124507',
        'jind': '126102', 'thanesar': '132116', 'kaithal': '136027', 'rewari': '123401',
        'mahendragarh': '123029', 'bhiwani': '127021', 'charkhi dadri': '127306',
        'fatehabad': '125050', 'kurukshetra': '136118', 'panchkula': '134109', 'palwal': '121102',
        'mewat': '122103', 'nuh': '122103',
        
        // West Bengal Cities & Towns
        'howrah': '711101', 'durgapur': '713201', 'asansol': '713301', 'siliguri': '734001',
        'malda': '732101', 'bardhaman': '713101', 'barddhaman': '713101', 'kharagpur': '721301',
        'haldia': '721607', 'krishnanagar': '741101', 'raniganj': '713347', 'midnapore': '721101',
        'medinipur': '721101', 'bankura': '722101', 'purulia': '723101', 'birbhum': '731101',
        'murshidabad': '742149', 'nadia': '741101', 'north 24 parganas': '743201',
        'south 24 parganas': '743329', 'hooghly': '712601', 'east burdwan': '713103',
        'west burdwan': '713325', 'paschim medinipur': '721101', 'purba medinipur': '721401',
        'jhargram': '721507', 'kalimpong': '734301', 'darjeeling': '734101',
        'cooch behar': '736101', 'alipurduar': '736121', 'jalpaiguri': '735101',
        'uttar dinajpur': '733201', 'dakshin dinajpur': '733128',
        
        // Other Major States & Cities
        // Andhra Pradesh
        'vijayawada': '520001', 'guntur': '522001', 'nellore': '524001', 'kurnool': '518001',
        'rajahmundry': '533101', 'tirupati': '517501', 'kakinada': '533001', 'anantapur': '515001',
        'chittoor': '517001', 'kadapa': '516001', 'cuddapah': '516001', 'vizianagaram': '535001',
        'srikakulam': '532001', 'east godavari': '533103', 'west godavari': '534101',
        'krishna': '521101', 'prakasam': '523001', 'spsr nellore': '524101',
        
        // Telangana
        'warangal': '506001', 'nizamabad': '503001', 'karimnagar': '505001', 'khammam': '507001',
        'mahbubnagar': '509001', 'adilabad': '504001', 'nalgonda': '508001', 'medak': '502110',
        'rangareddy': '501301', 'sangareddy': '502001', 'mahabubnagar': '509001',
        'suryapet': '508213', 'vikarabad': '501101', 'wanaparthy': '509103',
        'narayanpet': '509210', 'jogulamba gadwal': '509125', 'nagarkurnool': '509209',
        'jayashankar bhupalpally': '506169', 'peddapalli': '505172', 'kamareddy': '503111',
        'rajanna sircilla': '505301', 'bhadradri kothagudem': '507101', 'mahabubabad': '506101',
        'jangaon': '506167', 'asifabad': '504293', 'mancherial': '504208', 'nirmal': '504106',
        'jagtial': '505327', 'yadadri bhuvanagiri': '508126',
        
        // Kerala
        'kochi': '682001', 'kozhikode': '673001', 'calicut': '673001', 'thrissur': '680001',
        'kollam': '691001', 'palakkad': '678001', 'alappuzha': '688001', 'alleppey': '688001',
        'kottayam': '686001', 'kannur': '670001', 'kasaragod': '671121', 'wayanad': '673121',
        'idukki': '685501', 'ernakulam': '682001', 'pathanamthitta': '689645', 'malappuram': '676101',
        'thalassery': '670101', 'manjeri': '676121', 'ponnani': '679586', 'vatakara': '673104',
        'kanhangad': '671315', 'payyanur': '670307',
        
        // Odisha
        'cuttack': '753001', 'rourkela': '769001', 'berhampur': '760001', 'brahmapur': '760001',
        'sambalpur': '768001', 'puri': '752001', 'balasore': '756001', 'bhadrak': '756100',
        'baripada': '757001', 'jharsuguda': '768201', 'jeypore': '764001', 'barbil': '758035',
        'angul': '759122', 'dhenkanal': '759001', 'kendujhar': '758001', 'sundargarh': '770001',
        'mayurbhanj': '757001', 'koraput': '764020', 'malkangiri': '764045', 'rayagada': '765001',
        'gajapati': '761026', 'ganjam': '760001', 'kandhamal': '762001', 'boudh': '762014',
        'sonepur': '767017', 'kalahandi': '766001', 'nuapada': '766105', 'bolangir': '767001',
        'bargarh': '768028', 'nabarangpur': '764058', 'jagatsinghpur': '754103',
        'kendrapara': '754211', 'jajpur': '755019', 'nayagarh': '752069', 'khurda': '752055',
        
        // Assam
        'guwahati': '781001', 'silchar': '788001', 'dibrugarh': '786001', 'jorhat': '785001',
        'nagaon': '782001', 'tinsukia': '786125', 'bongaigaon': '783380', 'karimganj': '788710',
        'tezpur': '784001', 'dhubri': '783301', 'goalpara': '783101', 'kokrajhar': '783370',
        'barpeta': '781301', 'nalbari': '781335', 'kamrup': '781101', 'darrang': '784115',
        'sonitpur': '784001', 'lakhimpur assam': '787001', 'dhemaji': '787057', 'sivasagar': '785640',
        'golaghat': '785621', 'karbi anglong': '782480', 'dima hasao': '788830',
        'cachar': '788001', 'hailakandi': '788801', 'chirang': '783380', 'baksa': '781372',
        'udalguri': '784509', 'south salmara mankachar': '783135', 'west karbi anglong': '782480',
        'biswanath': '784176', 'charaideo': '785690', 'hojai': '782435', 'bajali': '781346',
        'tamulpur': '784189',
        
        // Jharkhand
        'jamshedpur': '831001', 'dhanbad': '826001', 'bokaro': '827001', 'deoghar': '814112',
        'hazaribagh': '825301', 'giridih': '815301', 'ramgarh': '829122', 'medininagar': '822101',
        'palamu': '822101', 'chatra': '825401', 'koderma': '825409', 'gumla': '835207',
        'simdega': '835223', 'lohardaga': '835302', 'khunti': '835210', 'west singhbhum': '833215',
        'seraikela kharsawan': '832401', 'east singhbhum': '831001', 'dumka': '814101',
        'jamtara': '815351', 'sahibganj': '816109', 'pakur': '816107', 'godda': '814133',
        'sahebganj': '816109', 'latehar': '829206', 'garhwa': '822114',
        
        // Chhattisgarh
        'bilaspur': '495001', 'korba': '495677', 'durg': '491001', 'bhilai': '490001',
        'rajnandgaon': '491441', 'jagdalpur': '494001', 'ambikapur': '497001', 'dhamtari': '493773',
        'raigarh': '496001', 'jashpur': '496331', 'korea': '497335', 'surguja': '497001',
        'surajpur': '497229', 'balrampur chhattisgarh': '497119', 'kanker': '494334', 'kondagaon': '494226',
        'narayanpur': '494661', 'bastar': '494001', 'dantewada': '494552', 'sukma': '494111',
        'mahasamund': '493445', 'gariaband': '493889', 'balod': '491226',
        'bemetara': '491335', 'kabirdham': '491995', 'mungeli': '495334', 'janjgir champa': '495668',
        'balodabazar': '493332', 'gaurella pendra marwahi': '495117',
        
        // Uttarakhand
        'haridwar': '249401', 'roorkee': '247667', 'rishikesh': '249201', 'haldwani': '263139',
        'rudrapur': '263153', 'kashipur': '244713', 'kotdwar': '246149', 'tehri': '249001',
        'nainital': '263002', 'almora': '263601', 'pithoragarh': '262501', 'bageshwar': '263642',
        'champawat': '262523', 'rudraprayag': '246171', 'chamoli': '246401', 'uttarkashi': '249193',
        'pauri garhwal': '246001', 'tikri': '249199', 'udhamsing nagar': '263153',
        
        // Himachal Pradesh
        'dharamshala': '176215', 'solan': '173212', 'mandi': '175001', 'kullu': '175101',
        'hamirpur': '177001', 'una': '174303', 'chamba': '176310', 'kangra': '176001',
        'sirmaur': '173001', 'kinnaur': '172108', 'lahaul spiti': '175132',
        
        // Northeast States (Comprehensive)
        'lunglei': '796701', 'dimapur': '797112', 'churachandpur': '795128', 'tura': '794001',
        'dharmanagar': '799250', 'naharlagun': '791110', 'pasighat': '791102', 'bomdila': '790001',
        'tawang': '790104', 'ziro': '791120', 'along': '791001', 'basar': '790002',
        'daporijo': '791122', 'seppa': '790114', 'khonsa': '786151', 'changlang': '786151',
        'namsai': '792103', 'tezu': '792001', 'roing': '792110', 'anini': '792110',
        'yingkiong': '791001', 'hawai': '786151', 'longding': '786171', 'tirap': '786602',
        
        // Union Territories
        'pondicherry': '605001', 'puducherry': '605001', 'karaikal': '609602', 'mahe': '673310',
        'yanam': '533464', 'daman': '396210', 'diu': '362520', 'silvassa': '396230',
        'dadra': '396230', 'nagar haveli': '396230', 'kavaratti': '682555', 'agatti': '682553',
        'minicoy': '682559', 'lakshadweep': '682555', 'leh': '194101', 'kargil': '194103',
        'ladakh': '194101',
        
        // Additional Towns & Villages
        'suthaliya': '494116', 'suthalia': '272002', 'suthauli': '221715', 'suthali': '144514',
        'palai': '686574', 'palia': '262902', 'palampur': '176061',
        'palani': '624601',
        'palakonda': '532440', 'palar': '635853', 'palasa': '532221'
      };
      
      const normalizedCity = city.toLowerCase().trim();
      const pinCode = indianCityPinCodes[normalizedCity] || '';

      return pinCode;
    } catch (error) {

      return '';
    }
  };

  // Get today's date in IST timezone formatted for datetime-local input
  const getTodayDateTimeIST = () => {
    const now = new Date();
    const offset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(now.getTime() + offset);
    
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    const hours = String(istDate.getUTCHours()).padStart(2, '0');
    const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      bookingType: 'FTL',
      weight: 0,
      distance: 0,
      cargoDescription: '',
      itemCount: 1,
      vehicleId: '',
      pickupAddress: '',
      pickupCity: '',
      pickupPinCode: '',
      pickupDateTime: getTodayDateTimeIST(), // Auto-fill with today's date/time in IST
      deliveryAddress: '',
      deliveryCity: '',
      deliveryPinCode: '',
      deliveryDateTime: '',
      senderName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
      senderPhone: user?.phone || '',
      senderEmail: user?.email || '',
      senderGST: user?.gstNumber || '', // Auto-fill from user profile
      receiverName: '',
      receiverPhone: '',
      receiverEmail: '',
      receiverGST: '', // Will be auto-filled based on last booking or manual entry
      handlingCharges: 0,
      paymentMethod: 'pending',
      paymentStatus: 'pending',
      paidAmount: 0,
      transactionId: '',
      paymentNotes: ''
    }
  });

  // Debug user GST data
  useEffect(() => {
    console.log('🔍 User Profile GST Debug:', {
      userGstNumber: user?.gstNumber,
      userEmail: user?.email,
      userFirstName: user?.firstName,
      userLastName: user?.lastName,
      formSenderGST: form.getValues('senderGST'),
      formSenderEmail: form.getValues('senderEmail')
    });
  }, [user, form]);

  // Auto-fill receiver GST from last booking when recent bookings data is available
  useEffect(() => {
    if (recentBookings && Array.isArray(recentBookings) && recentBookings.length > 0) {
      const lastBooking = recentBookings[0]; // Most recent booking
      console.log('🔍 Last booking GST data:', {
        receiverGST: lastBooking?.receiverGST,
        receiverEmail: lastBooking?.receiverEmail,
        currentFormGST: form.getValues('receiverGST')
      });
      
      if (lastBooking?.receiverGST && !form.getValues('receiverGST')) {
        form.setValue('receiverGST', lastBooking.receiverGST);
        console.log('✅ Auto-filled receiver GST:', lastBooking.receiverGST);
      }
      
      // Also auto-fill receiver email if available
      if (lastBooking?.receiverEmail && !form.getValues('receiverEmail')) {
        form.setValue('receiverEmail', lastBooking.receiverEmail);
        console.log('✅ Auto-filled receiver Email:', lastBooking.receiverEmail);
      }
    }
  }, [recentBookings, form]);



  // Step 1: Process booking details (doesn't create booking yet)
  const processBookingDetailsMutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      // Validate and prepare booking data
      const processedData = {
        ...data,
        bookingId: `BK${Date.now()}`,
        status: 'pending_payment',
        createdAt: new Date().toISOString(),
        baseRate: pricing.baseRate,
        gstAmount: pricing.gstAmount,
        totalAmount: pricing.totalAmount,
        isAutoCalculation: useAutoRate,
      };
      return processedData;
    },
    onSuccess: (data) => {
      setBookingData(data);
      setStep('payment');
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to process booking details.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Step 2: Create booking after payment - OPTIMIZED FOR FAST CREATION
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: BookingFormValues) => {
      // ⚡ PERFORMANCE: Pre-calculate all data to minimize server processing
      const timestamp = Date.now();
      const finalBookingData = {
        ...bookingData,
        totalAmount: pricing.totalAmount,
        baseRate: pricing.baseRate,
        gstAmount: pricing.gstAmount,
        estimatedDeliveryDate: new Date(timestamp + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(timestamp).toISOString(),
        trackingNumber: `LGF${timestamp}` // Pre-generate tracking number
      };
      
      // ⚡ PERFORMANCE: Use optimized API request with reduced timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Priority': 'high' // Server priority hint
          },
          body: JSON.stringify(finalBookingData),
          credentials: 'include',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Network error' }));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    onSuccess: (bookingResponse) => {
      // ⚡ PERFORMANCE: Show immediate success, update cache in background
      toast({
        title: "✅ Booking Created",
        description: `Tracking: ${bookingResponse.trackingNumber}`,
        duration: 3000
      });
      
      // ⚡ PERFORMANCE: Close modal immediately, update queries in background
      form.reset();
      setStep('booking');
      setBookingData(null);
      onClose();
      
      // Background cache updates (non-blocking)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/bookings/recent"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      }, 100);
      
      // Trigger callback immediately
      if (onBookingCreated) {
        onBookingCreated(bookingResponse);
      }
    },
    onError: (error: any) => {
      console.error('🚨 Booking Creation Error:', error);
      
      // Handle timeout specifically
      if (error.name === 'AbortError') {
        toast({
          title: "⏱️ Request Timeout",
          description: "Booking may still be processing. Please check your bookings.",
          variant: "destructive",
          duration: 5000
        });
        return;
      }
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "🔒 Session Expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/sign-in";
        }, 1000);
        return;
      }
      
      // Handle trial expired error
      if (error?.code === 'TRIAL_EXPIRED' || error?.message?.includes('Trial expired')) {
        toast({
          title: "🔄 Trial Expired",
          description: "Upgrade your plan to continue creating bookings.",
          variant: "destructive"
        });
        onClose();
        setIsSubscriptionModalOpen(true);
        return;
      }
      
      // Generic error handling
      const errorMessage = error?.message || 'Unknown error occurred';
      toast({
        title: "❌ Booking Failed",
        description: `Error: ${errorMessage}. Please try again.`,
        variant: "destructive",
        duration: 4000
      });
    },
  });

  const getCargoMultiplier = (cargoType: string) => {
    const multipliers: Record<string, number> = {
      'fragile': 1.3,
      'hazardous': 1.8,
      'perishable': 1.4,
      'valuable': 1.6,
      'normal': 1.0,
      'bulk': 0.8
    };
    return multipliers[cargoType] || 1.0;
  };

  const getDistanceMultiplier = (distance: number) => {
    if (distance > 1000) return 0.9; // Long distance discount
    if (distance > 500) return 0.95;
    if (distance < 50) return 1.2; // Short distance premium
    return 1.0;
  };

  const fetchMarketRate = async (from: string, to: string) => {
    // Simulate market rate API call
    const baseMarketRate = 10 + Math.random() * 8; // ₹10-18 per km
    const fuelSurcharge = 1.15; // 15% fuel surcharge
    return baseMarketRate * fuelSurcharge;
  };

  const calculatePricing = (weight: number, distance: number, handlingCharges: number = 0) => {
    if (useAutoRate) {
      // Simple automatic calculation: rate per km based on weight and distance
      const baseRate = weight * distance * (baseRatePerKm / 100);
      const gstAmount = (baseRate + handlingCharges) * 0.18;
      const totalAmount = baseRate + handlingCharges + gstAmount;
      
      setPricing({ baseRate, gstAmount, totalAmount });
    }
    // If manual rate is selected, pricing is set directly in the input handler
  };



  const watchedFields = form.watch(['weight', 'distance', 'handlingCharges']);
  
  useEffect(() => {
    const [weight, distance, handlingCharges] = watchedFields;
    if (useAutoRate && weight && distance) {
      calculatePricing(Number(weight), Number(distance), Number(handlingCharges) || 0);
    }
  }, [watchedFields, useAutoRate, baseRatePerKm]);

  const onNext = (data: BookingFormValues) => {
    console.log('Form submitted with data:', data);
    processBookingDetailsMutation.mutate(data);
  };



  const handlePaymentComplete = (paymentData: any) => {
    if (bookingData) {
      const finalBookingData = {
        ...bookingData,
        paymentMethod: paymentData.paymentMethod,
        paymentStatus: paymentData.paymentStatus,
        transactionId: paymentData.transactionId,
        paymentNotes: paymentData.paymentNotes
      };
      createBookingMutation.mutate(finalBookingData);
    }
  };

  const handleBackToBooking = () => {
    setStep('booking');
    setBookingData(null);
  };

  const handleClose = () => {
    form.reset();
    setPricing({ baseRate: 0, gstAmount: 0, totalAmount: 0 });
    setUseAutoRate(false);
    setBaseRatePerKm(12);
    setStep('booking');
    setBookingData(null);
    onClose();
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto booking-modal" data-booking-modal>
        <DialogHeader>
          <DialogTitle>
            {step === 'booking' ? 'New Cargo Booking' : 'Payment & Confirmation'}
          </DialogTitle>
        </DialogHeader>

        {/* Trial Expiry Warning */}
        {trialDaysRemaining <= 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Trial Expired</h3>
                <p className="text-sm text-red-600">
                  Your free trial has ended. Upgrade to a paid plan to continue creating bookings.
                </p>
                <Button 
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {step === 'booking' ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
            {/* Booking Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-800 border-b border-slate-200 pb-2">
                  Booking Details
                </h3>
                
                <FormField
                  control={form.control}
                  name="bookingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="booking-modal-select-trigger">
                            <SelectValue placeholder="Select booking type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FTL">Full Truck Load (FTL)</SelectItem>
                          <SelectItem value="LTL">Less Than Truck Load (LTL)</SelectItem>
                          <SelectItem value="part_load">Part Load</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                

                
                <FormField
                  control={form.control}
                  name="cargoDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the goods (optional)"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Item Count */}
                <FormField
                  control={form.control}
                  name="itemCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Items/Parcels</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter quantity" 
                          min="1"
                          className="booking-modal-input"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />



                {/* Vehicle Selection */}
                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Vehicle</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a vehicle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicles && vehicles.length > 0 ? (
                            vehicles.map((vehicle: any) => (
                              <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                {vehicle.registrationNumber} - {vehicle.vehicleType} ({vehicle.capacity}kg)
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-vehicles" disabled>
                              No vehicles available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-800 border-b border-slate-200 pb-2">
                  Route Information
                </h3>
                
                {/* Pickup Details */}
                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium text-slate-700">Pickup Location</h4>
                  
                  <FormField
                    control={form.control}
                    name="pickupAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Enter pickup address" className="booking-modal-input" {...field} />
                        </FormControl>
                        <FormMessage className="booking-modal-error" />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="pickupCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              placeholder="Enter pickup city" 
                              className="booking-modal-input"
                              {...field} 
                              onChange={async (e) => {
                                field.onChange(e);
                                const pinCode = await fetchPinCode(e.target.value);
                                if (pinCode) {
                                  form.setValue('pickupPinCode', pinCode);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="pickupPinCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Enter pickup PIN code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="pickupDateTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Pickup Date & Time</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field} 
                            min={new Date().toISOString().slice(0, 16)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Delivery Details */}
                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium text-slate-700">Delivery Location</h4>
                  
                  <FormField
                    control={form.control}
                    name="deliveryAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Enter delivery address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="deliveryCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              placeholder="Enter delivery city" 
                              {...field} 
                              onChange={async (e) => {
                                field.onChange(e);
                                const pinCode = await fetchPinCode(e.target.value);
                                if (pinCode) {
                                  form.setValue('deliveryPinCode', pinCode);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="deliveryPinCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Enter delivery PIN code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="deliveryDateTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Delivery Date & Time (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field} 
                            min={new Date().toISOString().slice(0, 16)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Rate Calculation Options */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Rate Calculation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Toggle Switch */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          {useAutoRate ? 'Automatic Calculation' : 'Manual Rate Entry'}
                        </label>
                        <p className="text-xs text-gray-500">
                          {useAutoRate 
                            ? 'Rate calculated based on weight and distance' 
                            : 'Enter custom rate amount'
                          }
                        </p>
                      </div>
                      
                      {/* Toggle Switch */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Manual</span>
                        <button
                          type="button"
                          onClick={() => {
                            setUseAutoRate(!useAutoRate);
                            setPricing({ baseRate: 0, gstAmount: 0, totalAmount: 0 });
                            // Clear weight and distance when switching modes
                            if (useAutoRate) {
                              // Switching from auto to manual - clear auto fields
                              form.setValue('weight', undefined);
                              form.setValue('distance', undefined);
                            } else {
                              // Switching from manual to auto - clear manual rate
                              // Pricing is already cleared above
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            useAutoRate ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              useAutoRate ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className="text-sm text-gray-500">Auto</span>
                      </div>
                    </div>

                    {/* Rate Input Based on Toggle */}
                    {useAutoRate ? (
                      <div className="space-y-4">
                        {/* Weight and Distance Fields - Only for Auto Rate */}
                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="weight"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Weight (kg)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="Enter weight in kg" 
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="distance"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Distance (km)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="Enter distance in km" 
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Rate per KM Setting */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Rate per KM (₹/km per 100kg)</label>
                          <input
                            type="number"
                            value={baseRatePerKm}
                            onChange={(e) => {
                              setBaseRatePerKm(Number(e.target.value));
                              // Recalculate if weight and distance are available
                              const weight = form.getValues('weight');
                              const distance = form.getValues('distance');
                              const handlingCharges = form.getValues('handlingCharges');
                              if (weight && distance) {
                                calculatePricing(Number(weight), Number(distance), Number(handlingCharges) || 0);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            min="1"
                            max="50"
                          />
                          <p className="text-xs text-gray-500">
                            Formula: Weight × Distance × (Rate/100)
                          </p>
                        </div>

                        {/* Handling Charges */}
                        <FormField
                          control={form.control}
                          name="handlingCharges"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Handling Charges (₹) - Optional</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Enter handling charges (optional)" 
                                  min="0"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(Number(e.target.value));
                                    // Recalculate if weight and distance are available
                                    const weight = form.getValues('weight');
                                    const distance = form.getValues('distance');
                                    if (weight && distance) {
                                      calculatePricing(Number(weight), Number(distance), Number(e.target.value) || 0);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Manual Rate (₹)</label>
                          <input
                            type="number"
                            value={pricing.baseRate || ''}
                            onChange={(e) => {
                              const baseRate = Number(e.target.value) || 0;
                              const handlingCharges = Number(form.getValues('handlingCharges')) || 0;
                              const gstAmount = (baseRate + handlingCharges) * 0.18;
                              const totalAmount = baseRate + handlingCharges + gstAmount;
                              setPricing({ baseRate, gstAmount, totalAmount });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Enter custom rate"
                            min="0"
                          />
                          <p className="text-xs text-gray-500">
                            Enter any amount independent of weight and distance
                          </p>
                        </div>

                        {/* Handling Charges for Manual Mode */}
                        <FormField
                          control={form.control}
                          name="handlingCharges"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Handling Charges (₹) - Optional</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Enter handling charges (optional)" 
                                  min="0"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(Number(e.target.value));
                                    // Recalculate with manual base rate
                                    const baseRate = pricing.baseRate || 0;
                                    const handlingCharges = Number(e.target.value) || 0;
                                    const gstAmount = (baseRate + handlingCharges) * 0.18;
                                    const totalAmount = baseRate + handlingCharges + gstAmount;
                                    setPricing({ baseRate, gstAmount, totalAmount });
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Summary */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Pricing Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Base Rate:</span>
                      <span>₹{Math.ceil(pricing.baseRate)}</span>
                    </div>
                    {form.getValues('handlingCharges') && Number(form.getValues('handlingCharges')) > 0 && (
                      <div className="flex justify-between">
                        <span>Handling Charges:</span>
                        <span>₹{Math.ceil(Number(form.getValues('handlingCharges')))}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>GST (18%):</span>
                      <span>₹{Math.ceil(pricing.gstAmount)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total Amount:</span>
                      <span>₹{Math.ceil(pricing.totalAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Customer Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-slate-700">Sender Details</h4>
                
                <FormField
                  control={form.control}
                  name="senderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Enter sender name or company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="senderPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="senderEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Enter email address (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="senderGST"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Enter GST number (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-slate-700">Receiver Details</h4>
                
                <FormField
                  control={form.control}
                  name="receiverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Enter receiver name or company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="receiverPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="receiverEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Enter email address (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="receiverGST"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Enter GST number (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            

            
            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={processBookingDetailsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {processBookingDetailsMutation.isPending ? "Processing..." : "Next →"}
              </Button>
            </div>
          </form>
        </Form>
        ) : (
          <PaymentFormComponent
            bookingData={bookingData}
            onPaymentComplete={handlePaymentComplete}
            onBack={handleBackToBooking}
            isProcessing={createBookingMutation.isPending}
          />
        )}
      </DialogContent>
    </Dialog>

    {/* Subscription Modal for Trial Expiry */}
    <SubscriptionModal
      isOpen={isSubscriptionModalOpen}
      onClose={() => setIsSubscriptionModalOpen(false)}
    />
  </>
  );
}

export default BookingModal;

// Payment Form Component with live status updates
interface PaymentFormProps {
  bookingData: any;
  onPaymentComplete: (paymentData: any) => void;
  onBack: () => void;
  isProcessing: boolean;
}

function PaymentFormComponent({ bookingData, onPaymentComplete, onBack, isProcessing }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [transactionId, setTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('Payment completed via booking system');

  // Update payment status based on payment method
  useEffect(() => {
    if (paymentMethod === 'pending') {
      setPaymentStatus('pending');
    } else if (paymentMethod === 'free') {
      setPaymentStatus('free');
    } else {
      setPaymentStatus('paid');
    }
  }, [paymentMethod]);

  const getStatusDisplay = () => {
    switch (paymentStatus) {
      case 'paid':
        return { text: '✓ Payment Completed', color: 'text-green-600' };
      case 'free':
        return { text: '○ Free Booking', color: 'text-blue-600' };
      case 'failed':
        return { text: '✗ Payment Failed', color: 'text-red-600' };
      default:
        return { text: '⏳ Payment Pending', color: 'text-yellow-600' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-xl font-bold text-blue-800 mb-4">Booking Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Booking ID:</p>
            <p className="font-bold text-blue-600">{bookingData?.bookingId}</p>
          </div>
          <div>
            <p className="text-gray-600">Route:</p>
            <p className="font-bold">{bookingData?.pickupCity} → {bookingData?.deliveryCity}</p>
          </div>
          <div>
            <p className="text-gray-600">Service Type:</p>
            <p className="font-bold">{bookingData?.bookingType}</p>
          </div>
          {bookingData?.weight && bookingData?.isAutoCalculation && (
            <div>
              <p className="text-gray-600">Weight:</p>
              <p className="font-bold">{bookingData?.weight} kg</p>
            </div>
          )}
          <div>
            <p className="text-gray-600">Sender:</p>
            <p className="font-bold">{bookingData?.senderName}</p>
          </div>
          <div>
            <p className="text-gray-600">Phone:</p>
            <p className="font-bold">{bookingData?.senderPhone}</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-white rounded-xl border-2 border-green-200">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-700">Total Amount:</span>
            <span className="text-3xl font-black text-green-600">₹{bookingData?.totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Payment Form - Interactive */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Payment Information</h3>
              <p className="text-sm text-gray-600">Complete payment details for this booking</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Method
              </label>
              <select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cash">💵 Cash Payment</option>
                <option value="online">💳 Online Payment</option>
                <option value="pending">⏳ Payment Pending</option>
                <option value="free">🆓 Free Service</option>
              </select>
            </div>

            {/* Payment Status - Live Update */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Payment Status
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={statusDisplay.text}
                  readOnly
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-medium cursor-not-allowed ${statusDisplay.color}`}
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Auto
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Payment Amount (₹)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={`₹${Math.ceil(parseFloat(bookingData?.totalAmount || '0'))}`}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-semibold text-lg text-green-600 cursor-not-allowed"
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Fixed
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Amount is automatically set from booking calculation and cannot be modified
              </p>
            </div>

            {/* Transaction ID */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Transaction ID</label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500">Transaction reference number for payment tracking</p>
            </div>
          </div>

          {/* Payment Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Payment Notes</label>
            <textarea
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Add any payment notes or remarks (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500">Additional notes about the payment or special instructions</p>
          </div>

          {/* Payment Summary */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Payment Summary</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">₹{bookingData?.totalAmount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Booking
        </Button>
        
        <Button 
          onClick={() => onPaymentComplete({
            paymentMethod,
            paymentStatus,
            transactionId,
            paymentNotes
          })}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700 flex items-center gap-2 px-8"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating Booking...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              {paymentStatus === 'pending' ? 'Create Booking (Payment Pending)' : 'Complete Booking & Payment'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
