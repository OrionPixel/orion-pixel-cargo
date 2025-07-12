// Comprehensive PIN code database for Indian cities and towns
export const PINCODE_DATABASE: Record<string, string> = {
  // Major Metro Cities
  'mumbai': '400001', 'delhi': '110001', 'bangalore': '560001', 'kolkata': '700001',
  'chennai': '600001', 'hyderabad': '500001', 'pune': '411001', 'ahmedabad': '380001',
  'surat': '395001', 'jaipur': '302001', 'lucknow': '226001', 'kanpur': '208001',
  'nagpur': '440001', 'indore': '452001', 'thane': '400601', 'bhopal': '462001',
  'visakhapatnam': '530001', 'patna': '800001', 'vadodara': '390001', 'ghaziabad': '201001',
  'ludhiana': '141001', 'agra': '282001', 'nashik': '422001', 'faridabad': '121001',
  'meerut': '250001', 'rajkot': '360001', 'varanasi': '221001', 'srinagar': '190001',
  'aurangabad': '431001', 'dhanbad': '826001', 'amritsar': '143001', 'allahabad': '211001',
  'ranchi': '834001', 'howrah': '711101', 'coimbatore': '641001', 'jabalpur': '482001',
  'gwalior': '474001', 'vijayawada': '520001', 'jodhpur': '342001', 'madurai': '625001',
  'raipur': '492001', 'kota': '324001', 'guwahati': '781001', 'chandigarh': '160001',
  'solapur': '413001', 'bareilly': '243001', 'moradabad': '244001', 'mysore': '570001',
  'gurgaon': '122001', 'gurugram': '122001', 'aligarh': '202001', 'jalandhar': '144001',
  'tiruchirappalli': '620001', 'bhubaneswar': '751001', 'salem': '636001', 'warangal': '506001',
  'thiruvananthapuram': '695001', 'guntur': '522001', 'amravati': '444601', 'bikaner': '334001',
  'noida': '201301', 'jamshedpur': '831001', 'cuttack': '753001', 'firozabad': '283201',
  'kochi': '682001', 'bhavnagar': '364001', 'dehradun': '248001', 'durgapur': '713201',
  'asansol': '713301', 'rourkela': '769001', 'nanded': '431601', 'kolhapur': '416001',
  'ajmer': '305001', 'akola': '444001', 'jamnagar': '361001', 'ujjain': '456001',
  'siliguri': '734001', 'jhansi': '284001', 'jammu': '180001', 'mangalore': '575001',
  'erode': '638001', 'belgaum': '590001', 'tirunelveli': '627001', 'udaipur': '313001',
  'kozhikode': '673001', 'gulbarga': '585101', 'navi mumbai': '400703',

  // Popular Small Cities & Towns
  'khurja': '203131', 'bulandshahr': '203001', 'hapur': '245101', 'greater noida': '201310',
  'dadri': '203207', 'jewar': '203135', 'sikandrabad': '203205', 'anupshahr': '203390',
  'sikar': '332001', 'jhunjhunu': '333001', 'churu': '331001', 'nagaur': '341001',
  'pali': '306401', 'barmer': '344001', 'jaisalmer': '345001', 'hanumangarh': '335001',
  'chittorgarh': '312001', 'bhilwara': '311001', 'bundi': '323001', 'jhalawar': '326001',
  'baran': '325001', 'sawai madhopur': '322001', 'karauli': '322241', 'dholpur': '328001',
  'bharatpur': '321001', 'alwar': '301001', 'tonk': '304001', 'dausa': '303303',
  'dungarpur': '314001', 'banswara': '327001', 'mount abu': '307501', 'abu road': '307026',
  'sirohi': '307001', 'patiala': '147001', 'bathinda': '151001', 'mohali': '160062',
  'hoshiarpur': '146001', 'firozpur': '152001', 'pathankot': '145001', 'moga': '142001',
  'abohar': '152116', 'malerkotla': '148023', 'khanna': '141401', 'phagwara': '144401',
  'mukerian': '144211', 'sunam': '148028', 'rajpura': '140401', 'samana': '147001',
  'nabha': '147201', 'sangrur': '148001', 'mansa': '151505', 'yamunanagar': '135001',
  'kurukshetra': '136001', 'panipat': '132103', 'sonipat': '131001', 'rohtak': '124001',
  'jhajjar': '124103', 'rewari': '123401', 'mahendragarh': '123029', 'narnaul': '123001',
  'bhiwani': '127021', 'hisar': '125001', 'fatehabad': '125050', 'sirsa': '125055',
  'jind': '126102', 'kaithal': '136027', 'panchkula': '134109', 'bahadurgarh': '124507',
  'palwal': '121102', 'nuh': '122107', 'sohna': '122103', 'hodal': '121106',
  'ballabgarh': '121004', 'manesar': '122051',

  // Small Towns Tamil Nadu
  'vellore': '632001', 'thoothukudi': '628001', 'dindigul': '624001', 'thanjavur': '613001', 
  'sivakasi': '626123', 'karur': '639001', 'cuddalore': '607001', 'kumbakonam': '612001', 
  'tiruvannamalai': '606001', 'pollachi': '642001', 'rajapalayam': '626117', 'pudukkottai': '622001', 
  'nagapattinam': '611001', 'krishnagiri': '635001', 'dharmapuri': '636701', 'viluppuram': '605602', 
  'tindivanam': '604001', 'chidambaram': '608001', 'hosur': '635109', 'namakkal': '637001', 
  'tiruchengode': '637211', 'mettur': '636401',

  // Small Towns Kerala
  'kollam': '691001', 'alappuzha': '688001', 'palakkad': '678001', 'malappuram': '676121',
  'kottayam': '686001', 'kasaragod': '671121', 'wayanad': '673121', 'ernakulam': '683101',
  'angamaly': '683572', 'aluva': '683101', 'edappally': '682024', 'kothamangalam': '686691',
  'guruvayoor': '680101', 'ottapalam': '679101', 'kalpetta': '673121', 'vadakara': '673104',

  // Small Towns Chhattisgarh
  'durg': '491001', 'bhilai': '490001', 'korba': '495001', 'rajnandgaon': '491006',
  'raigarh': '496001', 'jagdalpur': '494001', 'ambikapur': '497001', 'kanker': '494334',

  // State Capitals & Important Cities
  'shimla': '171001', 'aizawl': '796001', 'dispur': '781005', 'itanagar': '791111',
  'panaji': '403001', 'gandhinagar': '382010', 'pondicherry': '605001', 'port blair': '744101',
  'imphal': '795001', 'kohima': '797001', 'agartala': '799001', 'kavaratti': '682555',
  'silvassa': '396230', 'daman': '396210', 'leh': '194101', 'kargil': '194103',

  // Small Towns Uttar Pradesh
  'azamgarh': '276001', 'ballia': '277001', 'banda': '210001', 'barabanki': '225001',
  'basti': '272001', 'bijnor': '246701', 'budaun': '243601', 'deoria': '274001',
  'etah': '207001', 'etawah': '206001', 'farrukhabad': '209601', 'fatehpur': '212601',
  'ghazipur': '233001', 'gonda': '271001', 'gorakhpur': '273001', 'hardoi': '241001',
  'hathras': '204101', 'jaunpur': '222001', 'jalaun': '285001', 'lalitpur': '284403',
  'lakhimpur': '262701', 'mainpuri': '205001', 'mathura': '281001', 'mirzapur': '231001',
  'muzaffarnagar': '251001', 'pilibhit': '262001', 'pratapgarh': '230001', 'raebareli': '229001',
  'rampur': '244901', 'saharanpur': '247001', 'sambhal': '244302', 'shahjahanpur': '242001',
  'shrawasti': '271831', 'siddharthnagar': '272207', 'sitapur': '261001', 'sonbhadra': '231216',
  'sultanpur': '228001', 'unnao': '209801', 'orai': '285001', 'kasganj': '207123',
  'amroha': '244221', 'chandausi': '202412', 'pilkhuwa': '245304', 'gajraula': '244235',
  'najibabad': '246763', 'deoband': '247554', 'gangoh': '247341', 'roorkee': '247667',
  'laksar': '247663', 'jwalapur': '249407', 'rishikesh': '249201', 'kotdwar': '246149',
  'pauri': '246001', 'lansdowne': '246155', 'rudraprayag': '246171', 'joshimath': '246443',
  'badrinath': '246422', 'kedarnath': '246445', 'gangotri': '249135', 'yamunotri': '249141',
  'mussoorie': '248179', 'nainital': '263001', 'almora': '263601', 'bageshwar': '263642',
  'champawat': '262523', 'pithoragarh': '262501', 'kashipur': '244713', 'rudrapur': '263153',
  'haldwani': '263139', 'ramnagar': '244715', 'khatima': '262308', 'tanakpur': '262311',
  'lohaghat': '262524', 'munsiyari': '262554',

  // Small Towns Madhya Pradesh
  'sagar': '470001', 'satna': '485001', 'rewa': '486001', 'singrauli': '486889',
  'sidhi': '486661', 'shahdol': '484001', 'umaria': '484661', 'anuppur': '484224',
  'mandla': '481661', 'dindori': '481880', 'balaghat': '481001', 'seoni': '480001',
  'chhindwara': '480001', 'betul': '460001', 'harda': '461331', 'hoshangabad': '461001',
  'sehore': '466001', 'raisen': '464001', 'vidisha': '464001', 'guna': '473001',
  'ashoknagar': '473331', 'shivpuri': '473551', 'datia': '475661', 'bhind': '477001',
  'morena': '476001', 'sheopur': '476337', 'tikamgarh': '472001', 'chhatarpur': '471001',
  'damoh': '470661', 'panna': '488001', 'katni': '483501', 'maihar': '485771',
  'nagda': '456331', 'mandsaur': '458001', 'neemuch': '458441', 'ratlam': '457001',
  'jhabua': '457661', 'dhar': '454001', 'khargone': '451001', 'barwani': '451551',
  'khandwa': '450001', 'burhanpur': '450331', 'dewas': '455001', 'shajapur': '465001',
  'agar': '465441',

  // Small Towns Bihar
  'muzaffarpur': '842001', 'darbhanga': '846001', 'begusarai': '851101', 'saharsa': '852201',
  'madhepura': '852113', 'supaul': '852131', 'araria': '854311', 'purnia': '854301',
  'katihar': '854105', 'madhubani': '847211', 'sitamarhi': '843301', 'sheohar': '843329',
  'east champaran': '845401', 'west champaran': '845438', 'gopalganj': '841428',
  'siwan': '841226', 'saran': '841301', 'vaishali': '844121', 'samashtipur': '848101',
  'khagaria': '851204', 'bhagalpur': '812001', 'banka': '813102', 'munger': '811201',
  'lakhisarai': '811311', 'sheikhpura': '811105', 'nalanda': '803101', 'jehanabad': '804408',
  'arwal': '804401', 'kaimur': '821104', 'rohtas': '821305', 'bhojpur': '802301',
  'buxar': '802101', 'sasaram': '821115', 'dumraon': '802119', 'jagdishpur': '802158',
  'arah': '802301', 'bihiya': '802104', 'koelwar': '802111', 'dehri': '821307',
  'dalmianagar': '821305', 'nabinagar': '823111', 'barachatti': '805124', 'belaganj': '805110',
  'islampur': '805125', 'rajgir': '803116', 'silao': '803118', 'nagarnausa': '803113',
  'harnaut': '803110', 'ben': '803114', 'ekangarsarai': '803111', 'giriyak': '803201',
  'barbigha': '805101',

  // Small Towns West Bengal
  'hooghly': '712601', 'burdwan': '713101', 'birbhum': '731101', 'murshidabad': '742149',
  'nadia': '741101', 'north 24 parganas': '743101', 'south 24 parganas': '743329',
  'purulia': '723101', 'bankura': '722101', 'west midnapore': '721101', 'east midnapore': '721401',
  'jalpaiguri': '735101', 'cooch behar': '736101', 'darjeeling': '734101', 'kalimpong': '734301',
  'malda': '732101', 'uttar dinajpur': '733101', 'dakshin dinajpur': '733121', 'alipurduar': '736121',
  'jhargram': '721507', 'bishnupur': '722122', 'khatra': '722140', 'taldangra': '722160',
  'mejia': '722143', 'sarenga': '722156', 'gangajalghati': '722151', 'chhatna': '722132',
  'onda': '722144', 'saltora': '722158', 'patrasayar': '722154', 'indpur': '722205',
  'sonamukhi': '722207', 'ranibandh': '722135', 'simlapal': '722141',

  // Small Towns Gujarat
  'anand': '388001', 'bharuch': '392001', 'navsari': '396001', 'valsad': '396001',
  'vapi': '396191', 'diu': '362520', 'amreli': '365601', 'junagadh': '362001',
  'porbandar': '360575', 'dwarka': '361335', 'okha': '361350', 'kutch': '370001',
  'bhuj': '370001', 'gandhidham': '370201', 'kandla': '370210', 'mandvi': '370465',
  'mundra': '370421', 'rapar': '370165', 'bhachau': '370140', 'anjar': '370110',
  'abdasa': '370601', 'lakhpat': '370640', 'nakhatrana': '370615', 'khavda': '370510',
  'fatehgarh': '370020', 'patan': '384265', 'mehsana': '384001', 'sabarkantha': '383001',
  'banaskantha': '385001', 'palanpur': '385001', 'deesa': '385535', 'danta': '385310',
  'tharad': '385565', 'vadgam': '385520', 'dhanera': '385310', 'bhabhar': '385320',
  'kankrej': '385520', 'vav': '385555', 'suigam': '385540', 'bhildi': '385510',
  'santalpur': '385360', 'radhanpur': '385340', 'sidhpur': '384151', 'unjha': '384170',
  'kheralu': '384325', 'satlasana': '384330', 'vadnagar': '384355', 'himmatnagar': '383001',
  'idar': '383430', 'talod': '383215', 'modasa': '383315', 'malpur': '383345',
  'bayad': '383325', 'prantij': '383205', 'dhansura': '383310', 'meghraj': '383350',
  'khedbrahma': '383275', 'vijaynagar': '383460', 'bhiloda': '383245', 'vadali': '383235',

  // Small Towns Maharashtra
  'ahmednagar': '414001', 'beed': '431122', 'bhandara': '441904', 'buldhana': '443001',
  'chandrapur': '442401', 'dhule': '424001', 'gadchiroli': '442605', 'gondia': '441601',
  'hingoli': '431513', 'jalgaon': '425001', 'jalna': '431203', 'latur': '413512',
  'nandurbar': '425412', 'osmanabad': '413501', 'parbhani': '431401', 'raigad': '402109',
  'ratnagiri': '415612', 'sangli': '416416', 'satara': '415001', 'sindhudurg': '416613',
  'wardha': '442001', 'washim': '444505', 'yavatmal': '445001', 'malegaon': '423203',
  'manmad': '423104', 'igatpuri': '422403', 'trimbakeshwar': '422212', 'kalwan': '423501',
  'nandgaon': '423106', 'yeola': '423401', 'niphad': '422303', 'sinnar': '422103',
  'baglan': '423302', 'chandwad': '423101', 'deola': '423102', 'navapur': '425418',
  'shahada': '425409', 'taloda': '425413', 'akkalkuwa': '425415', 'akrani': '425401',
  'shirpur': '425405', 'sindkhede': '425406', 'sakri': '424304', 'faizpur': '425503',
  'yawal': '425001', 'raver': '425508', 'muktainagar': '425306', 'bodwad': '425310',
  'bhusawal': '425201', 'jamner': '424206', 'dharangaon': '425105', 'parola': '425111',
  'amalner': '425401', 'chopda': '425107', 'pachora': '424201', 'bhadgaon': '425412',
  'erandol': '425109'
};

export function fetchPinCode(city: string): string {
  if (!city || city.trim().length === 0) {
    return '';
  }
  
  const normalizedCity = city.toLowerCase().trim();
  return PINCODE_DATABASE[normalizedCity] || '';
}