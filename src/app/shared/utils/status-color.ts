export function getStatusColor(status: unknown): string {
    switch (String(status ?? '').toUpperCase()) {
        case 'APPROVED':
        case 'FULLY_RECEIVED':
            return 'green';
        case 'SUBMITTED':
            return 'blue';
        case 'REJECTED':
        case 'CANCELLED':
            return 'red';
        case 'SENDBACK':
        case 'BACK':
        case 'APPROVAL PENDING':
            return 'orange';
        case 'PARTIALLY RECEIVED':
            return 'purple';
        case 'DRAFT':
        default:
            return 'grey';
    }
}