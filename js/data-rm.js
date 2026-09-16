/* ============================================================
   Rent Manager shell content — Workspace, Administration, menu
   ------------------------------------------------------------
   Transcribed from the canonical RMX Pages designs:
     Admin Pages    (5XEzI94nmZsWE7rQQ7OIHP, node 2421:77120)
     General Pages  (5XEzI94nmZsWE7rQQ7OIHP, node 2143:11725)
   Smart Agents is added under Administration > Automation > General,
   as a peer of Automated Notifications — the group that already holds
   the surfaces it supersedes.
   ============================================================ */
(function (SA) {
  'use strict';

  /* ---------------- My Workspace ----------------
     Transcribed 1:1 from the canonical RMX Pages "My Workspace" frame
     (5XEzI94nmZsWE7rQQ7OIHP, node 4969:70308), via get_design_context —
     group names, link labels, icon colours and tile overlines all read
     from the real component instances, not approximated. */

  /* Group icon + colour. Each group keeps one colour everywhere it appears
     (My Favorites and My Reports agree on all four they share) — read off
     each card's real Icon Wrapper background: icon-success #6eb744,
     icon-attention #f58220, icon-notice #faa61c, icon-primary #008dd5. */
  SA.wsGroupStyle = {
    'Rental Info':   { icon: 'home_work',        color: 'var(--rmx-success)' },
    'Communication': { icon: 'mail',             color: 'var(--rmx-warning)' },
    'Owners':        { icon: 'assignment_ind',   color: 'var(--rmx-warning)' },
    'Admin':         { icon: 'settings',         color: 'var(--rmx-notice)' },
    'Services':      { icon: 'build',            color: 'var(--rmx-brand)' },
    'Accounting':    { icon: 'account_balance',  color: 'var(--rmx-brand)' },
    'Receivables':   { icon: 'savings',          color: 'var(--rmx-success)' },
    'Payables':      { icon: 'attach_money',     color: 'var(--rmx-notice)' }
  };

  /* My Favorites — two columns. */
  SA.wsFavorites = [
    [
      { name: 'Rental Info', links: ['Tenants', 'Prospects', 'Units', 'Properties',
        'Unit Types', 'Assets', 'Violations', 'Merge Prospects'] },
      { name: 'Communication', links: ['Send Email', 'Text Messaging Center'] },
      { name: 'Owners', links: ['Owners', 'Pay Owners', 'Post Management Fees'] },
      { name: 'Admin', links: ['Users'] }
    ],
    [
      { name: 'Services', links: ['Issues', 'Tasks', 'Appointments', 'New Issue',
        'Make-Ready Board', 'Calendar'] },
      { name: 'Accounting', links: ['Make Deposit', 'Bank Register', 'Journals', 'Bank Reconcile'] },
      { name: 'Receivables', links: ['Invoices', 'Post Recurring Charges', 'Post Late Fees',
        'Batch Payments', 'Modify Recurring Charges'] },
      { name: 'Payables', links: ['Add Bill', 'Vendors', 'Checks', 'Write Checks',
        'Pay Bills', 'Print Checks'] }
    ]
  ];

  /* My Reports — two columns. */
  SA.wsReports = [
    [
      { name: 'Rental Info', links: ['Box Score', 'Prospect Waiting List', 'Tenant History / Notes',
        'Security Deposit Listing', 'Lease Expiration', 'Move In / Move Out',
        'Unit Availability Listing', 'Vacancy'] },
      { name: 'Receivables', links: ['Rent Roll & Recurring Charges', 'Summary Rent Roll',
        'Aged Receivables', 'Charge Detail', 'Credit Detail', 'Delinquency', 'Receipts Breakdown'] }
    ],
    [
      { name: 'Payables', links: ['Aged Payables', 'Bills Paid'] },
      { name: 'Accounting', links: ['Check / Deposit Listing', 'Deposit Breakdown',
        'Property Trust Account Balances', 'General Ledger', 'Balance Sheet',
        'Budget Comparison', 'Profit & Loss'] }
    ]
  ];

  SA.wsAnnouncements = [
    {
      title: 'Tenant Transfer Wizard', date: 'January 21, 2026', badge: 'NEW', thumb: true,
      text: 'Allows you to consolidate all the tasks associated with transferring a tenant ' +
        'from one unit to another into a single, guided process.',
      links: ['Learn More', 'Express Help']
    },
    {
      title: 'Lease Renewal Enhancements', date: 'January 21, 2026', badge: 'NEW', thumb: true,
      text: 'This powerful tool allows you to present multiple renewal term options to your ' +
        'tenants, so they can choose their ideal term...',
      links: ['Learn More', 'Express Help']
    }
  ];

  /* ---------------- Administration ---------------- */

  SA.adminNav = ['Preferences', 'Rental Info', 'Accounting', 'Owners', 'Payables',
    'Receivables', 'Service', 'Users', 'Customization', 'Rollback', 'Automation',
    'Import', 'Integrations', 'Locations'];

  /* Only the categories the prototype actually shows are filled in. Picking any
     other rail item lands on a deliberate "not in this prototype" state rather
     than pretending the whole of Administration is built. */
  SA.adminSections = {
    Automation: [
      {
        sub: 'General',
        items: [
          {
            /* NEW — Smart Agents, per the admin IA decision. */
            title: 'Smart Agents', orion: true, action: 'goAgents',
            desc: 'Detect what is wrong, decide what to do about it, and act — every run leaves its reasoning behind.'
          },
          {
            title: 'Automated Notifications', eicon: 'automated-notifications',
            desc: 'Send customized emails and texts automatically based on events in Rent Manager or set schedules.'
          }
        ]
      },
      {
        sub: 'Task Automation',
        links: ['Recurring Charges', 'Late Fees', 'Loans Receivable Late Fees', 'Loans Receivable',
          'Management Fees', 'GPR', 'Recurring ePay', 'Utilities',
          'Accounts Receivable', 'Tenant Statements']
      }
    ],
    'Preferences': [
      { items: [
          { title: 'System Preferences', eicon: 'system-preferences', desc: 'Define settings that impact the Rent Manager features available and how they work for all users.' },
          { title: 'System Web Preferences', eicon: 'system-web-preferences', desc: 'Control the content and display of Tenant Web Access, Owner Web Access, Online Applications, and more.' },
          { title: 'Personal Preferences', eicon: 'personal-preferences', desc: 'Customize display, search, and email settings for your Rent Manager user account only.' }
        ] }
    ],
    'Rental Info': [
      { sub: 'Assets', items: [
          { title: 'Asset Types', eicon: 'asset-types', desc: 'Create categories to classify different kinds of assets created in Rent Manager.' },
          { title: 'Asset Manufacturers', eicon: 'asset-manufacturers', desc: 'Define manufacturers to assign assets you manage. Maintain contact information of each manufacturer.' },
          { title: 'Asset Statuses', eicon: 'asset-statuses', desc: 'Create categories to apply to assets that describe the condition or current position in your asset workflow.' },
          { title: 'Asset Tile Statuses', eicon: 'asset-tile-statuses', desc: 'Define categories to apply to assets that describe the current state of an asset’s title.' },
          { title: 'Asset Workflow', eicon: 'asset-workflow', desc: 'Create custom workflows to move an asset through available statuses.' },
          { title: 'Unit to Asset Conversion Wizard', eicon: 'unit-to-asset-conversion-wizard', desc: 'Convert items that were previously set up as units to assets in Rent Manager.' },
          { title: 'Homeowner Statuses & Site Classifications', eicon: 'homeowner-statuses', desc: 'Customize homeowner statuses and their corresponding site classifications.' }
        ] },
      { sub: 'Tenants/Prospects', items: [
          { title: 'Lead Sources', eicon: 'lead-sources', desc: 'Define available lead sources to track how prospects are finding your available units.' },
          { title: 'Owner Prospect Lead Sources', eicon: 'owner-prospect-lead-sources', desc: 'Define available lead sources to track how owners are finding your management company.' },
          { title: 'Contact Types', eicon: 'contact-types', desc: 'Create categories that can be assigned to tenant, prospect, or vendor contacts for easy identification.' },
          { title: 'Account Groups', eicon: 'account-groups', desc: 'Manage existing tenant account groups. Update the master account, remove tenant from a group, or delete the entire group.' },
          { title: 'History Categories', eicon: 'history-categories', desc: 'Create tags to assign to History/Notes to help filter, search, and share notes.' },
          { title: 'Lease Terms', eicon: 'lease-terms', desc: 'Define default lease duration that can be selected when adding or renewing tenant leases.' },
          { title: 'Lease Term Adjustment Tool', eicon: 'lease-term-adjustment-tool', desc: 'Update the lease terms on multiple existing leases at once.' },
          { title: 'Month to Month Adjustment Tool', eicon: 'month-to-month-adjustment-tool', desc: 'Use this tool to set the lease term to MTM for leases with start dates or expired leases with no move out date.' },
          { title: 'Prospect Stages', eicon: 'prospect-stages', desc: 'Define stages through which your prospects progress and assign triggers to automatically move them through the process.' },
          { title: 'Lost Reasons', eicon: 'lost-reasons', desc: 'Customize the list of available reasons a prospect is marked as lost to help standardize reporting.' },
          { title: 'Pet Types', eicon: 'pet-types', desc: 'Define the different pets allowed at your properties and set custom charge and deposit amounts for each.' }
        ] },
      { sub: 'Properties / Units', items: [
          { title: 'Property Groups', eicon: 'property-groups', desc: 'Group multiple properties together to easily select them for posting, reporting, and filtering.' },
          { title: 'Floors', eicon: 'floors', desc: 'Create and manage the names of floors available in your properties. Floors are added to units to provide detailed information about a unit’s location.' },
          { title: 'Amenities', eicon: 'amenities', desc: 'Add or manage features available at your rental units. These can be assigned to units and used to help match prospects to a unit.' },
          { title: 'Assign Amenities', eicon: 'assign-amenities', desc: 'Assign applicable amenities to properties and units to help match prospects to the perfect space.' },
          { title: 'Subsidies', eicon: 'subsidies', desc: 'Manage subsidy types offered to your tenants. Define the program from which payment is received and the charge type to which the payment can apply.' },
          { title: 'Unit Status Types', eicon: 'unit-status-types', desc: 'Customize the statuses available for your units. Control if units show as vacant and/or available for each status.' },
          { title: 'Association Committees', eicon: 'association-committees', desc: 'Add and manage committees for you Homeowner Association properties. Tenants can be assigned to a committee via the property’s Association tab.' }
        ] },
      { sub: 'Violations', items: [
          { title: 'Violation Categories', eicon: 'violation-categories', desc: 'Define and manage labels to organize violation codes and group them together.' },
          { title: 'Violation Code Groups', eicon: 'violation-code-groups', desc: 'Create code groups to organize violation categories and violation codes together.' }
        ] },
      { sub: 'Short Term Rentals', items: [
          { title: 'STR Payment Policies', eicon: 'str-payment-policies', desc: 'Establish rules for when the balance of an STR reservation is due. Set the amount due at booking and when any remaining balance will be due from the guest.' },
          { title: 'STR Promotions', eicon: 'str-promotions', desc: 'Create promotion codes guests can use to redeem a discount when making a reservation.' }
        ] },
      { sub: 'Evictions', items: [
          { title: 'Eviction Workflows', eicon: 'eviction-workflows', desc: 'Manage tenant eviction workflows and customize eviction stages.' },
          { title: 'Eviction Reasons', eicon: 'eviction-reasons', desc: 'Customize the list of available reasons a tenant is marked as evicted to help in reporting the eviction process.' },
          { title: 'Eviction Outcomes', eicon: 'eviction-outcomes', desc: 'Define the different outcomes for the eviction process to help track the tenants that are evicted and not evicted.' }
        ] }
    ],
    'Accounting': [
      { sub: 'General', items: [
          { title: 'Beginning Balances', eicon: 'beginning-balances', desc: 'Enter the balances of your general ledger accounts as of the day prior to using Rent Manager.' },
          { title: 'Tax Types', eicon: 'tax-types', desc: 'Define tax rates and the charge types to which they can be applied on your invoices.' },
          { title: 'Terms', eicon: 'terms', desc: 'Customize the selectable terms on bills to quickly set due dates based on the date of the bill.' },
          { title: 'CPI', eicon: 'cpi', desc: 'Record adjustments to the Consumer Price Index that can be applied when batch modifying recurring charges or market rents.' },
          { title: 'Budget', eicon: 'budget', desc: 'Create or import budgets by property or add comments to existing budgets.' },
          { title: 'Forecast Models', eicon: 'forecast-models', desc: 'Enter assumptions about GL accounts and future occupancy that can be used to project future earnings and expenses.' },
          { title: 'Vendor 1099 Adjustment Tool', eicon: 'vendor-1099-adjustment-tool', desc: 'Quickly find and update multiple checks that have the incorrect 1099 status selected.' },
          { title: 'Job Types', eicon: 'job-types', desc: 'Create categories to classify different kinds of jobs created in Rent Manager.' },
          { title: 'Accounting Periods', eicon: 'accounting-periods', desc: 'Create accounting periods to allow certain reports to run by the established period.' },
          { title: 'Bank Sync Setup', eicon: 'bank-sync-setup', desc: 'Connect your online banking to a Rent Manager general ledger account to sync transactions for reconciliation.' },
          { title: 'Manage Aliases', eicon: 'manage-aliases', desc: 'Control the content and display of Tenant Web Access, Owner Web Access, Online Applications, and more.' }
        ] }
    ],
    'Owners': [
      { sub: 'General', items: [
          { title: 'Owner Groups', eicon: 'owner-groups', desc: 'Group multiple owners together to easily select them for posting, reporting, and filtering.' }
        ] }
    ],
    'Payables': [
      { items: [
          { title: 'Purchase Order Workflows', eicon: 'purchase-order-workflows', desc: 'Specify the order of tasks and users assigned to reviewing, approving, and fulfilling a PO.' },
          { title: 'Digital Signatures', eicon: 'digital-signatures', desc: 'Upload images of handwritten signatures that can be saved and printed on checks.' },
          { title: 'Positive Pay Formats', eicon: 'positive-pay-formats', desc: 'Create and assign templates for your bank\'s Positive Pay file structure to send check details to your bank prior to checks being cashed.' }
        ] }
    ],
    'Receivables': [
      { items: [
          { title: 'Memorized Comments', eicon: 'memorized-comments', desc: 'Create custom messages that can be quickly inserted into the comment field on invoices and statements.' },
          { title: 'Allocation Order', eicon: 'allocation-order', desc: 'Set the order in which charge types are paid when a payment is recorded.' },
          { title: 'Rentable Security Deposit Management', eicon: 'rentable-security-deposit-management', desc: 'Streamline deposit collection, ensure total compliance with legislation, and offer tenants flexible payment options.' }
        ] }
    ],
    'Service': [
      { sub: 'Service Manager', items: [
          { title: 'Priorities', eicon: 'priorities', desc: 'Create and color code the priority levels that are selectable on service issues.' },
          { title: 'Issue Categories', eicon: 'issue-categories', desc: 'Customize and color code categories used to classify your service issues.' },
          { title: 'Statuses', eicon: 'statuses', desc: 'Define and color code issue statuses used to track progress of your service issues.' },
          { title: 'Maintenance Techs', eicon: 'maintenance-techs', desc: 'Designate users as maintenance techs to manage work schedules and time off. A tech\'s workload can be managed using the Maintenance Schedule.' },
          { title: 'Maintenance Groups', eicon: 'maintenance-groups', desc: 'Define the team of technicians servicing specific properties and the days and time blocks they are available for scheduling. These groups allow you to easily manage your maintenance scheduling.' }
        ] },
      { sub: 'Make Ready', items: [
          { title: 'Make Ready Actions', eicon: 'make-ready-actions', desc: 'Manage the available categories for issues and inspections in your make ready process. These actions are column headers to organize your make ready board.' }
        ] },
      { sub: 'Community', items: [
          { title: 'Community Calendar Event Types', eicon: 'community-calendar-event-types', desc: 'Create labels and define colors that can be used to categorize the different events offered in your community.' }
        ] },
      { sub: 'Utilities', items: [
          { title: 'Meter Estimates', eicon: 'meter-estimates', desc: 'Set default values for estimate limits and estimation methods.' },
          { title: 'High / Low Settings', eicon: 'high-low-settings', desc: 'Set how flagged meter readings are reviewed, define exception reasons, and choose if approvals are needed before posting charges.' }
        ] }
    ],
    'Users': [
      { items: [
          { title: 'Users', eicon: 'users', desc: 'Create and manage Rent Manager user accounts. Assign privileges, roles, reports, letters, dashboards, and menus.' },
          { title: 'User Roles', eicon: 'user-roles', desc: 'Establish privileges, reports, letters, dashboard, and menu settings that can be applied to multiple users who share the same job.' },
          { title: 'Merge Users', eicon: 'merge-users', desc: 'Combine duplicate Rent Manager user accounts into a single user record.' },
          { title: 'Manage Rent Manager Sessions', eicon: 'manage-rent-manager-sessions', desc: 'View all currently logged in Rent Manager users and log off users as needed.' }
        ] }
    ],
    'Customization': [
      { items: [
          { title: 'Colors', eicon: 'colors', desc: 'Define custom display colors for Rent Manager records such as tenants, owners, prospects, tasks, and more.' },
          { title: 'My Layouts', eicon: 'my-layouts', desc: 'Customize the way information is displayed on entity detail pages, including tenants, prospects, issues, and more.' },
          { title: 'System Layouts', eicon: 'system-layouts', desc: 'Customize the way information is displayed on entity detail pages, including tenants, prospects, issues, and more.' },
          { title: 'My Dashboards', eicon: 'my-dashboards', desc: 'Design and manage dashboards for your Rent Manager user account.' },
          { title: 'System Dashboards', eicon: 'system-dashboards', desc: 'Create and manage dashboards that can be shared with and assigned to other Rent Manager users.' },
          { title: 'Scoreboards', eicon: 'scoreboards', desc: 'Create and manage scoreboards that can be assigned to other Rent Manager users.' },
          { title: 'Image Types', eicon: 'image-types', desc: 'Create categories to classify and assign to property, unit, unit type, and asset images.' },
          { title: 'Manage Text Numbers', eicon: 'manage-text-numbers', desc: 'Control which numbers are available for broadcasts, Automated Notifications, AR Automation, and individual texts.' },
          { title: 'Manage Web hooks', eicon: 'manage-web-hooks', desc: 'Create webhooks to send information from your database to a secure web address when an event occurs in Rent Manager.' },
          { title: 'User Defined Fields', eicon: 'user-defined-fields', desc: 'Manage custom fields to track information that Rent Manager doesn\'t track by default.' },
          { title: 'System UDF Values', eicon: 'system-udf-values', desc: 'Add or update the data stored in your system-level user defined fields.' },
          { title: 'System Filters', eicon: 'system-filters', desc: 'Create and assign custom filters that make it easier to find what you need in Rent Manager.' },
          { title: 'Guest Card Templates', eicon: 'guest-card-templates', desc: 'Create and manage the questions that appear on your guest cards and how they are mapped to fields in Rent Manager.' },
          { title: 'Unit Migration Wizard', eicon: 'unit-migration-wizard', desc: 'Move units from one property to another. This will move all transactions associated with the unit as well.' },
          { title: 'Online Template Library', eicon: 'online-template-library', desc: 'Download templates for letters, reports, and inspections that can then be modified to meet your exact needs.' },
          { title: 'Address Types', eicon: 'address-types', desc: 'Define categories for the different addresses stored on each of your entities in Rent Manager.' },
          { title: 'Phone Number Types', eicon: 'phone-number-types', desc: 'Define categories for the different phone numbers stored on each of your entities in Rent Manager.' },
          { title: 'Custom Add Wizards', eicon: 'custom-add-wizards', desc: 'Design your own add wizards with just the fields you need for adding prospects, moving tenants in/out, creating assets, and more.' }
        ] }
    ],
    'Rollback': [
      { items: [
          { title: 'Posting Rollback', eicon: 'posting-rollback', desc: 'Reverse postings such as recurring charges, reconciliations, imports, late fees, and more.' }
        ] }
    ],
    'Import': [
      { sub: 'General', items: [
          { title: 'Manage Import Templates', eicon: 'manage-import-templates', desc: 'View details of, rename, or delete existing import templates.' }
        ] },
      { sub: 'Import Records', links: ['Import Properties', 'Import Unit Types', 'Import Units', 'Import Tenants', 'Import Prospects', 'Import Tenant / Prospect Contacts', 'Import Charges', 'Import Recurring Charges', 'Import STR Guests', 'Import STR Guest Prospects', 'Import STR Reservations', 'Import Payments', 'Import Vendors', 'Import Owners', 'Import Journals', 'Import Jobs', 'Import Assets', 'Import Deprecation Setup', 'Import Budget', 'Import Chart of Accounts', 'Import Owner Contracts', 'Import Owner Prospects', 'Import Owner Prospects Properties', 'Import Inventory Items', 'Import Violation Codes', 'Import Bills', 'Import Meter Information'] }
    ],
    'Integrations': [
      { items: [
          { title: 'Available Integrations', eicon: 'available-integrations', desc: 'Browse available Rent Manager integrations with our partners and directly request activation.' },
          { title: 'My Integrations', eicon: 'my-integrations', desc: 'Review your active integrations. Find contact information for vendors, deactivate, or modify associated settings.' }
        ] }
    ],
    'Locations': [
      { items: [
          { title: 'Manage Locations', eicon: 'manage-locations', desc: 'Add, edit, delete, or switch to additional database locations.' },
          { title: 'Change Locations', eicon: 'change-locations', desc: 'Switch to a different database location.' }
        ] }
    ]
  };

  /* ---------------- main menu ---------------- */

  /* Deliberately not the full mega menu — just enough to reach Administration. */
  /* ---------------- Main Menu ----------------
     The real menu is a panel: a top row of destinations, a module rail down
     the left, the selected module's links in underlined column groups, and a
     footer of setup/report entries with the build number. Only Administration
     is wired — it is the destination this prototype needs. */
  SA.menuTop = [
    { label: 'Workspace', icon: 'menu-workspace', action: 'goWorkspace' },
    { label: 'Dashboard', icon: 'menu-dashboard' },
    { label: 'Administration', icon: 'menu-admin', action: 'goAdmin' },
    { label: 'Full Menu', icon: 'menu-fullmenu' },
    { label: 'Search', icon: 'search' },
    { label: 'Help', icon: 'help' }
  ];

  SA.menuModules = ['Rental Info', 'Accounting', 'Receivables', 'Payables',
    'Owners', 'Services', 'Communication'];

  /* Column groups per module. Rental Info is transcribed in full; the rest
     carry enough to read as real without pretending to be complete. */
  SA.menuGroups = {
    'Rental Info': [
      { name: 'General', links: ['Tenants', 'Prospects', 'Units', 'Properties', 'Unit Types',
        'Assets', 'Violations', 'Merge Prospects'] },
      { name: 'Leasing', links: ['Screenings', 'Applications', 'Application Templates',
        'Renewal Increases', 'Prospect Leasing Board', 'Create Renewal Offers',
        'Lease Renewal Register', 'Lease Renewal Board', 'Export Minnesota CRP'] },
      { name: 'Short Term Rentals', links: ['STR Reservations', 'Check-ins', 'Find Reservation'] },
      { name: 'Online Listing', links: ['Listings'] },
      { name: 'Bird\u2019s Eye View (BEV)', links: ['Manage BEV Maps', 'Manage BEV Map Views'] }
    ],
    'Accounting': [
      { name: 'General', links: ['Bank Register', 'Make Deposit', 'Journals', 'Bank Reconcile',
        'Reconciliation Register', 'Electronic Bank Reconciliation'] },
      { name: 'Setup', links: ['Chart of Accounts', 'Bank Accounts', 'Journal Types'] }
    ],
    'Receivables': [
      { name: 'General', links: ['Invoices', 'Estimates', 'Memorized Invoices',
        'Memorized Estimates', 'Post Security Deposit Interest'] },
      { name: 'Loans Receivable', links: ['Loans Receivable', 'Post Loans Receivable',
        'Post Loan Receivable Late Fees', 'Export 1098', 'Export Corrected 1098', 'Export to Metro2'] },
      { name: 'Payments', links: ['Receive Payment', 'Batch Payments', 'ePay History',
        'Subsidy History', 'Post Recurring ePay', 'ePay Deposit Reconciliation',
        'Make Subsidy Payment', 'Scan Tenant/Prospect Checks', 'Scan Vendor/Owner Checks'] },
      { name: 'Recurring Charges', links: ['Post Recurring Charges', 'Post Late Fees',
        'Modify Recurring Charges', 'Modify Market Rent'] },
      { name: 'Commercial', links: ['Non Recurring CRE', 'CAM Reconciliation', 'CAM Expense Adjustments'] }
    ],
    'Payables': [
      { name: 'General', links: ['Add Bill', 'Pay Bills', 'Write Checks', 'Print Checks', 'Vendors'] },
      { name: 'Recurring', links: ['Post Recurring Bills', 'Modify Recurring Bills'] }
    ],
    'Owners': [
      { name: 'General', links: ['Owners', 'Pay Owners', 'Post Management Fees'] },
      { name: 'Statements', links: ['Owner Statements', 'Owner Draws'] }
    ],
    'Services': [
      { name: 'General', links: ['Issues', 'New Issue', 'Make Ready Board', 'Inspections',
        'Maintenance Schedule', 'Tasks', 'Calendar'] },
      { name: 'Setup', links: ['Issue Categories', 'Service Manager Setup'] }
    ],
    'Communication': [
      { name: 'General', links: ['Send Email', 'Text Messaging Center', 'Write Letter Batch',
        'Document Packets'] },
      { name: 'History', links: ['Communication History', 'Inbound Calls'] }
    ]
  };

  /* Footer entries per module. */
  SA.menuFooter = {
    'Rental Info': ['Rental Info Setup', 'Rental Info Reports', 'Asset Reports', 'Short Term Rental Reports'],
    'Accounting': ['Accounting Setup', 'Accounting Reports'],
    'Receivables': ['Receivables Setup', 'Tenant Reports', 'Receivable Reports'],
    'Payables': ['Payables Setup', 'Payables Reports'],
    'Owners': ['Owners Setup', 'Owner Reports'],
    'Services': ['Services Setup', 'Service Reports'],
    'Communication': ['Communication Setup', 'Communication Reports']
  };

  SA.rmVersion = '12.260554';

})(window.SA = window.SA || {});
