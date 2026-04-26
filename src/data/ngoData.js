export const ngos = [
  {
    id: "ngo-1",
    name: "Green Bengaluru Trust",
    locality_name: "Whitefield",
    pincode: "560066",
    issues_reported: 142,
    issues_resolved: 120,
    efficiency: 84.5,
    contact: "contact@greenbengaluru.org",
    lat: 12.9698,
    lng: 77.7499,
    description: "Dedicated to reducing urban waste and improving air quality in the eastern tech corridors."
  },
  {
    id: "ngo-2",
    name: "Clean City Initiative",
    locality_name: "Electronic City",
    pincode: "560100",
    issues_reported: 98,
    issues_resolved: 90,
    efficiency: 91.8,
    contact: "hello@cleancity.in",
    lat: 12.8399,
    lng: 77.6770,
    description: "Focusing on e-waste management and sustainable water practices in IT hubs."
  },
  {
    id: "ngo-3",
    name: "Save Our Lakes",
    locality_name: "Bellandur",
    pincode: "560103",
    issues_reported: 215,
    issues_resolved: 160,
    efficiency: 74.4,
    contact: "action@saveourlakes.org",
    description: "Protecting Bellandur and surrounding lakes from industrial effluents and sewage dumping."
  },
  {
    id: "ngo-4",
    name: "EcoWarriors BTM",
    locality_name: "BTM Layout",
    pincode: "560068",
    issues_reported: 65,
    issues_resolved: 60,
    efficiency: 92.3,
    contact: "btm@ecowarriors.in",
    description: "Community-driven garbage segregation and zero-waste initiatives."
  },
  {
    id: "ngo-5",
    name: "Namma Indiranagar",
    locality_name: "Indiranagar",
    pincode: "560038",
    issues_reported: 88,
    issues_resolved: 80,
    efficiency: 90.9,
    contact: "team@nammaindiranagar.org",
    description: "Tackling commercial noise pollution, illegal parking, and waste mismanagement."
  },
  {
    id: "ngo-6",
    name: "Koramangala Care",
    locality_name: "Koramangala",
    pincode: "560034",
    issues_reported: 120,
    issues_resolved: 95,
    efficiency: 79.1,
    contact: "support@koramangalacare.in",
    description: "Ensuring clean streets and preserving green cover in residential blocks."
  },
  {
    id: "ngo-7",
    name: "Jayanagar Green Cover",
    locality_name: "Jayanagar",
    pincode: "560011",
    issues_reported: 45,
    issues_resolved: 42,
    efficiency: 93.3,
    contact: "green@jayanagar.org",
    description: "Tree planting campaigns and monitoring air quality in southern Bengaluru."
  },
  {
    id: "ngo-8",
    name: "Banashankari Action Group",
    locality_name: "Banashankari",
    pincode: "560050",
    issues_reported: 76,
    issues_resolved: 65,
    efficiency: 85.5,
    contact: "action@bskgroup.in",
    description: "Managing solid waste and educating communities on composting."
  },
  {
    id: "ngo-9",
    name: "Rajajinagar Clean Streets",
    locality_name: "Rajajinagar",
    pincode: "560010",
    issues_reported: 54,
    issues_resolved: 48,
    efficiency: 88.8,
    contact: "clean@rajajinagar.org",
    description: "Advocating for better civic amenities and swift pothole repairs."
  },
  {
    id: "ngo-10",
    name: "Peenya Eco Hub",
    locality_name: "Peenya Industrial Area",
    pincode: "560058",
    issues_reported: 190,
    issues_resolved: 140,
    efficiency: 73.6,
    contact: "monitor@peenyaeco.in",
    description: "Monitoring industrial air pollution and hazardous waste disposal."
  },
  {
    id: "ngo-11",
    name: "Silk Board Traffic & Air",
    locality_name: "Silk Board",
    pincode: "560068",
    issues_reported: 230,
    issues_resolved: 180,
    efficiency: 78.2,
    contact: "air@silkboard.org",
    description: "Addressing severe vehicular emissions and traffic-induced air pollution."
  },
  {
    id: "ngo-12",
    name: "Marathahalli Renew",
    locality_name: "Marathahalli",
    pincode: "560037",
    issues_reported: 112,
    issues_resolved: 98,
    efficiency: 87.5,
    contact: "renew@marathahalli.in",
    description: "Focusing on plastic reduction and commercial waste management."
  },
  {
    id: "ngo-13",
    name: "KR Puram Water Protectors",
    locality_name: "KR Puram",
    pincode: "560036",
    issues_reported: 89,
    issues_resolved: 70,
    efficiency: 78.6,
    contact: "water@krpuram.org",
    description: "Ensuring clean drinking water access and fighting illegal water extraction."
  },
  {
    id: "ngo-14",
    name: "Hebbal Lake Wardens",
    locality_name: "Hebbal",
    pincode: "560024",
    issues_reported: 67,
    issues_resolved: 61,
    efficiency: 91.0,
    contact: "wardens@hebbal.in",
    description: "Protecting the Hebbal lake ecosystem and surrounding green belts."
  },
  {
    id: "ngo-15",
    name: "Yelahanka Sustainable",
    locality_name: "Yelahanka",
    pincode: "560064",
    issues_reported: 41,
    issues_resolved: 38,
    efficiency: 92.6,
    contact: "info@yelahankasustain.org",
    description: "Promoting solar energy and sustainable urban farming."
  },
  {
    id: "ngo-16",
    name: "Majestic Civic Forum",
    locality_name: "Majestic",
    pincode: "560009",
    issues_reported: 165,
    issues_resolved: 130,
    efficiency: 78.7,
    contact: "forum@majestic.in",
    description: "Tackling high-density commercial waste and sanitation issues."
  }
];

export const getNGOById = (id) => ngos.find(ngo => ngo.id === id);

// Simulated database of assigned complaints
export const mockComplaints = [
  { id: "CMP-001", issue_type: "Garbage Dumping", pincode: "560066", status: "In Progress", assigned_ngo_id: "ngo-1", date: "2026-04-25", lat: 12.9710, lng: 77.7500 },
  { id: "CMP-002", issue_type: "Air Pollution", pincode: "560066", status: "Resolved", assigned_ngo_id: "ngo-1", date: "2026-04-20", lat: 12.9680, lng: 77.7480 },
  { id: "CMP-003", issue_type: "Water Leakage", pincode: "560100", status: "Pending", assigned_ngo_id: "ngo-2", date: "2026-04-26", lat: 12.8400, lng: 77.6780 },
  { id: "CMP-004", issue_type: "Noise Pollution", pincode: "560038", status: "Verified", assigned_ngo_id: "ngo-5", date: "2026-04-24", lat: 12.9780, lng: 77.6400 },
  { id: "CMP-005", issue_type: "Lake Frothing", pincode: "560103", status: "In Progress", assigned_ngo_id: "ngo-3", date: "2026-04-23", lat: 12.9300, lng: 77.6800 },
  { id: "CMP-006", issue_type: "Illegal Parking", pincode: "560066", status: "Pending", assigned_ngo_id: "ngo-1", date: "2026-04-26", lat: 12.9720, lng: 77.7520 },
  { id: "CMP-007", issue_type: "Pothole", pincode: "560066", status: "Verified", assigned_ngo_id: "ngo-1", date: "2026-04-25", lat: 12.9650, lng: 77.7450 },
];
