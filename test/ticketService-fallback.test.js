import { jest } from '@jest/globls';

const mockTicketPaymentService = { makePayment: jest.fn() };
const mockSeatReservationService = { reserveSeat: jest.fn() };

jest.unstable_mockModule('../src/thirdparty/paymentgateway/TicketPaymentService.js', () => ({
    default:  jest.fn().mockImplementation(() => mockTicketPaymentService)
}));

jest.mock('../src/thirdparty/seatbooking/SeatReservationService.js', () => ({
    default:  jest.fn().mockImplementation(() => mockSeatReservationService)
}));

describe('TicketService - no dependencies injected - should use fallback', () => {
    let ticketService;

    beforeEach(() => {
        jest.clearAllMocks();
        ticketService = new TicketService(mockTicketPaymentService, mockSeatReservationService);
    });

    it('should process valid ticket purchase', () => {
        // override beforeEach with new ticketService
        ticketService = new TicketService();
        const accountId = 123456;
        const request = [
            new TicketTypeRequest('ADULT', 2),
            new TicketTypeRequest('CHILD', 1)
        ];

        const result = ticketService.purchaseTickets(accountId, ...request);

        expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(accountId, 65);
        expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(accountId, 3);

        expect(result.success).toBe(true);
        expect(result.ticketInfo.totalCost).toBe(65);
        expect(result.ticketInfo.totalSeats).toBe(3);
    })

    
});