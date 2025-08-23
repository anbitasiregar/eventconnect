import { EventType } from '@eventconnect/shared-types';
import { createBaseTemplate } from './base-template';

export const corporateTemplate = createBaseTemplate(EventType.CORPORATE, [
  {
    name: 'Agenda',
    headers: [
      'Time',
      'Session/Activity',
      'Speaker/Facilitator',
      'Location',
      'Duration',
      'AV Requirements',
      'Notes'
    ]
  },
  {
    name: 'Speakers',
    headers: [
      'Name',
      'Title',
      'Company',
      'Email',
      'Phone',
      'Session Topic',
      'AV Needs',
      'Travel Required',
      'Honorarium',
      'Status'
    ]
  },
  {
    name: 'Logistics',
    headers: [
      'Category',
      'Item',
      'Quantity',
      'Vendor',
      'Status',
      'Delivery Date',
      'Setup Time',
      'Notes'
    ],
    defaultRows: [
      ['AV Equipment', 'Microphones', '', '', '', '', '', ''],
      ['AV Equipment', 'Projectors', '', '', '', '', '', ''],
      ['Catering', 'Coffee Breaks', '', '', '', '', '', ''],
      ['Catering', 'Lunch', '', '', '', '', '', ''],
      ['Materials', 'Name Badges', '', '', '', '', '', ''],
      ['Materials', 'Welcome Packets', '', '', '', '', '', '']
    ]
  },
  {
    name: 'Attendee Registration',
    headers: [
      'Name',
      'Title',
      'Company',
      'Email',
      'Dietary Restrictions',
      'Accessibility Needs',
      'Registration Date',
      'Payment Status'
    ]
  }
]);
