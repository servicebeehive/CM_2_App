export function getStatusColor(status: unknown): string {
    switch (String(status ?? '').toUpperCase()) {
        case 'APPROVED':
            return 'green';
        case 'FULLY_RECEIVED':
            return 'green';
        case 'SUBMITTED':
            return 'blue';
        case 'REJECTED':
            return 'red';
        case 'CANCELLED':
            return 'red';
        case 'SENDBACK':
            return 'orange';
        case 'BACK':
            return 'orange';
        case 'APPROVAL PENDING':
            return 'orange';
        case 'PARTIALLY RECEIVED':
            return 'purple';
        case 'DRAFT':
        default:
            return 'grey';
    }
}