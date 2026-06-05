import fs from 'fs';

const src = 'src/routes/admin.leads.tsx';
const dest = 'src/routes/admin.isa-leads.tsx';

let content = fs.readFileSync(src, 'utf8');

// Replace imports from @/lib/api
content = content.replace(
  /bulkDeleteLeads,\s*bulkUpdateStatus,\s*deleteLead,\s*getAdminSession,\s*getLeadStats,\s*listLeads,\s*updateLeadNotes,\s*updateLeadStatus,\s*type Lead,\s*type LeadStats,\s*type LeadStatus,/,
  `bulkDeleteIsaLeads as bulkDeleteLeads,
  bulkUpdateIsaStatus as bulkUpdateStatus,
  deleteIsaLead as deleteLead,
  getAdminSession,
  getIsaLeadStats as getLeadStats,
  listIsaLeads as listLeads,
  updateIsaLeadNotes as updateLeadNotes,
  updateIsaLeadStatus as updateLeadStatus,
  type IsaLead as Lead,
  type LeadStats,
  type LeadStatus,`
);

// Remove ISA_PROGRAM_PREFIX logic
content = content.replace(/const ISA_PROGRAM_PREFIX = "ISA Program Enquiry — ";\n\nfunction isIsaProgramEnquiryLead\(lead: Lead\) \{\n  return lead\.course\.startsWith\(ISA_PROGRAM_PREFIX\);\n\}\n\nfunction sourceKeyForLead\(lead: Lead\): SourceFilter \| "demo" \{\n  if \(isIsaProgramEnquiryLead\(lead\)\) return "isa_program_enquiry";\n  return lead\.source;\n\}/g, '');

// Replace SourceFilter to remove application, brochure, demo, isa_program_enquiry
content = content.replace(/type SourceFilter = "all" \| "application" \| "brochure" \| "demo" \| "isa_program_enquiry";/, 'type SourceFilter = "all";');

content = content.replace(/const SOURCE_LABELS: Record<Exclude<SourceFilter, "all">, string> = {[^}]+};/g, '');

content = content.replace(/<Select value=\{sourceFilter\} onChange=\{setSourceFilter\}>\n[\s\S]*?<\/Select>/, '');

content = content.replace(/const matchesSource = sourceFilter === "all" \|\| sourceKeyForLead\(lead\) === sourceFilter;/g, 'const matchesSource = true;');

content = content.replace(/const cleanedRaw = rawCourse\.startsWith\(ISA_PROGRAM_PREFIX\)\n\s*\? rawCourse\.slice\(ISA_PROGRAM_PREFIX\.length\)\n\s*: rawCourse;/, 'const cleanedRaw = rawCourse;');

content = content.replace(/admin\.leads"/g, 'admin.isa-leads"');
content = content.replace(/export const Route = createFileRoute\("\/admin\/leads"\)/g, 'export const Route = createFileRoute("/admin/isa-leads")');

content = content.replace(/AdminLeadsPage/g, 'AdminIsaLeadsPage');
content = content.replace(/title="Leads"/g, 'title="ISA Leads"');
content = content.replace(/subtitle="Manage demo requests and course applications."/g, 'subtitle="Manage ISA Program Enquiries."');

// Change CSV export header
content = content.replace(/Date,Name,Email,Phone,Course,Mode,Detail,Source,Status,Notes/g, 'Date,Name,Email,Phone,Course,Mode,Status,Notes');

content = content.replace(/flattenCsvText\(lead\.source\),/g, '');

// Parse mode differently since IsaLead has preferred_mode
content = content.replace(/const { title, mode, detail } = parseLeadCourseMeta\(lead\.course\);/g, 'const title = lead.course; const mode = lead.preferred_mode; const detail = null;');

content = content.replace(/<td className="whitespace-nowrap px-4 py-3 text-xs capitalize text-muted-foreground">\n\s*\{lead\.source\}\n\s*<\/td>/, '');

content = content.replace(/<th className="px-4 py-2 text-left text-\[10px\] font-semibold uppercase tracking-wider text-muted-foreground">\n\s*Source\n\s*<\/th>/, '');

fs.writeFileSync(dest, content);
console.log('Done creating admin.isa-leads.tsx');
