import { SAMPLE_PROJECTS } from './sampleSchemas.js';
import { generateDBML } from './dbmlParser.js';

export const MARKETPLACE_CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'fintech', label: 'Fintech & Ledgers' },
  { id: 'saas', label: 'B2B SaaS & Billing' },
  { id: 'healthcare', label: 'Healthcare & EMR' },
  { id: 'ecommerce', label: 'E-Commerce & Retail' },
  { id: 'logistics', label: 'Logistics & Supply Chain' },
  { id: 'productivity', label: 'Project Management' },
  { id: 'hospitality', label: 'Hospitality & Booking' },
  { id: 'education', label: 'Education & LMS' },
  { id: 'iot', label: 'IoT & Telemetry' },
  { id: 'hr', label: 'HR & Payroll' }
];

export const MARKETPLACE_TEMPLATES = SAMPLE_PROJECTS.map((project, index) => ({
  ...project,
  id: `template-${project.id}`,
  category: index === 0 ? 'ecommerce' : 'saas',
  isSystem: true,
  complexity: 'Intermediate',
  author: { name: 'dbmaps', title: 'Built-in template', avatar: '/favicon.svg' },
  highlights: project.tables.slice(0, 3).map(table => table.name),
  dbml: generateDBML(project.tables, project.relationships, project.name)
}));
