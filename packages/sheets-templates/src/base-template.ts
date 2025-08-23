import { EventTemplate, EventType, SheetsStructure } from '@eventconnect/shared-types';

export const createBaseTemplate = (type: EventType, customWorksheets: any[] = []): EventTemplate => ({
  type,
  name: `${type.charAt(0).toUpperCase() + type.slice(1)} Event Template`,
  description: `Standard template for ${type} events`,
  sheetsStructure: {
    worksheets: [
      // Core worksheets that every event needs
      {
        name: 'Event Overview',
        headers: [
          'Field', 
          'Value', 
          'Notes', 
          'Last Updated'
        ],
        defaultRows: [
          ['Event Name', '', '', ''],
          ['Event Date', '', '', ''],
          ['Event Time', '', '', ''],
          ['Venue', '', '', ''],
          ['Total Budget', '', '', ''],
          ['Guest Count', '', '', ''],
          ['Event Status', 'Planning', '', '']
        ]
      },
      {
        name: 'Timeline',
        headers: [
          'Task',
          'Due Date', 
          'Assigned To',
          'Status',
          'Priority',
          'Notes',
          'Completed Date'
        ]
      },
      {
        name: 'Budget',
        headers: [
          'Category',
          'Item',
          'Estimated Cost',
          'Actual Cost',
          'Vendor',
          'Status',
          'Payment Due',
          'Notes'
        ]
      },
      {
        name: 'Vendors',
        headers: [
          'Vendor Name',
          'Category',
          'Contact Person',
          'Email',
          'Phone',
          'Contract Status',
          'Payment Status',
          'Notes'
        ]
      },
      {
        name: 'Guest List',
        headers: [
          'Name',
          'Email',
          'Phone',
          'RSVP Status',
          'Plus One',
          'Dietary Restrictions',
          'Table Assignment',
          'Notes'
        ]
      },
      ...customWorksheets
    ]
  }
});
