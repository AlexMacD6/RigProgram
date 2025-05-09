export interface Document {
  id: string;                // Unique identifier
  title: string;             // Document title
  category: string;          // Document category
  isFeatured?: boolean;      // Featured status
  tags?: string[];           // Optional tags
  sections: Section[];       // Document sections
  lastModified: number;      // Timestamp
  version: number;           // Document version
  equipmentTags?: string[];  // Industry-specific equipment tags
  operationsTags?: string[]; // Industry-specific operation tags
}

export interface Section {
  id: string;        // Unique identifier
  title: string;     // Section title
  content: string;   // HTML content
}

export interface RecentActivity {
  message: string;   // Activity description
  timestamp: number; // When the activity occurred
  user?: string;     // Optional user identifier
}

export interface DocumentRevision {
  id: string;
  documentId: string;
  timestamp: number;
  version: number;
  documentData: Document;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
}

// Industry-specific categories
export const equipmentCategories: CategoryDefinition[] = [
  { id: "capital-equipment", name: "Capital Equipment", description: "Permanently installed equipment in the wellbore, including OCTG casing strings, wellhead systems, and other critical components essential for maintaining integrity and enabling production." },
  { id: "cementing", name: "Cementing", description: "Services and materials are used to secure casing strings and ensure well integrity during drilling and production." },
  { id: "directional-services", name: "Directional Services (BHA / MWD, etc.)", description: "Technologies and expertise for precise wellbore placement, including bottom hole assemblies (BHA) and measurement-while-drilling (MWD) systems." },
  { id: "fluids", name: "Fluids", description: "Drilling fluids, chemicals, and additives essential for maintaining well stability, cooling, and lubrication." },
  { id: "inspections", name: "Inspections", description: "Comprehensive services for evaluating and certifying critical equipment such as BOPs, drill pipe, and other operational assets to ensure safety, compliance, and performance reliability." },
  { id: "miscellaneous", name: "Miscellaneous", description: "General services and products are not categorized elsewhere, such as safety equipment, consultancy, and consumables." },
  { id: "rig", name: "Rig", description: "The primary machinery and associated services required for well construction, including rig crew, rig moving, operation, and maintenance." },
  { id: "surface-rentals", name: "Surface Rentals", description: "Temporary rental equipment for surface operations, such as tanks, light towers, and accommodations." },
  { id: "technology", name: "Technology", description: "Digital and mechanical solutions designed to improve operational efficiency and decision-making, including logging, mud logging, and software." },
  { id: "transportation", name: "Transportation Services", description: "Logistics solutions for moving equipment, materials, and personnel to and from pad locations." }
];

export const operationCategories: CategoryDefinition[] = [
  { id: "rig-move", name: "Rig Move", description: "Previous well released, rig rigged down, moved to new pad, and rig spotted on next location. Completed when crews' acceptance checks are completed on next location." },
  { id: "surface-rig-up", name: "Surface Rig Up", description: "Period from the start of acceptance checks until the well is officially spudded." },
  { id: "surface-drilling", name: "Surface Drilling", description: "Spud to TD of surface hole; including all slides, surveys, and BHA changes." },
  { id: "surface-rig-down", name: "Surface Rig Down", description: "Clean-up cycles, pull out of hole, run surface casing and cement. Prep for skid/walk and nipple-down surface stack/diverter (if applicable)." },
  { id: "intermediate-rig-up", name: "Intermediate Rig Up", description: "Walk to position over wellhead, intermediate BOP tested, pick-up intermediate BHA; ends at spud of intermediate hole." },
  { id: "intermediate-drilling", name: "Intermediate Drilling", description: "Drill from surface shoe to intermediate TD (slides, surveys, BHA trips, etc.)" },
  { id: "intermediate-rig-down", name: "Intermediate Rig Down", description: "Clean-up cycles, pull out of hole, run casing and cement. Nipple-down stack/walk or prepare for production interval." },
  { id: "production-rig-up", name: "Production Rig Up", description: "Walk to position over wellhead, production BOP tested, curve/lateral BHA picked up; ends at spud of production hole." },
  { id: "production-drilling", name: "Production Drilling", description: "Drill curve and lateral to final TD (slides, surveys, BHA trips, etc.)" },
  { id: "production-rig-down", name: "Production Rig Down", description: "Clean-up cycles, pull out of hole, run production casing/liner and cement. Nipple-down stack, lay down pipe, demobilize or skid to next well." }
]; 