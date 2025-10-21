/**
 * Enhanced Domain Hierarchy Configuration
 * Task 7.7: Domain Taxonomy & Preferences System
 * 
 * Comprehensive domain structure with sub-domains and areas of interest
 * Includes metadata for UI rendering (icons, colors, descriptions)
 */

import { 
  Code2, 
  Stethoscope, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  Palette,
  type LucideIcon 
} from 'lucide-react';

export interface AreaOfInterest {
  name: string;
  description?: string;
}

export interface SubDomain {
  name: string;
  description: string;
  areasOfInterest: AreaOfInterest[];
}

export interface Domain {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  subDomains: SubDomain[];
}

export const DOMAIN_HIERARCHY: Record<string, Domain> = {
  technology: {
    id: 'technology',
    name: 'Technology',
    description: 'Software, hardware, data, and digital innovation',
    icon: Code2,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    subDomains: [
      {
        name: 'Software Development',
        description: 'Application and system software engineering',
        areasOfInterest: [
          { name: 'Frontend Development', description: 'UI/UX implementation' },
          { name: 'Backend Development', description: 'Server-side architecture' },
          { name: 'Full Stack Development', description: 'End-to-end development' },
          { name: 'Mobile Development', description: 'iOS, Android, cross-platform' },
          { name: 'Game Development', description: 'Gaming engines and design' },
          { name: 'Desktop Applications', description: 'Native desktop software' },
          { name: 'Embedded Systems', description: 'IoT and embedded programming' }
        ]
      },
      {
        name: 'Data Science & AI',
        description: 'Data analysis, machine learning, and artificial intelligence',
        areasOfInterest: [
          { name: 'Machine Learning', description: 'Predictive models and algorithms' },
          { name: 'Deep Learning', description: 'Neural networks and AI' },
          { name: 'Data Analytics', description: 'Business intelligence and insights' },
          { name: 'Big Data Engineering', description: 'Large-scale data processing' },
          { name: 'Natural Language Processing', description: 'Text and language AI' },
          { name: 'Computer Vision', description: 'Image and video analysis' },
          { name: 'Data Visualization', description: 'Interactive data storytelling' }
        ]
      },
      {
        name: 'Cloud & Infrastructure',
        description: 'Cloud computing, DevOps, and system administration',
        areasOfInterest: [
          { name: 'Cloud Architecture', description: 'AWS, Azure, GCP design' },
          { name: 'DevOps Engineering', description: 'CI/CD and automation' },
          { name: 'Site Reliability Engineering', description: 'System reliability and scale' },
          { name: 'Containerization', description: 'Docker, Kubernetes' },
          { name: 'Infrastructure as Code', description: 'Terraform, CloudFormation' },
          { name: 'Serverless Computing', description: 'Function-as-a-service' },
          { name: 'Network Engineering', description: 'Network design and management' }
        ]
      },
      {
        name: 'Cybersecurity',
        description: 'Information security and risk management',
        areasOfInterest: [
          { name: 'Application Security', description: 'Secure coding practices' },
          { name: 'Network Security', description: 'Firewall and intrusion detection' },
          { name: 'Penetration Testing', description: 'Ethical hacking' },
          { name: 'Security Architecture', description: 'Enterprise security design' },
          { name: 'Compliance & Governance', description: 'Regulatory compliance' },
          { name: 'Incident Response', description: 'Security breach handling' },
          { name: 'Cryptography', description: 'Encryption and secure protocols' }
        ]
      },
      {
        name: 'Product & Design',
        description: 'Digital product design and user experience',
        areasOfInterest: [
          { name: 'UX/UI Design', description: 'User experience and interface' },
          { name: 'Product Management', description: 'Product strategy and roadmap' },
          { name: 'Design Systems', description: 'Component libraries and standards' },
          { name: 'User Research', description: 'Usability testing and research' },
          { name: 'Interaction Design', description: 'Interactive experiences' },
          { name: 'Accessibility', description: 'Inclusive design practices' }
        ]
      }
    ]
  },

  healthcare: {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Medicine, public health, and wellness services',
    icon: Stethoscope,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    subDomains: [
      {
        name: 'Clinical Practice',
        description: 'Direct patient care and clinical medicine',
        areasOfInterest: [
          { name: 'Primary Care', description: 'Family medicine and general practice' },
          { name: 'Specialist Medicine', description: 'Cardiology, oncology, etc.' },
          { name: 'Surgery', description: 'Surgical specialties' },
          { name: 'Emergency Medicine', description: 'Acute care and trauma' },
          { name: 'Pediatrics', description: 'Child and adolescent healthcare' },
          { name: 'Geriatrics', description: 'Elder care' },
          { name: 'Palliative Care', description: 'End-of-life care' }
        ]
      },
      {
        name: 'Public Health',
        description: 'Population health and disease prevention',
        areasOfInterest: [
          { name: 'Epidemiology', description: 'Disease patterns and control' },
          { name: 'Health Policy', description: 'Healthcare systems and policy' },
          { name: 'Global Health', description: 'International health programs' },
          { name: 'Environmental Health', description: 'Environmental risk factors' },
          { name: 'Occupational Health', description: 'Workplace health and safety' },
          { name: 'Community Health', description: 'Local health initiatives' }
        ]
      },
      {
        name: 'Medical Research',
        description: 'Biomedical and clinical research',
        areasOfInterest: [
          { name: 'Clinical Trials', description: 'Drug and therapy testing' },
          { name: 'Translational Research', description: 'Bench to bedside' },
          { name: 'Genomics', description: 'Genetic research' },
          { name: 'Pharmacology', description: 'Drug development' },
          { name: 'Biotechnology', description: 'Biological innovations' },
          { name: 'Medical Devices', description: 'Device innovation' }
        ]
      },
      {
        name: 'Mental Health',
        description: 'Psychological and behavioral health',
        areasOfInterest: [
          { name: 'Psychiatry', description: 'Mental health medicine' },
          { name: 'Clinical Psychology', description: 'Therapy and counseling' },
          { name: 'Substance Abuse', description: 'Addiction treatment' },
          { name: 'Child Psychology', description: 'Developmental mental health' },
          { name: 'Neuropsychology', description: 'Brain-behavior relationships' }
        ]
      },
      {
        name: 'Healthcare Administration',
        description: 'Healthcare management and operations',
        areasOfInterest: [
          { name: 'Hospital Management', description: 'Healthcare facility operations' },
          { name: 'Healthcare IT', description: 'Medical informatics' },
          { name: 'Quality Improvement', description: 'Care quality initiatives' },
          { name: 'Healthcare Finance', description: 'Medical billing and finance' },
          { name: 'Telemedicine', description: 'Remote healthcare delivery' }
        ]
      }
    ]
  },

  business: {
    id: 'business',
    name: 'Business',
    description: 'Strategy, operations, and entrepreneurship',
    icon: Briefcase,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    subDomains: [
      {
        name: 'Strategy & Consulting',
        description: 'Business strategy and advisory services',
        areasOfInterest: [
          { name: 'Corporate Strategy', description: 'Enterprise strategic planning' },
          { name: 'Management Consulting', description: 'Business advisory' },
          { name: 'Business Transformation', description: 'Organizational change' },
          { name: 'Mergers & Acquisitions', description: 'M&A strategy' },
          { name: 'Competitive Analysis', description: 'Market intelligence' }
        ]
      },
      {
        name: 'Marketing & Sales',
        description: 'Customer acquisition and revenue generation',
        areasOfInterest: [
          { name: 'Digital Marketing', description: 'Online marketing channels' },
          { name: 'Content Marketing', description: 'Content strategy and creation' },
          { name: 'Brand Management', description: 'Brand strategy and positioning' },
          { name: 'Growth Marketing', description: 'Growth hacking and optimization' },
          { name: 'Sales Strategy', description: 'Sales process and enablement' },
          { name: 'Customer Success', description: 'Customer retention' },
          { name: 'Social Media Marketing', description: 'Social platform strategies' }
        ]
      },
      {
        name: 'Product Management',
        description: 'Product strategy and lifecycle management',
        areasOfInterest: [
          { name: 'Product Strategy', description: 'Product vision and roadmap' },
          { name: 'Product Analytics', description: 'Data-driven product decisions' },
          { name: 'Product Design', description: 'User-centered product design' },
          { name: 'Agile Product Management', description: 'Iterative development' },
          { name: 'Platform Products', description: 'Platform strategy' }
        ]
      },
      {
        name: 'Operations & Supply Chain',
        description: 'Business operations and logistics',
        areasOfInterest: [
          { name: 'Operations Management', description: 'Process optimization' },
          { name: 'Supply Chain Management', description: 'Logistics and procurement' },
          { name: 'Quality Management', description: 'Quality assurance' },
          { name: 'Lean & Six Sigma', description: 'Process improvement' },
          { name: 'Inventory Management', description: 'Stock optimization' }
        ]
      },
      {
        name: 'Finance & Accounting',
        description: 'Financial management and analysis',
        areasOfInterest: [
          { name: 'Corporate Finance', description: 'Financial strategy' },
          { name: 'Financial Analysis', description: 'Investment analysis' },
          { name: 'Accounting', description: 'Financial reporting' },
          { name: 'Risk Management', description: 'Financial risk' },
          { name: 'Treasury', description: 'Cash management' }
        ]
      },
      {
        name: 'Entrepreneurship',
        description: 'Startups and business creation',
        areasOfInterest: [
          { name: 'Startup Strategy', description: 'Early-stage business building' },
          { name: 'Venture Capital', description: 'Startup funding' },
          { name: 'Business Model Innovation', description: 'New business models' },
          { name: 'Scaling', description: 'Growth and expansion' },
          { name: 'Social Entrepreneurship', description: 'Impact-driven business' }
        ]
      }
    ]
  },

  education: {
    id: 'education',
    name: 'Education',
    description: 'Teaching, learning, and educational systems',
    icon: GraduationCap,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    subDomains: [
      {
        name: 'K-12 Education',
        description: 'Primary and secondary education',
        areasOfInterest: [
          { name: 'Elementary Education', description: 'Early childhood teaching' },
          { name: 'Secondary Education', description: 'Middle and high school' },
          { name: 'Special Education', description: 'Learning disabilities support' },
          { name: 'Gifted Education', description: 'Advanced learner programs' },
          { name: 'ESL/ELL', description: 'English language learners' }
        ]
      },
      {
        name: 'Higher Education',
        description: 'Post-secondary education and research',
        areasOfInterest: [
          { name: 'University Teaching', description: 'College-level instruction' },
          { name: 'Academic Research', description: 'Scholarly research' },
          { name: 'Graduate Education', description: 'Masters and PhD programs' },
          { name: 'Higher Ed Administration', description: 'University management' }
        ]
      },
      {
        name: 'Educational Technology',
        description: 'Technology-enhanced learning',
        areasOfInterest: [
          { name: 'Online Learning', description: 'Virtual education platforms' },
          { name: 'Learning Management Systems', description: 'LMS design and use' },
          { name: 'Educational Games', description: 'Gamification in education' },
          { name: 'Adaptive Learning', description: 'Personalized learning tech' },
          { name: 'Virtual Reality in Education', description: 'Immersive learning' }
        ]
      },
      {
        name: 'Curriculum & Instruction',
        description: 'Educational design and pedagogy',
        areasOfInterest: [
          { name: 'Curriculum Development', description: 'Course design' },
          { name: 'Instructional Design', description: 'Learning experience design' },
          { name: 'Assessment & Evaluation', description: 'Student evaluation' },
          { name: 'Differentiated Instruction', description: 'Personalized teaching' }
        ]
      },
      {
        name: 'Educational Leadership',
        description: 'School and district administration',
        areasOfInterest: [
          { name: 'School Administration', description: 'Principal and leadership' },
          { name: 'Education Policy', description: 'Policy and advocacy' },
          { name: 'Professional Development', description: 'Teacher training' },
          { name: 'School Counseling', description: 'Student guidance' }
        ]
      }
    ]
  },

  engineering: {
    id: 'engineering',
    name: 'Engineering',
    description: 'Applied sciences and physical systems',
    icon: Wrench,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    subDomains: [
      {
        name: 'Mechanical Engineering',
        description: 'Machines, thermodynamics, and mechanics',
        areasOfInterest: [
          { name: 'Automotive Engineering', description: 'Vehicle design' },
          { name: 'Aerospace Engineering', description: 'Aircraft and spacecraft' },
          { name: 'Robotics', description: 'Robot design and automation' },
          { name: 'Manufacturing', description: 'Production systems' },
          { name: 'HVAC Engineering', description: 'Climate control systems' }
        ]
      },
      {
        name: 'Electrical Engineering',
        description: 'Electrical systems and electronics',
        areasOfInterest: [
          { name: 'Power Systems', description: 'Electrical grids and generation' },
          { name: 'Electronics', description: 'Circuit design' },
          { name: 'Control Systems', description: 'Automation and control' },
          { name: 'Telecommunications', description: 'Communication systems' },
          { name: 'Signal Processing', description: 'Digital signal analysis' }
        ]
      },
      {
        name: 'Civil Engineering',
        description: 'Infrastructure and construction',
        areasOfInterest: [
          { name: 'Structural Engineering', description: 'Building design' },
          { name: 'Transportation Engineering', description: 'Roads and transit' },
          { name: 'Geotechnical Engineering', description: 'Soil and foundations' },
          { name: 'Water Resources', description: 'Water systems' },
          { name: 'Construction Management', description: 'Project execution' }
        ]
      },
      {
        name: 'Chemical Engineering',
        description: 'Chemical processes and materials',
        areasOfInterest: [
          { name: 'Process Engineering', description: 'Chemical plant design' },
          { name: 'Materials Science', description: 'Material development' },
          { name: 'Petrochemical', description: 'Oil and gas processing' },
          { name: 'Pharmaceutical Engineering', description: 'Drug manufacturing' }
        ]
      },
      {
        name: 'Environmental Engineering',
        description: 'Environmental protection and sustainability',
        areasOfInterest: [
          { name: 'Water Treatment', description: 'Water purification' },
          { name: 'Air Quality', description: 'Pollution control' },
          { name: 'Waste Management', description: 'Solid waste systems' },
          { name: 'Sustainable Design', description: 'Green engineering' },
          { name: 'Renewable Energy', description: 'Clean energy systems' }
        ]
      },
      {
        name: 'Biomedical Engineering',
        description: 'Engineering for medical applications',
        areasOfInterest: [
          { name: 'Medical Devices', description: 'Device design and testing' },
          { name: 'Biomechanics', description: 'Biological mechanics' },
          { name: 'Tissue Engineering', description: 'Biological tissue creation' },
          { name: 'Medical Imaging', description: 'Imaging technology' }
        ]
      }
    ]
  },

  arts: {
    id: 'arts',
    name: 'Arts & Design',
    description: 'Creative expression and visual communication',
    icon: Palette,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    subDomains: [
      {
        name: 'Visual Design',
        description: 'Graphic and visual communication',
        areasOfInterest: [
          { name: 'Graphic Design', description: 'Visual communication' },
          { name: 'Brand Identity', description: 'Logo and brand design' },
          { name: 'Typography', description: 'Type design and usage' },
          { name: 'Illustration', description: 'Digital and traditional art' },
          { name: 'Motion Graphics', description: 'Animated design' }
        ]
      },
      {
        name: 'Digital Media',
        description: 'Interactive and digital content',
        areasOfInterest: [
          { name: 'Photography', description: 'Commercial and artistic' },
          { name: 'Videography', description: 'Video production' },
          { name: 'Animation', description: '2D and 3D animation' },
          { name: 'Video Editing', description: 'Post-production' },
          { name: 'Visual Effects', description: 'VFX and compositing' }
        ]
      },
      {
        name: 'Architecture & Spatial',
        description: 'Built environment and space design',
        areasOfInterest: [
          { name: 'Architecture', description: 'Building design' },
          { name: 'Interior Design', description: 'Space planning' },
          { name: 'Landscape Architecture', description: 'Outdoor space design' },
          { name: 'Urban Planning', description: 'City design' }
        ]
      },
      {
        name: 'Fashion & Industrial',
        description: 'Product and fashion design',
        areasOfInterest: [
          { name: 'Fashion Design', description: 'Clothing and textiles' },
          { name: 'Industrial Design', description: 'Product design' },
          { name: 'Jewelry Design', description: 'Accessory design' },
          { name: 'Sustainable Fashion', description: 'Eco-friendly design' }
        ]
      },
      {
        name: 'Performing Arts',
        description: 'Music, theater, and performance',
        areasOfInterest: [
          { name: 'Music Performance', description: 'Instrumental and vocal' },
          { name: 'Music Production', description: 'Recording and mixing' },
          { name: 'Theater', description: 'Stage performance' },
          { name: 'Dance', description: 'Choreography and performance' },
          { name: 'Film Acting', description: 'Screen performance' }
        ]
      }
    ]
  }
};

/**
 * Get flattened list of all areas of interest across all domains
 */
export function getAllAreasOfInterest(): string[] {
  const areas: string[] = [];
  Object.values(DOMAIN_HIERARCHY).forEach(domain => {
    domain.subDomains.forEach(subDomain => {
      subDomain.areasOfInterest.forEach(area => {
        if (!areas.includes(area.name)) {
          areas.push(area.name);
        }
      });
    });
  });
  return areas.sort();
}

/**
 * Get areas of interest for a specific domain
 */
export function getAreasOfInterestForDomain(domainId: string): string[] {
  const domain = DOMAIN_HIERARCHY[domainId];
  if (!domain) return [];
  
  const areas: string[] = [];
  domain.subDomains.forEach(subDomain => {
    subDomain.areasOfInterest.forEach(area => {
      areas.push(area.name);
    });
  });
  return areas;
}

/**
 * Get sub-domains for a specific domain
 */
export function getSubDomainsForDomain(domainId: string): SubDomain[] {
  const domain = DOMAIN_HIERARCHY[domainId];
  return domain?.subDomains || [];
}
