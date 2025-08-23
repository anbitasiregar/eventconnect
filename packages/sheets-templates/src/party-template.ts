import { EventType } from '@eventconnect/shared-types';
import { createBaseTemplate } from './base-template';

export const partyTemplate = createBaseTemplate(EventType.PARTY, [
  {
    name: 'Entertainment',
    headers: [
      'Type',
      'Provider',
      'Contact',
      'Cost',
      'Duration',
      'Setup Requirements',
      'Status',
      'Notes'
    ],
    defaultRows: [
      ['Music/DJ', '', '', '', '', '', '', ''],
      ['Games/Activities', '', '', '', '', '', '', ''],
      ['Special Performances', '', '', '', '', '', '', '']
    ]
  },
  {
    name: 'Food & Beverages',
    headers: [
      'Category',
      'Item',
      'Quantity',
      'Dietary Options',
      'Vendor',
      'Cost',
      'Status',
      'Notes'
    ],
    defaultRows: [
      ['Appetizers', '', '', '', '', '', '', ''],
      ['Main Course', '', '', '', '', '', '', ''],
      ['Desserts', '', '', '', '', '', '', ''],
      ['Beverages', '', '', '', '', '', '', ''],
      ['Special Dietary', '', '', '', '', '', '', '']
    ]
  },
  {
    name: 'Decorations & Setup',
    headers: [
      'Item',
      'Quantity',
      'Color/Style',
      'Vendor',
      'Cost',
      'Setup Time',
      'Location',
      'Status'
    ],
    defaultRows: [
      ['Balloons', '', '', '', '', '', '', ''],
      ['Table Settings', '', '', '', '', '', '', ''],
      ['Centerpieces', '', '', '', '', '', '', ''],
      ['Lighting', '', '', '', '', '', '', ''],
      ['Photo Booth Props', '', '', '', '', '', '', '']
    ]
  }
]);
