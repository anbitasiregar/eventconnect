"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.partyTemplate = void 0;
const shared_types_1 = require("@eventconnect/shared-types");
const base_template_1 = require("./base-template");
exports.partyTemplate = (0, base_template_1.createBaseTemplate)(shared_types_1.EventType.PARTY, [
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
//# sourceMappingURL=party-template.js.map