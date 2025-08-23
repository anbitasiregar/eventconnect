import { EventType } from '@eventconnect/shared-types';
import { createBaseTemplate } from './base-template';

export const weddingTemplate = createBaseTemplate(EventType.WEDDING, [
  {
    name: 'Wedding Party',
    headers: [
      'Role',
      'Name', 
      'Email',
      'Phone',
      'Dress/Suit Size',
      'Special Requirements',
      'Notes'
    ],
    defaultRows: [
      ['Bride', '', '', '', '', '', ''],
      ['Groom', '', '', '', '', '', ''],
      ['Maid of Honor', '', '', '', '', '', ''],
      ['Best Man', '', '', '', '', '', '']
    ]
  },
  {
    name: 'Ceremony Details',
    headers: [
      'Element',
      'Details',
      'Vendor/Person Responsible',
      'Status',
      'Notes'
    ],
    defaultRows: [
      ['Officiant', '', '', '', ''],
      ['Music', '', '', '', ''],
      ['Flowers', '', '', '', ''],
      ['Photography', '', '', '', ''],
      ['Videography', '', '', '', '']
    ]
  },
  {
    name: 'Reception Details',
    headers: [
      'Element',
      'Details',
      'Vendor/Person Responsible', 
      'Status',
      'Notes'
    ],
    defaultRows: [
      ['Venue', '', '', '', ''],
      ['Catering', '', '', '', ''],
      ['DJ/Band', '', '', '', ''],
      ['Decorations', '', '', '', ''],
      ['Bar Service', '', '', '', '']
    ]
  }
]);
