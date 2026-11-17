export interface UpazilaInfo {
  name: string;
  bnName: string;
}

export interface DistrictInfo {
  name: string;
  bnName: string;
  lat: number;
  lng: number;
  upazilas: string[];
}

export interface DivisionInfo {
  name: string;
  bnName: string;
  lat: number;
  lng: number;
  districts: Record<string, DistrictInfo>;
}

export const BANGLADESH_CENTER = { lat: 23.685, lng: 90.3563, zoom: 7 };

export const BANGLADESH_DIVISIONS: Record<string, DivisionInfo> = {
  Dhaka: {
    name: 'Dhaka',
    bnName: 'ঢাকা',
    lat: 23.8103,
    lng: 90.4125,
    districts: {
      Dhaka: {
        name: 'Dhaka',
        bnName: 'ঢাকা',
        lat: 23.8103,
        lng: 90.4125,
        upazilas: [
          'Dhanmondi', 'Gulshan', 'Mirpur', 'Mohammadpur', 'Uttara', 'Motijheel',
          'Shahbagh', 'Badda', 'Khilgaon', 'Paltan', 'Tejgaon', 'Banani',
          'Savar', 'Dhamrai', 'Keraniganj', 'Nawabganj', 'Dohar',
        ],
      },
      Gazipur: {
        name: 'Gazipur',
        bnName: 'গাজীপুর',
        lat: 24.0023,
        lng: 90.4264,
        upazilas: ['Gazipur Sadar', 'Kaliakair', 'Kaliganj', 'Kapasia', 'Sreepur', 'Tongi'],
      },
      Narayanganj: {
        name: 'Narayanganj',
        bnName: 'নারায়ণগঞ্জ',
        lat: 23.6238,
        lng: 90.5000,
        upazilas: ['Narayanganj Sadar', 'Bandar', 'Araihazar', 'Rupganj', 'Sonargaon'],
      },
      Tangail: {
        name: 'Tangail',
        bnName: 'টাঙ্গাইল',
        lat: 24.2513,
        lng: 89.9167,
        upazilas: ['Tangail Sadar', 'Delduar', 'Ghatail', 'Gopalpur', 'Kalihati', 'Madhupur', 'Mirzapur', 'Nagarpur', 'Sakhipur', 'Basail', 'Bhuapur', 'Dhanbari'],
      },
      Kishoreganj: {
        name: 'Kishoreganj',
        bnName: 'কিশোরগঞ্জ',
        lat: 24.4449,
        lng: 90.7766,
        upazilas: ['Kishoreganj Sadar', 'Bajitpur', 'Bhairab', 'Hossainpur', 'Itna', 'Karimganj', 'Katiadi', 'Kuliarchar', 'Mithamain', 'Nikli', 'Pakundia', 'Tarail'],
      },
      Manikganj: {
        name: 'Manikganj',
        bnName: 'মানিকগঞ্জ',
        lat: 23.8617,
        lng: 90.0003,
        upazilas: ['Manikganj Sadar', 'Singair', 'Shibalaya', 'Saturia', 'Harirampur', 'Ghior', 'Daulatpur'],
      },
      Munshiganj: {
        name: 'Munshiganj',
        bnName: 'মুন্সীগঞ্জ',
        lat: 23.5422,
        lng: 90.5305,
        upazilas: ['Munshiganj Sadar', 'Sreenagar', 'Sirajdikhan', 'Louhajang', 'Tongibari', 'Gazaria'],
      },
      Narsingdi: {
        name: 'Narsingdi',
        bnName: 'নরসিংদী',
        lat: 23.9322,
        lng: 90.7154,
        upazilas: ['Narsingdi Sadar', 'Belabo', 'Monohardi', 'Palash', 'Raipura', 'Shibpur'],
      },
      Faridpur: {
        name: 'Faridpur',
        bnName: 'ফরিদপুর',
        lat: 23.6071,
        lng: 89.8429,
        upazilas: ['Faridpur Sadar', 'Boalmari', 'Alfadanga', 'Madhukhali', 'Bhanga', 'Nagarkanda', 'Charbhadrasan', 'Sadarpur', 'Saltha'],
      },
      Gopalganj: {
        name: 'Gopalganj',
        bnName: 'গোপালগঞ্জ',
        lat: 23.0051,
        lng: 89.8266,
        upazilas: ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara'],
      },
      Madaripur: {
        name: 'Madaripur',
        bnName: 'মাদারীপুর',
        lat: 23.1641,
        lng: 90.1897,
        upazilas: ['Madaripur Sadar', 'Kalkini', 'Rajoir', 'Shibchar', 'Dasar'],
      },
      Rajbari: {
        name: 'Rajbari',
        bnName: 'রাজবাড়ী',
        lat: 23.7574,
        lng: 89.6445,
        upazilas: ['Rajbari Sadar', 'Goalanda', 'Pangsha', 'Baliakandi', 'Kalukhali'],
      },
      Shariatpur: {
        name: 'Shariatpur',
        bnName: 'শরীয়তপুর',
        lat: 23.2423,
        lng: 90.4348,
        upazilas: ['Shariatpur Sadar', 'Damudya', 'Naria', 'Janjira', 'Bhedarganj', 'Gosairhat'],
      },
    },
  },
  Chattogram: {
    name: 'Chattogram',
    bnName: 'চট্টগ্রাম',
    lat: 22.3569,
    lng: 91.7832,
    districts: {
      Chattogram: {
        name: 'Chattogram',
        bnName: 'চট্টগ্রাম',
        lat: 22.3569,
        lng: 91.7832,
        upazilas: [
          'Kotwali', 'Panchlaish', 'Pahartali', 'Halishahar', 'Khulshi', 'Bakalia',
          'Anwara', 'Banshkhali', 'Boalkhali', 'Chandanaish', 'Fatikchhari',
          'Hathazari', 'Lohagara', 'Mirsharai', 'Patiya', 'Rangunia', 'Raozan',
          'Sandwip', 'Satkania', 'Sitakunda',
        ],
      },
      "Cox's Bazar": {
        name: "Cox's Bazar",
        bnName: "কক্সবাজার",
        lat: 21.4272,
        lng: 92.0058,
        upazilas: ["Cox's Bazar Sadar", 'Chakaria', 'Maheshkhali', 'Ramu', 'Teknaf', 'Ukhia', 'Pekua', 'Kutubdia'],
      },
      Cumilla: {
        name: 'Cumilla',
        bnName: 'কুমিল্লা',
        lat: 23.4682,
        lng: 91.1788,
        upazilas: ['Cumilla Adarsha Sadar', 'Cumilla Sadar Dakshin', 'Barura', 'Brahmanpara', 'Burichang', 'Chandina', 'Chauddagram', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam', 'Muradnagar', 'Nangalkot', 'Titas', 'Meghna', 'Monohargonj', 'Lalmai'],
      },
      Feni: {
        name: 'Feni',
        bnName: 'ফেনী',
        lat: 23.0186,
        lng: 91.3966,
        upazilas: ['Feni Sadar', 'Chhagalnaiya', 'Daganbhuiyan', 'Parshuram', 'Fulgazi', 'Sonagazi'],
      },
      Brahmanbaria: {
        name: 'Brahmanbaria',
        bnName: 'ব্রাহ্মণবাড়িয়া',
        lat: 23.9571,
        lng: 91.1119,
        upazilas: ['Brahmanbaria Sadar', 'Ashuganj', 'Nasirnagar', 'Nabinagar', 'Sarail', 'Kasba', 'Akhaura', 'Bancharampur', 'Bijoynagar'],
      },
      Chandpur: {
        name: 'Chandpur',
        bnName: 'চাঁদপুর',
        lat: 23.2333,
        lng: 90.6667,
        upazilas: ['Chandpur Sadar', 'Faridganj', 'Haimchar', 'Haziganj', 'Kachua', 'Matlab Dakshin', 'Matlab Uttar', 'Shahrasti'],
      },
      Noakhali: {
        name: 'Noakhali',
        bnName: 'নোয়াখালী',
        lat: 22.8696,
        lng: 91.0993,
        upazilas: ['Noakhali Sadar', 'Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya', 'Senbagh', 'Sonaimuri', 'Subarnachar', 'Kabirhat'],
      },
      Lakshmipur: {
        name: 'Lakshmipur',
        bnName: 'লক্ষ্মীপুর',
        lat: 22.9425,
        lng: 90.8412,
        upazilas: ['Lakshmipur Sadar', 'Raipur', 'Ramganj', 'Ramgati', 'Kamalnagar'],
      },
      Khagrachhari: {
        name: 'Khagrachhari',
        bnName: 'খাগড়াছড়ি',
        lat: 23.1193,
        lng: 91.9847,
        upazilas: ['Khagrachhari Sadar', 'Dighinala', 'Panchhari', 'Mahalchhari', 'Matiranga', 'Manikchhari', 'Ramgarh', 'Guimara'],
      },
      Rangamati: {
        name: 'Rangamati',
        bnName: 'রাঙ্গামাটি',
        lat: 22.7324,
        lng: 92.2985,
        upazilas: ['Rangamati Sadar', 'Belaichhari', 'Bagaichhari', 'Barkal', 'Juraichhari', 'Kaptai', 'Kawkhali', 'Langadu', 'Naniarchar', 'Rajasthali'],
      },
      Bandarban: {
        name: 'Bandarban',
        bnName: 'বান্দরবান',
        lat: 22.1953,
        lng: 92.2184,
        upazilas: ['Bandarban Sadar', 'Ali Kadam', 'Lama', 'Naikhongchhari', 'Rowangchhari', 'Ruma', 'Thanchi'],
      },
    },
  },
  Rajshahi: {
    name: 'Rajshahi',
    bnName: 'রাজশাহী',
    lat: 24.3636,
    lng: 88.6241,
    districts: {
      Rajshahi: {
        name: 'Rajshahi',
        bnName: 'রাজশাহী',
        lat: 24.3636,
        lng: 88.6241,
        upazilas: ['Boalia', 'Motihar', 'Rajpara', 'Shah Makhdum', 'Godagari', 'Tanore', 'Mohanpur', 'Bagmara', 'Durgapur', 'Bagha', 'Charghat', 'Puthia'],
      },
      Bogura: {
        name: 'Bogura',
        bnName: 'বগুড়া',
        lat: 24.8465,
        lng: 89.3770,
        upazilas: ['Bogura Sadar', 'Adamdighi', 'Dhunat', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Sonatala'],
      },
      Joypurhat: {
        name: 'Joypurhat',
        bnName: 'জয়পুরহাট',
        lat: 25.0968,
        lng: 89.0227,
        upazilas: ['Joypurhat Sadar', 'Akkelpur', 'Kalai', 'Khetlal', 'Panchbibi'],
      },
      Naogaon: {
        name: 'Naogaon',
        bnName: 'নওগাঁ',
        lat: 24.7936,
        lng: 88.9318,
        upazilas: ['Naogaon Sadar', 'Atrai', 'Badalgachhi', 'Dhamoirhat', 'Manda', 'Mohadevpur', 'Niamatpur', 'Patnitala', 'Porsha', 'Raninagar', 'Sapahar'],
      },
      Natore: {
        name: 'Natore',
        bnName: 'নাটোর',
        lat: 24.4206,
        lng: 89.0003,
        upazilas: ['Natore Sadar', 'Baraigram', 'Gurudaspur', 'Lalpur', 'Singra', 'Bagatipara', 'Naldanga'],
      },
      Chapainawabganj: {
        name: 'Chapainawabganj',
        bnName: 'চাঁপাইনবাবগঞ্জ',
        lat: 24.5965,
        lng: 88.2776,
        upazilas: ['Chapainawabganj Sadar', 'Bholahat', 'Gomastapur', 'Nachole', 'Shibganj'],
      },
      Pabna: {
        name: 'Pabna',
        bnName: 'পাবনা',
        lat: 24.0064,
        lng: 89.2372,
        upazilas: ['Pabna Sadar', 'Atgharia', 'Bera', 'Bhangura', 'Chatmohar', 'Faridpur', 'Ishwardi', 'Santhia', 'Sujanagar'],
      },
      Sirajganj: {
        name: 'Sirajganj',
        bnName: 'সিরাজগঞ্জ',
        lat: 24.4534,
        lng: 89.7008,
        upazilas: ['Sirajganj Sadar', 'Belkuchi', 'Chauhali', 'Kamarkhanda', 'Kazipur', 'Raiganj', 'Shahjadpur', 'Tarash', 'Ullahpara'],
      },
    },
  },
  Khulna: {
    name: 'Khulna',
    bnName: 'খুলনা',
    lat: 22.8456,
    lng: 89.5403,
    districts: {
      Khulna: {
        name: 'Khulna',
        bnName: 'খুলনা',
        lat: 22.8456,
        lng: 89.5403,
        upazilas: ['Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Daulatpur', 'Batiaghata', 'Dacope', 'Dumuria', 'Dighalia', 'Koyra', 'Paikgachha', 'Phultala', 'Rupsha', 'Terokhada'],
      },
      Bagerhat: {
        name: 'Bagerhat',
        bnName: 'বাগেরহাট',
        lat: 22.6516,
        lng: 89.7859,
        upazilas: ['Bagerhat Sadar', 'Chitalmari', 'Fakirhat', 'Kachua', 'Mollahat', 'Mongla', 'Morrelganj', 'Rampal', 'Sarankhola'],
      },
      Chuadanga: {
        name: 'Chuadanga',
        bnName: 'চুয়াডাঙ্গা',
        lat: 23.6402,
        lng: 88.8418,
        upazilas: ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar'],
      },
      Jashore: {
        name: 'Jashore',
        bnName: 'যশোর',
        lat: 23.1664,
        lng: 89.2081,
        upazilas: ['Jashore Sadar', 'Abhaynagar', 'Bagherpara', 'Chaugachha', 'Jhikargachha', 'Keshabpur', 'Manirampur', 'Sharsha'],
      },
      Jhenaidah: {
        name: 'Jhenaidah',
        bnName: 'ঝিনাইদহ',
        lat: 23.5448,
        lng: 89.1539,
        upazilas: ['Jhenaidah Sadar', 'Harinakunda', 'Kaliganj', 'Kotchandpur', 'Maheshpur', 'Shailkupa'],
      },
      Kushtia: {
        name: 'Kushtia',
        bnName: 'কুষ্টিয়া',
        lat: 23.9013,
        lng: 89.1205,
        upazilas: ['Kushtia Sadar', 'Bheramara', 'Daulatpur', 'Khoksa', 'Kumarkhali', 'Mirpur'],
      },
      Magura: {
        name: 'Magura',
        bnName: 'মাগুরা',
        lat: 23.4873,
        lng: 89.4198,
        upazilas: ['Magura Sadar', 'Mohammadpur', 'Shalikha', 'Sreepur'],
      },
      Meherpur: {
        name: 'Meherpur',
        bnName: 'মেহেরপুর',
        lat: 23.7622,
        lng: 88.6318,
        upazilas: ['Meherpur Sadar', 'Gangni', 'Mujibnagar'],
      },
      Narail: {
        name: 'Narail',
        bnName: 'নড়াইল',
        lat: 23.1725,
        lng: 89.5127,
        upazilas: ['Narail Sadar', 'Kalia', 'Lohagara'],
      },
      Satkhira: {
        name: 'Satkhira',
        bnName: 'সাতক্ষীরা',
        lat: 22.7185,
        lng: 89.0705,
        upazilas: ['Satkhira Sadar', 'Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Shyamnagar', 'Tala'],
      },
    },
  },
  Barishal: {
    name: 'Barishal',
    bnName: 'বরিশাল',
    lat: 22.7010,
    lng: 90.3535,
    districts: {
      Barishal: {
        name: 'Barishal',
        bnName: 'বরিশাল',
        lat: 22.7010,
        lng: 90.3535,
        upazilas: ['Barishal Sadar', 'Agailjhara', 'Babuganj', 'Bakerganj', 'Banaripara', 'Gaurnadi', 'Hizla', 'Mehendiganj', 'Muladi', 'Wazirpur'],
      },
      Barguna: {
        name: 'Barguna',
        bnName: 'বরগুনা',
        lat: 22.0953,
        lng: 90.1121,
        upazilas: ['Barguna Sadar', 'Amtali', 'Bamna', 'Betagi', 'Patharghata', 'Taltali'],
      },
      Bhola: {
        name: 'Bhola',
        bnName: 'ভোলা',
        lat: 22.6859,
        lng: 90.6481,
        upazilas: ['Bhola Sadar', 'Burhanuddin', 'Char Fasson', 'Daulatkhan', 'Lalmohan', 'Manpura', 'Tazumuddin'],
      },
      Jhalokati: {
        name: 'Jhalokati',
        bnName: 'ঝালকাঠি',
        lat: 22.6406,
        lng: 90.1987,
        upazilas: ['Jhalokati Sadar', 'Kathalia', 'Nalchhiti', 'Rajapur'],
      },
      Patuakhali: {
        name: 'Patuakhali',
        bnName: 'পটুয়াখালী',
        lat: 22.3596,
        lng: 90.3299,
        upazilas: ['Patuakhali Sadar', 'Bauphal', 'Dashmina', 'Galachipa', 'Kalapara', 'Mirzaganj', 'Rangabali', 'Dumki'],
      },
      Pirojpur: {
        name: 'Pirojpur',
        bnName: 'পিরোজপুর',
        lat: 22.5841,
        lng: 89.9720,
        upazilas: ['Pirojpur Sadar', 'Bhandaria', 'Kawkhali', 'Mathbaria', 'Nazirpur', 'Nesarabad (Swarupkati)', 'Indurkani'],
      },
    },
  },
  Sylhet: {
    name: 'Sylhet',
    bnName: 'সিলেট',
    lat: 24.8949,
    lng: 91.8687,
    districts: {
      Sylhet: {
        name: 'Sylhet',
        bnName: 'সিলেট',
        lat: 24.8949,
        lng: 91.8687,
        upazilas: ['Sylhet Sadar', 'Balaganj', 'Beanibazar', 'Bishwanath', 'Companiganj', 'Dakshin Surma', 'Fenchuganj', 'Golapganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Osmani Nagar', 'Zakiganj'],
      },
      Habiganj: {
        name: 'Habiganj',
        bnName: 'হবিগঞ্জ',
        lat: 24.3749,
        lng: 91.4155,
        upazilas: ['Habiganj Sadar', 'Ajmiriganj', 'Bahubal', 'Baniachong', 'Chunarughat', 'Lakhai', 'Madhabpur', 'Nabiganj', 'Sayestaganj'],
      },
      Moulvibazar: {
        name: 'Moulvibazar',
        bnName: 'মৌলভীবাজার',
        lat: 24.4829,
        lng: 91.7774,
        upazilas: ['Moulvibazar Sadar', 'Barlekha', 'Juri', 'Kamalganj', 'Kulaura', 'Rajnagar', 'Sreemangal'],
      },
      Sunamganj: {
        name: 'Sunamganj',
        bnName: 'সুনামগঞ্জ',
        lat: 25.0658,
        lng: 91.3950,
        upazilas: ['Sunamganj Sadar', 'Bishwamvarpur', 'Chhatak', 'Derai', 'Dharampasha', 'Dowarabazar', 'Jagannathpur', 'Jamalganj', 'Shantiganj', 'Sullah', 'Tahirpur', 'Madhyanagar'],
      },
    },
  },
  Rangpur: {
    name: 'Rangpur',
    bnName: 'রংপুর',
    lat: 25.7439,
    lng: 89.2752,
    districts: {
      Rangpur: {
        name: 'Rangpur',
        bnName: 'রংপুর',
        lat: 25.7439,
        lng: 89.2752,
        upazilas: ['Rangpur Sadar', 'Badarganj', 'Gangachhara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Taraganj'],
      },
      Dinajpur: {
        name: 'Dinajpur',
        bnName: 'দিনাজপুর',
        lat: 25.6217,
        lng: 88.6355,
        upazilas: ['Dinajpur Sadar', 'Birampur', 'Birganj', 'Biral', 'Bochaganj', 'Chirirbandar', 'Fulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Nawabganj', 'Parbatipur'],
      },
      Gaibandha: {
        name: 'Gaibandha',
        bnName: 'গাইবান্ধা',
        lat: 25.3288,
        lng: 89.5407,
        upazilas: ['Gaibandha Sadar', 'Fulchhari', 'Gobindaganj', 'Palashbari', 'Sadullapur', 'Saghata', 'Sundarganj'],
      },
      Kurigram: {
        name: 'Kurigram',
        bnName: 'কুড়িগ্রাম',
        lat: 25.8054,
        lng: 89.6362,
        upazilas: ['Kurigram Sadar', 'Bhurungamari', 'Char Rajibpur', 'Chilmari', 'Phulbari', 'Nageshwari', 'Rajarhat', 'Raomari', 'Ulipur'],
      },
      Lalmonirhat: {
        name: 'Lalmonirhat',
        bnName: 'লালমনিরহাট',
        lat: 25.9923,
        lng: 89.2847,
        upazilas: ['Lalmonirhat Sadar', 'Aditmari', 'Hatibandha', 'Kaliganj', 'Patgram'],
      },
      Nilphamari: {
        name: 'Nilphamari',
        bnName: 'নীলফামারী',
        lat: 25.9318,
        lng: 88.8560,
        upazilas: ['Nilphamari Sadar', 'Dimla', 'Domar', 'Jaldhaka', 'Kishoreganj', 'Syedpur'],
      },
      Panchagarh: {
        name: 'Panchagarh',
        bnName: 'পঞ্চগড়',
        lat: 26.3411,
        lng: 88.5542,
        upazilas: ['Panchagarh Sadar', 'Atwari', 'Boda', 'Debiganj', 'Tetulia'],
      },
      Thakurgaon: {
        name: 'Thakurgaon',
        bnName: 'ঠাকুরগাঁও',
        lat: 26.0337,
        lng: 88.4617,
        upazilas: ['Thakurgaon Sadar', 'Baliadangi', 'Haripur', 'Pirganj', 'Ranisankail'],
      },
    },
  },
  Mymensingh: {
    name: 'Mymensingh',
    bnName: 'ময়মনসিংহ',
    lat: 24.7471,
    lng: 90.4203,
    districts: {
      Mymensingh: {
        name: 'Mymensingh',
        bnName: 'ময়মনসিংহ',
        lat: 24.7471,
        lng: 90.4203,
        upazilas: ['Mymensingh Sadar', 'Bhaluka', 'Dhobaura', 'Fulbaria', 'Gafargaon', 'Gauripur', 'Haluaghat', 'Ishwarganj', 'Muktagachha', 'Nandail', 'Phulpur', 'Trishal', 'Tara Khanda'],
      },
      Jamalpur: {
        name: 'Jamalpur',
        bnName: 'জামালপুর',
        lat: 24.9375,
        lng: 89.9378,
        upazilas: ['Jamalpur Sadar', 'Baksiganj', 'Dewanganj', 'Islampur', 'Madarganj', 'Melandaha', 'Sarishabari'],
      },
      Netrokona: {
        name: 'Netrokona',
        bnName: 'নেত্রকোণা',
        lat: 24.8709,
        lng: 90.7279,
        upazilas: ['Netrokona Sadar', 'Atpara', 'Barhatta', 'Durgapur', 'Khaliajuri', 'Kalmakanda', 'Kendua', 'Madan', 'Mohanganj', 'Purbadhala'],
      },
      Sherpur: {
        name: 'Sherpur',
        bnName: 'শেরপুর',
        lat: 25.0205,
        lng: 90.0153,
        upazilas: ['Sherpur Sadar', 'Jhenaigati', 'Nakla', 'Nalitabari', 'Sreebardi'],
      },
    },
  },
};

// Helper lookup functions
export const getDivisionList = (): { value: string; label: string; bnLabel: string }[] => {
  return Object.values(BANGLADESH_DIVISIONS).map((div) => ({
    value: div.name,
    label: div.name,
    bnLabel: div.bnName,
  }));
};

export const getDistrictsByDivision = (
  divisionName: string
): { value: string; label: string; bnLabel: string; lat: number; lng: number }[] => {
  const division = BANGLADESH_DIVISIONS[divisionName];
  if (!division) return [];

  return Object.values(division.districts).map((dist) => ({
    value: dist.name,
    label: dist.name,
    bnLabel: dist.bnName,
    lat: dist.lat,
    lng: dist.lng,
  }));
};

export const getUpazilasByDistrict = (
  divisionName: string,
  districtName: string
): string[] => {
  const division = BANGLADESH_DIVISIONS[divisionName];
  if (!division) return [];
  const district = division.districts[districtName];
  if (!district) return [];
  return district.upazilas;
};

export const getLocationCoordinates = (
  divisionName?: string,
  districtName?: string
): { lat: number; lng: number; zoom: number } => {
  if (divisionName && districtName) {
    const dist = BANGLADESH_DIVISIONS[divisionName]?.districts[districtName];
    if (dist) return { lat: dist.lat, lng: dist.lng, zoom: 11 };
  }

  if (divisionName) {
    const div = BANGLADESH_DIVISIONS[divisionName];
    if (div) return { lat: div.lat, lng: div.lng, zoom: 9 };
  }

  return BANGLADESH_CENTER;
};
