import { jest } from '@jest/globls';
import TicketService from "../src/pairtest/TicketService";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";
import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException";

const mockTicketPaymentService = { makePayment: jest.fn() };
const mockSeatReservationService = { reserveSeat: jest.fn() };

jest.mock('../src/thirdparty/paymentgateway/TicketPaymentService.js', () => {
    return jest.fn(() => mockTicketPaymentService);
})

jest.mock('../src/thirdparty/seatbooking/SeatReservationService.js', () => {
    return jest.fn(() => mockSeatReservationService);
})

describe('TicketService', () => {
    let ticketService;

    beforeEach(() => {
        jest.clearAllMocks();
        ticketService = new TicketService(mockTicketPaymentService, mockSeatReservationService);
    });

    describe('valid requests', () => {
        it('should process valid ticket purchase - scenario 1', () => {
            const accountId = 1234;
            const request = [
                new TicketTypeRequest('ADULT', 2),
                new TicketTypeRequest('CHILD', 1),
                new TicketTypeRequest('INFANT', 1)
            ];

            const result = ticketService.purchaseTickets(accountId, ...request);

            expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(accountId, 65);
            expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(accountId, 3);

            expect(result.success).toBe(true);
            expect(result.ticketInfo.totalCost).toBe(65);
            expect(result.ticketInfo.totalSeats).toBe(3);
        })

        it('should process valid ticket purchase - scenario 2', () => {
            const accountId = 345;
            const request = [
                new TicketTypeRequest('ADULT', 1),
                new TicketTypeRequest('CHILD', 1),
                new TicketTypeRequest('INFANT', 1)
            ];

            const result = ticketService.purchaseTickets(accountId, ...request);

            expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(accountId, 40);
            expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(accountId, 2);

            expect(result.success).toBe(true);
            expect(result.ticketInfo.totalCost).toBe(40);
            expect(result.ticketInfo.totalSeats).toBe(2);
        })

        it('should process valid ticket purchase - scenario 3', () => {
            const accountId = 2;
            const request = [
                new TicketTypeRequest('ADULT', 1),
                new TicketTypeRequest('CHILD', 1)
            ];

            const result = ticketService.purchaseTickets(accountId, ...request);

            expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(accountId, 40);
            expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(accountId, 2);

            expect(result.success).toBe(true);
            expect(result.ticketInfo.totalCost).toBe(40);
            expect(result.ticketInfo.totalSeats).toBe(2);
        })

        it('should process valid ticket purchase - max ticket scenario', () => {
            const accountId = 1234;
            const request = [
                new TicketTypeRequest('ADULT', 20),
                new TicketTypeRequest('CHILD', 2),
                new TicketTypeRequest('INFANT', 3)
            ];

            const result = ticketService.purchaseTickets(accountId, ...request);

            expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(accountId, 530);
            expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(accountId, 22);

            expect(result.success).toBe(true);
            expect(result.ticketInfo.totalCost).toBe(530);
            expect(result.ticketInfo.totalSeats).toBe(22);
        })

        it('should process valid ticket purchase - max ticket scenario', () => {
            const accountId = 1234;
            const request = [
                new TicketTypeRequest('ADULT', 20),
                new TicketTypeRequest('CHILD', 5)
            ];

            const result = ticketService.purchaseTickets(accountId, ...request);

            expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(accountId, 575);
            expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(accountId, 25);

            expect(result.success).toBe(true);
            expect(result.ticketInfo.totalCost).toBe(575);
            expect(result.ticketInfo.totalSeats).toBe(25);
        })

        it('should process valid ticket purchase - multiple ticket requests of same type', () => {
            const accountId = 1234;
            const request = [
                new TicketTypeRequest('ADULT', 1),
                new TicketTypeRequest('ADULT', 2),
                new TicketTypeRequest('CHILD', 1),
                new TicketTypeRequest('CHILD', 1),
                new TicketTypeRequest('INFANT', 1),
                new TicketTypeRequest('INFANT', 1)
            ];

            const result = ticketService.purchaseTickets(accountId, ...request);

            expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(accountId, 105);
            expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(accountId, 5);

            expect(result.success).toBe(true);
            expect(result.ticketInfo.totalCost).toBe(105);
            expect(result.ticketInfo.totalSeats).toBe(5);
        })
    })

    describe('invalid requests', () => {
        it('should reject request due to invalid account ID', () => {
            const accountId = 0;
            const adultRequest = new TicketTypeRequest('ADULT', 1);

            expect(() => ticketService.purchaseTickets(accountId, adultRequest)).toThrow(new InvalidPurchaseException('Invalid account ID'));
        })

        it('should reject request due to undefined account ID', () => {
            const accountId = null;
            const adultRequest = new TicketTypeRequest('ADULT', 1);

            expect(() => ticketService.purchaseTickets(accountId, adultRequest)).toThrow(new InvalidPurchaseException('Invalid account ID'));
        })

        it('should reject request due to number of tickets in correct format', () => {
            expect(() =>  new TicketTypeRequest('ADULT', '1')).toThrow('noOfTickets must be an integer');
        })

        it('should reject request due to more infants than adults - scenario 1', () => {
            const accountId = 123;
            const request = [
                new TicketTypeRequest('ADULT', 0),
                new TicketTypeRequest('CHILD', 1),
                new TicketTypeRequest('INFANT', 1)
            ];

            expect(() => ticketService.purchaseTickets(accountId, ...request)).toThrow(new InvalidPurchaseException('Adult ticket required'));

        })

        it('should reject request due to more infants than adults - scenario 2', () => {
            const accountId = 123;
            const request = [
                new TicketTypeRequest('ADULT', 4),
                new TicketTypeRequest('CHILD', 1),
                new TicketTypeRequest('INFANT', 5)
            ];

            expect(() => ticketService.purchaseTickets(accountId, ...request)).toThrow(new InvalidPurchaseException('Infants cannot exceed amount of adults'));

        })

        it('should reject due to empty ticket request', () => {
            const accountId = 123;
            const request = [];

            expect(() => ticketService.purchaseTickets(accountId, ...request)).toThrow(new InvalidPurchaseException('No tickets requested'));

        })

        it('should reject due to empty ticket request and null accountId', () => {
            const accountId = null;
            const request = [];

            expect(() => ticketService.purchaseTickets(accountId, ...request)).toThrow(new InvalidPurchaseException('Invalid account ID'));

        })

        it('should reject due to being above max ticket amount', () => {
            const accountId = 123;
            const request = [
                new TicketTypeRequest('ADULT', 21),
                new TicketTypeRequest('CHILD', 2),
                new TicketTypeRequest('INFANT', 3)
            ];

            expect(() => ticketService.purchaseTickets(accountId, ...request)).toThrow(new InvalidPurchaseException('Exceeded max tickets'));

        })

    })
    
});