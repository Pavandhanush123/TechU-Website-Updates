import fs from 'fs';
const file = 'src/routes/admin.isa-leads.tsx';
let content = fs.readFileSync(file, 'utf8');

const texts = `
const TEXTS = {
  loading: "Loading dashboard…",
  all: "All (",
  application: "Application (",
  brochure: "Brochure (",
  demo: "Demo (",
  isaEnquiry: "ISA Program Enquiry (",
  allStatuses: "All statuses",
  new: "New",
  contacted: "Contacted",
  converted: "Converted",
  archived: "Archived",
  clearDate: "Clear date filter",
  exportCsv: "Export CSV",
  exportOptions: "Export options",
  filteredView: "Filtered view",
  allLoaded: "All loaded leads",
  clear: "Clear",
  markAs: "Mark as:",
  deleteSelected: "Delete selected",
  date: "Date",
  source: "Source",
  name: "Name",
  contact: "Contact",
  course: "Course",
  notes: "Notes",
  status: "Status",
  actions: "Actions",
  whatsApp: "WhatsApp",
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  noLeads: "No leads match these filters.",
};
`;

// Insert TEXTS after the imports
content = content.replace(/(import {[^}]+} from "@\/components\/ui\/dropdown-menu";)/, "$1\n" + texts);

// Bracket notation fixes
content = content.replace(/STATUS_LABELS\[status\]/g, 'Reflect.get(STATUS_LABELS, status)');
content = content.replace(/STATUS_LABELS\[s\]/g, 'Reflect.get(STATUS_LABELS, s)');
content = content.replace(/STATUS_BADGE\[l\.status\]/g, 'Reflect.get(STATUS_BADGE, l.status)');
content = content.replace(/STATUS_LABELS\[l\.status\]/g, 'Reflect.get(STATUS_LABELS, l.status)');

// JSX replacements
content = content.replace(/Loading dashboard…/, '{TEXTS.loading}');
content = content.replace(/<option value="all">All \(\{counts\.all\}\)<\/option>/, '<option value="all">{TEXTS.all}{counts.all})</option>');
content = content.replace(/<option value="application">Application \(\{counts\.application\}\)<\/option>/, '<option value="application">{TEXTS.application}{counts.application})</option>');
content = content.replace(/<option value="brochure">Brochure \(\{counts\.brochure\}\)<\/option>/, '<option value="brochure">{TEXTS.brochure}{counts.brochure})</option>');
content = content.replace(/<option value="demo">Demo \(\{counts\.demo\}\)<\/option>/, '<option value="demo">{TEXTS.demo}{counts.demo})</option>');
content = content.replace(/ISA Program Enquiry \(\{counts\.isa_program_enquiry\}\)/, '{TEXTS.isaEnquiry}{counts.isa_program_enquiry})');
content = content.replace(/All statuses/, '{TEXTS.allStatuses}');
content = content.replace(/<option value="new">New<\/option>/, '<option value="new">{TEXTS.new}</option>');
content = content.replace(/<option value="contacted">Contacted<\/option>/, '<option value="contacted">{TEXTS.contacted}</option>');
content = content.replace(/<option value="converted">Converted<\/option>/, '<option value="converted">{TEXTS.converted}</option>');
content = content.replace(/<option value="archived">Archived<\/option>/, '<option value="archived">{TEXTS.archived}</option>');
content = content.replace(/>\s*Clear date filter\s*<\/button>/, '>{TEXTS.clearDate}</button>');
content = content.replace(/>\s*Export CSV\s*</, '>{TEXTS.exportCsv}<');
content = content.replace(/>\s*Export options\s*<\/DropdownMenuLabel>/, '>{TEXTS.exportOptions}</DropdownMenuLabel>');
content = content.replace(/<span>Filtered view<\/span>/, '<span>{TEXTS.filteredView}</span>');
content = content.replace(/<span>All loaded leads<\/span>/, '<span>{TEXTS.allLoaded}</span>');
content = content.replace(/>\s*Clear\s*<\/button>/g, '>{TEXTS.clear}</button>');
content = content.replace(/>Mark as:<\/span>/, '>{TEXTS.markAs}</span>');
content = content.replace(/>\s*Delete selected\s*<\/button>/g, '>{TEXTS.deleteSelected}</button>');

content = content.replace(/<th className="px-4 py-3 font-medium">Date<\/th>/, '<th className="px-4 py-3 font-medium">{TEXTS.date}</th>');
content = content.replace(/<th className="px-4 py-3 font-medium">Source<\/th>/, '<th className="px-4 py-3 font-medium">{TEXTS.source}</th>');
content = content.replace(/<th className="px-4 py-3 font-medium">Name<\/th>/, '<th className="px-4 py-3 font-medium">{TEXTS.name}</th>');
content = content.replace(/<th className="px-4 py-3 font-medium">Contact<\/th>/, '<th className="px-4 py-3 font-medium">{TEXTS.contact}</th>');
content = content.replace(/<th className="px-4 py-3 font-medium">Course<\/th>/, '<th className="px-4 py-3 font-medium">{TEXTS.course}</th>');
content = content.replace(/<th className="px-4 py-3 font-medium">Notes<\/th>/, '<th className="px-4 py-3 font-medium">{TEXTS.notes}</th>');
content = content.replace(/<th className="px-4 py-3 font-medium">Status<\/th>/, '<th className="px-4 py-3 font-medium">{TEXTS.status}</th>');
content = content.replace(/>\s*Actions\s*<\/th>/, '>{TEXTS.actions}</th>');

content = content.replace(/>\s*WhatsApp\s*<\/a>/g, '>{TEXTS.whatsApp}</a>');
content = content.replace(/>\s*Save\s*<\/button>/g, '>{TEXTS.save}</button>');
content = content.replace(/>\s*Cancel\s*<\/button>/g, '>{TEXTS.cancel}</button>');
content = content.replace(/>\s*Delete\s*<\/button>/g, '>{TEXTS.delete}</button>');
content = content.replace(/>\s*No leads match these filters\.\s*<\/td>/g, '>{TEXTS.noLeads}</td>');
content = content.replace(/>\s*No leads match these filters\.\s*<\/div>/g, '>{TEXTS.noLeads}</div>');

fs.writeFileSync(file, content);
console.log('Fixed lint warnings in admin.isa-leads.tsx');
