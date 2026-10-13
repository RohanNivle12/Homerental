import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VillageData {
  name: string;
  isUrban?: boolean;
}

interface SubdistrictData {
  name: string;
  villages?: VillageData[];
}

interface DistrictData {
  name: string;
  headquarters?: string;
  subdistricts?: SubdistrictData[];
}

interface StateData {
  code: string;
  name: string;
  type: 'STATE' | 'UT';
  districts: DistrictData[];
}

// Comprehensive Official India LGD Administrative Hierarchy Dataset
const INDIA_LOCATIONS: StateData[] = [
  // 1. Maharashtra
  {
    code: 'MH',
    name: 'Maharashtra',
    type: 'STATE',
    districts: [
      {
        name: 'Kolhapur',
        headquarters: 'Kolhapur',
        subdistricts: [
          {
            name: 'Hatkanangale',
            villages: [
              { name: 'Ichalkaranji', isUrban: true },
              { name: 'Hatkanangale', isUrban: false },
              { name: 'Hupari', isUrban: true },
              { name: 'Shiroli', isUrban: false },
              { name: 'Kabnur', isUrban: true },
              { name: 'Korochi', isUrban: false },
              { name: 'Herwad', isUrban: false },
            ],
          },
          {
            name: 'Karveer',
            villages: [
              { name: 'Kolhapur', isUrban: true },
              { name: 'Gandhinagar', isUrban: true },
              { name: 'Kalamba', isUrban: false },
              { name: 'Uchgaon', isUrban: true },
              { name: 'Vadanage', isUrban: false },
            ],
          },
          {
            name: 'Shirol',
            villages: [
              { name: 'Jaysingpur', isUrban: true },
              { name: 'Shirol', isUrban: false },
              { name: 'Kurundwad', isUrban: true },
            ],
          },
          {
            name: 'Panhala',
            villages: [
              { name: 'Panhala', isUrban: true },
              { name: 'Kodoli', isUrban: false },
            ],
          },
          {
            name: 'Radhanagari',
            villages: [
              { name: 'Radhanagari', isUrban: false },
              { name: 'Tarale', isUrban: false },
            ],
          },
          {
            name: 'Kagal',
            villages: [
              { name: 'Kagal', isUrban: true },
              { name: 'Murgud', isUrban: true },
            ],
          },
          { name: 'Gadhinglaj', villages: [{ name: 'Gadhinglaj', isUrban: true }] },
          { name: 'Bhudargad', villages: [{ name: 'Gargoti', isUrban: false }] },
          { name: 'Ajra', villages: [{ name: 'Ajra', isUrban: false }] },
          { name: 'Chandgad', villages: [{ name: 'Chandgad', isUrban: false }] },
          { name: 'Shahuwadi', villages: [{ name: 'Malkapur', isUrban: true }] },
          { name: 'Bawda', villages: [{ name: 'Gaganbawda', isUrban: false }] },
        ],
      },
      {
        name: 'Nashik',
        headquarters: 'Nashik',
        subdistricts: [
          {
            name: 'Sinnar',
            villages: [
              { name: 'Sinnar', isUrban: true },
              { name: 'Musalgaon MIDC', isUrban: true },
              { name: 'Pandhurli', isUrban: false },
              { name: 'Wavi', isUrban: false },
              { name: 'Dapur', isUrban: false },
            ],
          },
          {
            name: 'Nashik',
            villages: [
              { name: 'Nashik', isUrban: true },
              { name: 'Deolali', isUrban: true },
              { name: 'Satpur MIDC', isUrban: true },
              { name: 'Ambad MIDC', isUrban: true },
              { name: 'Gangapur Road', isUrban: true },
              { name: 'Indira Nagar', isUrban: true },
            ],
          },
          {
            name: 'Niphad',
            villages: [
              { name: 'Niphad', isUrban: false },
              { name: 'Pimpalgaon Baswant', isUrban: true },
              { name: 'Ozar', isUrban: true },
            ],
          },
          { name: 'Dindori', villages: [{ name: 'Dindori', isUrban: false }, { name: 'Vani', isUrban: false }] },
          { name: 'Igatpuri', villages: [{ name: 'Igatpuri', isUrban: true }, { name: 'Ghoti', isUrban: false }] },
          { name: 'Malegaon', villages: [{ name: 'Malegaon', isUrban: true }] },
          { name: 'Trimbakeshwar', villages: [{ name: 'Trimbak', isUrban: true }] },
          { name: 'Yeola', villages: [{ name: 'Yeola', isUrban: true }] },
          { name: 'Baglan', villages: [{ name: 'Satana', isUrban: true }] },
        ],
      },
      {
        name: 'Pune',
        headquarters: 'Pune',
        subdistricts: [
          {
            name: 'Haveli',
            villages: [
              { name: 'Hinjewadi', isUrban: true },
              { name: 'Wakad', isUrban: true },
              { name: 'Kharadi', isUrban: true },
              { name: 'Wagholi', isUrban: true },
              { name: 'Hadapsar', isUrban: true },
              { name: 'Pimpri-Chinchwad', isUrban: true },
            ],
          },
          {
            name: 'Pune City',
            villages: [
              { name: 'Shivaji Nagar', isUrban: true },
              { name: 'Kothrud', isUrban: true },
              { name: 'Aundh', isUrban: true },
              { name: 'Baner', isUrban: true },
              { name: 'Viman Nagar', isUrban: true },
              { name: 'Koregaon Park', isUrban: true },
            ],
          },
          { name: 'Maval', villages: [{ name: 'Lonavala', isUrban: true }, { name: 'Talegaon Dabhade', isUrban: true }] },
          { name: 'Baramati', villages: [{ name: 'Baramati', isUrban: true }] },
          { name: 'Shirur', villages: [{ name: 'Shirur', isUrban: true }, { name: 'Ranjangaon MIDC', isUrban: true }] },
        ],
      },
      {
        name: 'Mumbai Suburban',
        headquarters: 'Bandra',
        subdistricts: [
          {
            name: 'Kurla',
            villages: [
              { name: 'Bandra West', isUrban: true },
              { name: 'Bandra East', isUrban: true },
              { name: 'Kurla', isUrban: true },
              { name: 'Chembur', isUrban: true },
              { name: 'Ghatkopar', isUrban: true },
            ],
          },
          {
            name: 'Andheri',
            villages: [
              { name: 'Andheri West', isUrban: true },
              { name: 'Andheri East', isUrban: true },
              { name: 'Juhu', isUrban: true },
              { name: 'Versova', isUrban: true },
              { name: 'Vile Parle', isUrban: true },
            ],
          },
          {
            name: 'Borivali',
            villages: [
              { name: 'Borivali', isUrban: true },
              { name: 'Kandivali', isUrban: true },
              { name: 'Malad', isUrban: true },
              { name: 'Goregaon', isUrban: true },
            ],
          },
        ],
      },
      {
        name: 'Mumbai City',
        headquarters: 'Mumbai',
        subdistricts: [
          {
            name: 'South Mumbai',
            villages: [
              { name: 'Colaba', isUrban: true },
              { name: 'Fort', isUrban: true },
              { name: 'Marine Lines', isUrban: true },
              { name: 'Dadar', isUrban: true },
              { name: 'Worli', isUrban: true },
              { name: 'Lower Parel', isUrban: true },
            ],
          },
        ],
      },
      {
        name: 'Thane',
        headquarters: 'Thane',
        subdistricts: [
          {
            name: 'Thane',
            villages: [
              { name: 'Thane West', isUrban: true },
              { name: 'Majiwada', isUrban: true },
              { name: 'Ghodbunder Road', isUrban: true },
              { name: 'Naupada', isUrban: true },
            ],
          },
          { name: 'Kalyan', villages: [{ name: 'Kalyan', isUrban: true }, { name: 'Dombivli', isUrban: true }] },
          { name: 'Ulhasnagar', villages: [{ name: 'Ulhasnagar', isUrban: true }] },
          { name: 'Bhiwandi', villages: [{ name: 'Bhiwandi', isUrban: true }] },
        ],
      },
      {
        name: 'Nagpur',
        headquarters: 'Nagpur',
        subdistricts: [
          {
            name: 'Nagpur Urban',
            villages: [
              { name: 'Dharampeth', isUrban: true },
              { name: 'Sitabuldi', isUrban: true },
              { name: 'Sadar', isUrban: true },
              { name: 'Manish Nagar', isUrban: true },
            ],
          },
          { name: 'Hingna', villages: [{ name: 'Hingna MIDC', isUrban: true }] },
        ],
      },
      {
        name: 'Chhatrapati Sambhajinagar',
        headquarters: 'Aurangabad',
        subdistricts: [
          {
            name: 'Aurangabad',
            villages: [
              { name: 'CIDCO', isUrban: true },
              { name: 'Waluj MIDC', isUrban: true },
              { name: 'Shendra MIDC', isUrban: true },
            ],
          },
        ],
      },
      {
        name: 'Sangli',
        headquarters: 'Sangli',
        subdistricts: [
          {
            name: 'Miraj',
            villages: [
              { name: 'Sangli', isUrban: true },
              { name: 'Miraj', isUrban: true },
              { name: 'Kupwad', isUrban: true },
            ],
          },
          { name: 'Walwa', villages: [{ name: 'Islampur', isUrban: true }] },
        ],
      },
      {
        name: 'Satara',
        headquarters: 'Satara',
        subdistricts: [
          { name: 'Satara', villages: [{ name: 'Satara City', isUrban: true }] },
          { name: 'Karad', villages: [{ name: 'Karad', isUrban: true }] },
          { name: 'Mahabaleshwar', villages: [{ name: 'Mahabaleshwar', isUrban: true }, { name: 'Panchgani', isUrban: true }] },
        ],
      },
      {
        name: 'Solapur',
        headquarters: 'Solapur',
        subdistricts: [
          { name: 'Solapur North', villages: [{ name: 'Solapur City', isUrban: true }] },
          { name: 'Pandharpur', villages: [{ name: 'Pandharpur', isUrban: true }] },
        ],
      },
      {
        name: 'Ahmednagar',
        headquarters: 'Ahmednagar',
        subdistricts: [
          { name: 'Ahmednagar', villages: [{ name: 'Ahmednagar City', isUrban: true }] },
          { name: 'Rahata', villages: [{ name: 'Shirdi', isUrban: true }] },
        ],
      },
      // Additional Maharashtra Districts
      { name: 'Akola' }, { name: 'Amravati' }, { name: 'Beed' }, { name: 'Bhandara' },
      { name: 'Buldhana' }, { name: 'Chandrapur' }, { name: 'Dhule' }, { name: 'Gadchiroli' },
      { name: 'Gondia' }, { name: 'Hingoli' }, { name: 'Jalgaon' }, { name: 'Jalna' },
      { name: 'Latur' }, { name: 'Nanded' }, { name: 'Nandurbar' }, { name: 'Dharashiv' },
      { name: 'Parbhani' }, { name: 'Raigad' }, { name: 'Ratnagiri' }, { name: 'Sindhudurg' },
      { name: 'Wardha' }, { name: 'Washim' }, { name: 'Yavatmal' }, { name: 'Palghar' },
    ],
  },

  // 2. Karnataka
  {
    code: 'KA',
    name: 'Karnataka',
    type: 'STATE',
    districts: [
      {
        name: 'Belagavi',
        headquarters: 'Belagavi',
        subdistricts: [
          {
            name: 'Chikodi',
            villages: [
              { name: 'Nipani', isUrban: true },
              { name: 'Chikodi', isUrban: true },
              { name: 'Sadalga', isUrban: false },
              { name: 'Borgaon', isUrban: false },
            ],
          },
          {
            name: 'Belagavi',
            villages: [
              { name: 'Belagavi City', isUrban: true },
              { name: 'Tilakwadi', isUrban: true },
              { name: 'Vadgaon', isUrban: true },
              { name: 'Shahapur', isUrban: true },
            ],
          },
          { name: 'Gokak', villages: [{ name: 'Gokak', isUrban: true }] },
          { name: 'Athani', villages: [{ name: 'Athani', isUrban: true }] },
          { name: 'Hukkeri', villages: [{ name: 'Hukkeri', isUrban: false }, { name: 'Sankeshwar', isUrban: true }] },
          { name: 'Bailhongal', villages: [{ name: 'Bailhongal', isUrban: true }] },
          { name: 'Khanapur', villages: [{ name: 'Khanapur', isUrban: false }] },
        ],
      },
      {
        name: 'Bengaluru Urban',
        headquarters: 'Bengaluru',
        subdistricts: [
          {
            name: 'Bangalore South',
            villages: [
              { name: 'Koramangala', isUrban: true },
              { name: 'HSR Layout', isUrban: true },
              { name: 'BTM Layout', isUrban: true },
              { name: 'JP Nagar', isUrban: true },
              { name: 'Jayanagar', isUrban: true },
              { name: 'Bannerghatta Road', isUrban: true },
            ],
          },
          {
            name: 'Bangalore East',
            villages: [
              { name: 'Whitefield', isUrban: true },
              { name: 'Indiranagar', isUrban: true },
              { name: 'Marathahalli', isUrban: true },
              { name: 'Bellandur', isUrban: true },
              { name: 'Sarjapur Road', isUrban: true },
            ],
          },
          {
            name: 'Bangalore North',
            villages: [
              { name: 'Hebbal', isUrban: true },
              { name: 'Yelahanka', isUrban: true },
              { name: 'Malleshwaram', isUrban: true },
              { name: 'Manyata Tech Park', isUrban: true },
            ],
          },
          {
            name: 'Anekal',
            villages: [
              { name: 'Electronic City', isUrban: true },
              { name: 'Chandapura', isUrban: true },
              { name: 'Attibele', isUrban: false },
              { name: 'Bommasandra', isUrban: true },
            ],
          },
        ],
      },
      {
        name: 'Mysuru',
        headquarters: 'Mysuru',
        subdistricts: [
          {
            name: 'Mysuru',
            villages: [
              { name: 'Gokulam', isUrban: true },
              { name: 'Vijayanagar', isUrban: true },
              { name: 'Kuvempunagar', isUrban: true },
              { name: 'Jayalakshmipuram', isUrban: true },
            ],
          },
          { name: 'Nanjangud', villages: [{ name: 'Nanjangud', isUrban: true }] },
        ],
      },
      {
        name: 'Dakshina Kannada',
        headquarters: 'Mangaluru',
        subdistricts: [
          {
            name: 'Mangaluru',
            villages: [
              { name: 'Mangaluru City', isUrban: true },
              { name: 'Surathkal', isUrban: true },
              { name: 'Kadri', isUrban: true },
            ],
          },
        ],
      },
      {
        name: 'Dharwad',
        headquarters: 'Dharwad',
        subdistricts: [
          {
            name: 'Hubballi Urban',
            villages: [
              { name: 'Vidyanagar', isUrban: true },
              { name: 'Navanagar', isUrban: true },
            ],
          },
        ],
      },
      // Additional Karnataka Districts
      { name: 'Bagalkote' }, { name: 'Ballari' }, { name: 'Bidar' }, { name: 'Chamarajanagar' },
      { name: 'Chikkaballapura' }, { name: 'Chikkamagaluru' }, { name: 'Chitradurga' }, { name: 'Davanagere' },
      { name: 'Gadag' }, { name: 'Hassan' }, { name: 'Haveri' }, { name: 'Kalaburagi' },
      { name: 'Kodagu' }, { name: 'Kolar' }, { name: 'Koppal' }, { name: 'Mandya' },
      { name: 'Raichur' }, { name: 'Ramanagara' }, { name: 'Shivamogga' }, { name: 'Tumakuru' },
      { name: 'Udupi' }, { name: 'Uttara Kannada' }, { name: 'Vijayapura' }, { name: 'Yadgir' },
      { name: 'Vijayanagara' },
    ],
  },

  // 3. Delhi (UT)
  {
    code: 'DL',
    name: 'Delhi',
    type: 'UT',
    districts: [
      {
        name: 'New Delhi',
        headquarters: 'Connaught Place',
        subdistricts: [
          {
            name: 'Chanakyapuri',
            villages: [
              { name: 'Connaught Place', isUrban: true },
              { name: 'Barakhamba', isUrban: true },
              { name: 'Chanakyapuri', isUrban: true },
            ],
          },
          {
            name: 'Vasant Vihar',
            villages: [
              { name: 'Vasant Vihar', isUrban: true },
              { name: 'Vasant Kunj', isUrban: true },
            ],
          },
        ],
      },
      {
        name: 'South Delhi',
        headquarters: 'Saket',
        subdistricts: [
          {
            name: 'Hauz Khas',
            villages: [
              { name: 'Hauz Khas', isUrban: true },
              { name: 'Greater Kailash', isUrban: true },
              { name: 'Green Park', isUrban: true },
            ],
          },
          {
            name: 'Saket',
            villages: [
              { name: 'Saket', isUrban: true },
              { name: 'Malviya Nagar', isUrban: true },
              { name: 'Sainik Farm', isUrban: true },
            ],
          },
        ],
      },
      {
        name: 'South West Delhi',
        headquarters: 'Dwarka',
        subdistricts: [
          {
            name: 'Dwarka',
            villages: [
              { name: 'Dwarka Sector 6', isUrban: true },
              { name: 'Dwarka Sector 12', isUrban: true },
              { name: 'Dwarka Sector 21', isUrban: true },
            ],
          },
        ],
      },
      { name: 'Central Delhi' }, { name: 'East Delhi' }, { name: 'North Delhi' },
      { name: 'North East Delhi' }, { name: 'North West Delhi' }, { name: 'Shahdara' },
      { name: 'South East Delhi' }, { name: 'West Delhi' },
    ],
  },

  // 4. Uttar Pradesh
  {
    code: 'UP',
    name: 'Uttar Pradesh',
    type: 'STATE',
    districts: [
      {
        name: 'Gautam Buddha Nagar',
        headquarters: 'Noida',
        subdistricts: [
          {
            name: 'Noida',
            villages: [
              { name: 'Sector 62', isUrban: true },
              { name: 'Sector 18', isUrban: true },
              { name: 'Sector 137', isUrban: true },
              { name: 'Sector 150', isUrban: true },
            ],
          },
          {
            name: 'Greater Noida',
            villages: [
              { name: 'Pari Chowk', isUrban: true },
              { name: 'Alpha 1', isUrban: true },
              { name: 'Knowledge Park', isUrban: true },
            ],
          },
        ],
      },
      {
        name: 'Ghaziabad',
        headquarters: 'Ghaziabad',
        subdistricts: [
          {
            name: 'Ghaziabad',
            villages: [
              { name: 'Indirapuram', isUrban: true },
              { name: 'Vaishali', isUrban: true },
              { name: 'Raj Nagar Extension', isUrban: true },
              { name: 'Vasundhara', isUrban: true },
            ],
          },
        ],
      },
      {
        name: 'Lucknow',
        headquarters: 'Lucknow',
        subdistricts: [
          {
            name: 'Lucknow',
            villages: [
              { name: 'Gomti Nagar', isUrban: true },
              { name: 'Hazratganj', isUrban: true },
              { name: 'Alambagh', isUrban: true },
              { name: 'Indira Nagar', isUrban: true },
            ],
          },
        ],
      },
      { name: 'Kanpur Nagar' }, { name: 'Varanasi' }, { name: 'Agra' }, { name: 'Prayagraj' },
      { name: 'Meerut' }, { name: 'Mathura' }, { name: 'Ayodhya' }, { name: 'Bareilly' },
      { name: 'Aligarh' }, { name: 'Moradabad' }, { name: 'Gorakhpur' }, { name: 'Jhansi' },
    ],
  },

  // 5. Haryana
  {
    code: 'HR',
    name: 'Haryana',
    type: 'STATE',
    districts: [
      {
        name: 'Gurugram',
        headquarters: 'Gurugram',
        subdistricts: [
          {
            name: 'Gurgaon',
            villages: [
              { name: 'DLF Cyber City', isUrban: true },
              { name: 'Golf Course Road', isUrban: true },
              { name: 'Sohna Road', isUrban: true },
              { name: 'Sector 56', isUrban: true },
              { name: 'Sector 57', isUrban: true },
              { name: 'Manesar', isUrban: true },
            ],
          },
        ],
      },
      {
        name: 'Faridabad',
        headquarters: 'Faridabad',
        subdistricts: [
          {
            name: 'Faridabad',
            villages: [
              { name: 'NIT Faridabad', isUrban: true },
              { name: 'Sector 15', isUrban: true },
            ],
          },
        ],
      },
      { name: 'Panchkula' }, { name: 'Sonipat' }, { name: 'Panipat' }, { name: 'Karnal' },
      { name: 'Ambala' }, { name: 'Rohtak' }, { name: 'Hisar' },
    ],
  },

  // 6. Telangana
  {
    code: 'TS',
    name: 'Telangana',
    type: 'STATE',
    districts: [
      {
        name: 'Hyderabad',
        headquarters: 'Hyderabad',
        subdistricts: [
          {
            name: 'Shaikpet',
            villages: [
              { name: 'Banjara Hills', isUrban: true },
              { name: 'Jubilee Hills', isUrban: true },
            ],
          },
          {
            name: 'Serilingampally',
            villages: [
              { name: 'Gachibowli', isUrban: true },
              { name: 'Madhapur', isUrban: true },
              { name: 'Hitech City', isUrban: true },
              { name: 'Kondapur', isUrban: true },
            ],
          },
          {
            name: 'Kukatpally',
            villages: [
              { name: 'Kukatpally', isUrban: true },
              { name: 'KPHB Colony', isUrban: true },
            ],
          },
        ],
      },
      { name: 'Medchal-Malkajgiri' }, { name: 'Rangareddy' }, { name: 'Warangal' },
      { name: 'Karimnagar' }, { name: 'Nizamabad' }, { name: 'Khammam' },
    ],
  },

  // 7. Tamil Nadu
  {
    code: 'TN',
    name: 'Tamil Nadu',
    type: 'STATE',
    districts: [
      {
        name: 'Chennai',
        headquarters: 'Chennai',
        subdistricts: [
          {
            name: 'Guindy',
            villages: [
              { name: 'T. Nagar', isUrban: true },
              { name: 'Velachery', isUrban: true },
              { name: 'Guindy', isUrban: true },
            ],
          },
          {
            name: 'Mylapore',
            villages: [
              { name: 'Mylapore', isUrban: true },
              { name: 'Adyar', isUrban: true },
              { name: 'Thiruvanmiyur', isUrban: true },
            ],
          },
          {
            name: 'Sholinganallur',
            villages: [
              { name: 'OMR - IT Corridor', isUrban: true },
              { name: 'Perungudi', isUrban: true },
            ],
          },
        ],
      },
      { name: 'Coimbatore' }, { name: 'Madurai' }, { name: 'Tiruchirappalli' },
      { name: 'Salem' }, { name: 'Tiruppur' }, { name: 'Vellore' },
    ],
  },

  // 8. Gujarat
  {
    code: 'GJ',
    name: 'Gujarat',
    type: 'STATE',
    districts: [
      {
        name: 'Ahmedabad',
        headquarters: 'Ahmedabad',
        subdistricts: [
          {
            name: 'Ahmedabad City',
            villages: [
              { name: 'Satellite', isUrban: true },
              { name: 'Bodakdev', isUrban: true },
              { name: 'SG Highway', isUrban: true },
              { name: 'Prahlad Nagar', isUrban: true },
              { name: 'Vastrapur', isUrban: true },
            ],
          },
        ],
      },
      { name: 'Surat' }, { name: 'Vadodara' }, { name: 'Rajkot' }, { name: 'Gandhinagar' },
      { name: 'Bhavnagar' }, { name: 'Jamnagar' }, { name: 'Anand' },
    ],
  },

  // 9. West Bengal
  {
    code: 'WB',
    name: 'West Bengal',
    type: 'STATE',
    districts: [
      {
        name: 'Kolkata',
        headquarters: 'Kolkata',
        subdistricts: [
          {
            name: 'Kolkata',
            villages: [
              { name: 'Park Street', isUrban: true },
              { name: 'Ballygunge', isUrban: true },
              { name: 'Alipore', isUrban: true },
            ],
          },
        ],
      },
      {
        name: 'North 24 Parganas',
        headquarters: 'Barasat',
        subdistricts: [
          {
            name: 'Bidhannagar',
            villages: [
              { name: 'Salt Lake City', isUrban: true },
              { name: 'New Town', isUrban: true },
              { name: 'Rajarhat', isUrban: true },
            ],
          },
        ],
      },
      { name: 'Howrah' }, { name: 'Darjeeling' }, { name: 'Paschim Bardhaman' },
    ],
  },

  // 10. Rajasthan
  {
    code: 'RJ',
    name: 'Rajasthan',
    type: 'STATE',
    districts: [
      {
        name: 'Jaipur',
        headquarters: 'Jaipur',
        subdistricts: [
          {
            name: 'Jaipur',
            villages: [
              { name: 'Malviya Nagar', isUrban: true },
              { name: 'Vaishali Nagar', isUrban: true },
              { name: 'Mansarovar', isUrban: true },
              { name: 'C-Scheme', isUrban: true },
            ],
          },
        ],
      },
      { name: 'Jodhpur' }, { name: 'Udaipur' }, { name: 'Kota' }, { name: 'Ajmer' },
    ],
  },

  // 11. Kerala
  {
    code: 'KL',
    name: 'Kerala',
    type: 'STATE',
    districts: [
      {
        name: 'Ernakulam',
        headquarters: 'Kakkanad',
        subdistricts: [
          {
            name: 'Kakkanad',
            villages: [
              { name: 'Infopark Kakkanad', isUrban: true },
              { name: 'Marine Drive', isUrban: true },
              { name: 'Edappally', isUrban: true },
              { name: 'Panampilly Nagar', isUrban: true },
            ],
          },
        ],
      },
      { name: 'Thiruvananthapuram' }, { name: 'Kozhikode' }, { name: 'Thrissur' },
    ],
  },

  // 12. Punjab
  {
    code: 'PB',
    name: 'Punjab',
    type: 'STATE',
    districts: [
      { name: 'SAS Nagar (Mohali)' }, { name: 'Ludhiana' }, { name: 'Amritsar' }, { name: 'Jalandhar' },
    ],
  },

  // 13. Madhya Pradesh
  {
    code: 'MP',
    name: 'Madhya Pradesh',
    type: 'STATE',
    districts: [
      {
        name: 'Indore',
        subdistricts: [
          { name: 'Indore', villages: [{ name: 'Vijay Nagar', isUrban: true }, { name: 'Palasia', isUrban: true }] },
        ],
      },
      {
        name: 'Bhopal',
        subdistricts: [
          { name: 'Bhopal', villages: [{ name: 'Arera Colony', isUrban: true }, { name: 'MP Nagar', isUrban: true }] },
        ],
      },
      { name: 'Gwalior' }, { name: 'Jabalpur' }, { name: 'Ujjain' },
    ],
  },

  // 14. Bihar
  {
    code: 'BR',
    name: 'Bihar',
    type: 'STATE',
    districts: [
      {
        name: 'Patna',
        subdistricts: [
          { name: 'Patna Sadar', villages: [{ name: 'Boring Road', isUrban: true }, { name: 'Kankarbagh', isUrban: true }] },
        ],
      },
      { name: 'Gaya' }, { name: 'Bhagalpur' }, { name: 'Muzaffarpur' },
    ],
  },

  // 15. Andhra Pradesh
  {
    code: 'AP',
    name: 'Andhra Pradesh',
    type: 'STATE',
    districts: [
      { name: 'Visakhapatnam' }, { name: 'Vijayawada (NTR)' }, { name: 'Guntur' }, { name: 'Tirupati' },
    ],
  },

  // 16. Odisha
  {
    code: 'OD',
    name: 'Odisha',
    type: 'STATE',
    districts: [
      {
        name: 'Khordha',
        subdistricts: [
          { name: 'Bhubaneswar', villages: [{ name: 'Patia', isUrban: true }, { name: 'Saheed Nagar', isUrban: true }] },
        ],
      },
      { name: 'Cuttack' }, { name: 'Puri' }, { name: 'Sundargarh' },
    ],
  },

  // 17. Assam
  { code: 'AS', name: 'Assam', type: 'STATE', districts: [{ name: 'Kamrup Metropolitan (Guwahati)' }, { name: 'Dibrugarh' }, { name: 'Silchar' }] },
  // 18. Chhattisgarh
  { code: 'CG', name: 'Chhattisgarh', type: 'STATE', districts: [{ name: 'Raipur' }, { name: 'Durg-Bhilai' }, { name: 'Bilaspur' }] },
  // 19. Goa
  { code: 'GA', name: 'Goa', type: 'STATE', districts: [{ name: 'North Goa (Panaji)' }, { name: 'South Goa (Margao)' }] },
  // 20. Himachal Pradesh
  { code: 'HP', name: 'Himachal Pradesh', type: 'STATE', districts: [{ name: 'Shimla' }, { name: 'Kangra (Dharamshala)' }, { name: 'Kullu (Manali)' }] },
  // 21. Jharkhand
  { code: 'JH', name: 'Jharkhand', type: 'STATE', districts: [{ name: 'Ranchi' }, { name: 'East Singhbhum (Jamshedpur)' }, { name: 'Dhanbad' }] },
  // 22. Uttarakhand
  { code: 'UK', name: 'Uttarakhand', type: 'STATE', districts: [{ name: 'Dehradun' }, { name: 'Haridwar' }, { name: 'Nainital' }] },
  // 23. Arunachal Pradesh
  { code: 'AR', name: 'Arunachal Pradesh', type: 'STATE', districts: [{ name: 'Papum Pare (Itanagar)' }, { name: 'Tawang' }] },
  // 24. Manipur
  { code: 'MN', name: 'Manipur', type: 'STATE', districts: [{ name: 'Imphal West' }, { name: 'Imphal East' }] },
  // 25. Meghalaya
  { code: 'ML', name: 'Meghalaya', type: 'STATE', districts: [{ name: 'East Khasi Hills (Shillong)' }] },
  // 26. Mizoram
  { code: 'MZ', name: 'Mizoram', type: 'STATE', districts: [{ name: 'Aizawl' }] },
  // 27. Nagaland
  { code: 'NL', name: 'Nagaland', type: 'STATE', districts: [{ name: 'Kohima' }, { name: 'Dimapur' }] },
  // 28. Sikkim
  { code: 'SK', name: 'Sikkim', type: 'STATE', districts: [{ name: 'Gangtok' }] },
  // 29. Tripura
  { code: 'TR', name: 'Tripura', type: 'STATE', districts: [{ name: 'West Tripura (Agartala)' }] },

  // Union Territories:
  // 30. Chandigarh
  { code: 'CH', name: 'Chandigarh', type: 'UT', districts: [{ name: 'Chandigarh' }] },
  // 31. Jammu and Kashmir
  { code: 'JK', name: 'Jammu and Kashmir', type: 'UT', districts: [{ name: 'Srinagar' }, { name: 'Jammu' }] },
  // 32. Ladakh
  { code: 'LA', name: 'Ladakh', type: 'UT', districts: [{ name: 'Leh' }, { name: 'Kargil' }] },
  // 33. Puducherry
  { code: 'PY', name: 'Puducherry', type: 'UT', districts: [{ name: 'Puducherry' }, { name: 'Karaikal' }] },
  // 34. Andaman and Nicobar Islands
  { code: 'AN', name: 'Andaman and Nicobar Islands', type: 'UT', districts: [{ name: 'South Andaman (Port Blair)' }] },
  // 35. Dadra and Nagar Haveli and Daman and Diu
  { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'UT', districts: [{ name: 'Daman' }, { name: 'Diu' }, { name: 'Dadra and Nagar Haveli' }] },
  // 36. Lakshadweep
  { code: 'LD', name: 'Lakshadweep', type: 'UT', districts: [{ name: 'Lakshadweep (Kavaratti)' }] },
];

const PINCODES_SEED = [
  { pincode: '416115', officeName: 'Ichalkaranji SO', taluk: 'Hatkanangale', districtName: 'Kolhapur', stateName: 'Maharashtra', latitude: 16.7000, longitude: 74.4600 },
  { pincode: '422112', officeName: 'Musalgaon SO', taluk: 'Sinnar', districtName: 'Nashik', stateName: 'Maharashtra', latitude: 19.8500, longitude: 74.0000 },
  { pincode: '591237', officeName: 'Nipani SO', taluk: 'Chikodi', districtName: 'Belagavi', stateName: 'Karnataka', latitude: 16.4000, longitude: 74.3800 },
  { pincode: '560034', officeName: 'Koramangala VI Block SO', taluk: 'Bangalore South', districtName: 'Bengaluru Urban', stateName: 'Karnataka', latitude: 12.9352, longitude: 77.6245 },
  { pincode: '560100', officeName: 'Electronic City SO', taluk: 'Anekal', districtName: 'Bengaluru Urban', stateName: 'Karnataka', latitude: 12.8452, longitude: 77.6602 },
  { pincode: '411057', officeName: 'Infotech Park SO (Hinjewadi)', taluk: 'Haveli', districtName: 'Pune', stateName: 'Maharashtra', latitude: 18.5913, longitude: 73.7389 },
  { pincode: '400050', officeName: 'Bandra West SO', taluk: 'Kurla', districtName: 'Mumbai Suburban', stateName: 'Maharashtra', latitude: 19.0596, longitude: 72.8295 },
  { pincode: '110001', officeName: 'New Delhi GPO (Connaught Place)', taluk: 'Chanakyapuri', districtName: 'New Delhi', stateName: 'Delhi', latitude: 28.6315, longitude: 77.2167 },
  { pincode: '201301', officeName: 'Noida Sector 16 SO', taluk: 'Noida', districtName: 'Gautam Buddha Nagar', stateName: 'Uttar Pradesh', latitude: 28.5830, longitude: 77.3150 },
  { pincode: '122002', officeName: 'DLF Phase 2 SO', taluk: 'Gurgaon', districtName: 'Gurugram', stateName: 'Haryana', latitude: 28.4870, longitude: 77.0860 },
  { pincode: '500081', officeName: 'Madhapur SO (Hitech City)', taluk: 'Serilingampally', districtName: 'Hyderabad', stateName: 'Telangana', latitude: 17.4483, longitude: 78.3915 },
  { pincode: '600096', officeName: 'Perungudi SO (OMR)', taluk: 'Sholinganallur', districtName: 'Chennai', stateName: 'Tamil Nadu', latitude: 12.9654, longitude: 80.2461 },
  { pincode: '380015', officeName: 'Satellite Road SO', taluk: 'Ahmedabad City', districtName: 'Ahmedabad', stateName: 'Gujarat', latitude: 23.0300, longitude: 72.5200 },
];

export async function seedLocations() {
  console.log('Seeding India-Wide Administrative Location Hierarchy (LGD)...');

  let stateCount = 0;
  let districtCount = 0;
  let subdistrictCount = 0;
  let villageCount = 0;

  for (const s of INDIA_LOCATIONS) {
    const stateRecord = await prisma.state.upsert({
      where: { code: s.code },
      update: { name: s.name, type: s.type },
      create: { code: s.code, name: s.name, type: s.type },
    });
    stateCount++;

    for (const d of s.districts) {
      const districtRecord = await prisma.district.upsert({
        where: {
          stateId_name: {
            stateId: stateRecord.id,
            name: d.name,
          },
        },
        update: { headquarters: d.headquarters || null },
        create: {
          stateId: stateRecord.id,
          name: d.name,
          headquarters: d.headquarters || null,
        },
      });
      districtCount++;

      if (d.subdistricts) {
        for (const sub of d.subdistricts) {
          const subdistrictRecord = await prisma.subdistrict.upsert({
            where: {
              districtId_name: {
                districtId: districtRecord.id,
                name: sub.name,
              },
            },
            update: {},
            create: {
              districtId: districtRecord.id,
              name: sub.name,
            },
          });
          subdistrictCount++;

          if (sub.villages) {
            for (const v of sub.villages) {
              const existingVillage = await prisma.village.findFirst({
                where: {
                  subdistrictId: subdistrictRecord.id,
                  name: v.name,
                },
              });

              if (!existingVillage) {
                await prisma.village.create({
                  data: {
                    subdistrictId: subdistrictRecord.id,
                    name: v.name,
                    isUrban: v.isUrban ?? false,
                  },
                });
              }
              villageCount++;
            }
          }
        }
      }
    }
  }

  // Seed representative PIN codes
  for (const pin of PINCODES_SEED) {
    const existing = await prisma.pincodeDirectory.findFirst({
      where: { pincode: pin.pincode, officeName: pin.officeName },
    });
    if (!existing) {
      await prisma.pincodeDirectory.create({
        data: pin,
      });
    }
  }

  console.log(`Location Hierarchy Seeded:
  - States & Union Territories: ${stateCount}
  - Districts: ${districtCount}
  - Subdistricts (Talukas/Tehsils): ${subdistrictCount}
  - Cities/Towns/Villages: ${villageCount}
  - Pincodes: ${PINCODES_SEED.length}`);

  // Link any existing properties without location relations by matching state/city names
  const unlinkedProperties = await prisma.property.findMany({
    where: { stateId: null },
  });

  for (const prop of unlinkedProperties) {
    // Try to match state
    const matchedState = await prisma.state.findFirst({
      where: {
        OR: [
          { name: { contains: prop.state } },
          { code: prop.state.toUpperCase() },
        ],
      },
    });

    if (matchedState) {
      const matchedDistrict = await prisma.district.findFirst({
        where: {
          stateId: matchedState.id,
          name: { contains: prop.city },
        },
      });

      await prisma.property.update({
        where: { id: prop.id },
        data: {
          stateId: matchedState.id,
          districtId: matchedDistrict ? matchedDistrict.id : undefined,
        },
      });
    }
  }
}

if (require.main === module) {
  seedLocations()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error('Location seeding error:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
