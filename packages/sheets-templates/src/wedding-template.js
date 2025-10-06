"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weddingTemplate = void 0;
const shared_types_1 = require("@eventconnect/shared-types");
const base_template_1 = require("./base-template");
exports.weddingTemplate = (0, base_template_1.createBaseTemplate)(shared_types_1.EventType.WEDDING, [
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
//# sourceMappingURL=wedding-template.js.map