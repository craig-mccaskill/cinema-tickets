import TicketService from "../src/pairtest/TicketService";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";
import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException";

describe('TicketService', () => {
    describe('TicketService', () => {
        let ticketService;

        beforeEach(() => {
            jest.clearAllMocks();
            ticketService = new TicketService();
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

                expect(result.success).toBe(true);
                expect(result.totalCost).toBe(65);
                expect(result.totalSeats).toBe(3);
            })

            it('should process valid ticket purchase - scenario 2', () => {
                const accountId = 345;
                const request = [
                    new TicketTypeRequest('ADULT', 1),
                    new TicketTypeRequest('CHILD', 1),
                    new TicketTypeRequest('INFANT', 1)
                ];

                const result = ticketService.purchaseTickets(accountId, ...request);

                expect(result.success).toBe(true);
                expect(result.totalCost).toBe(40);
                expect(result.totalSeats).toBe(2);
            })

            it('should process valid ticket purchase - scenario 3', () => {
                const accountId = 2;
                const request = [
                    new TicketTypeRequest('ADULT', 1),
                    new TicketTypeRequest('CHILD', 1)
                ];

                const result = ticketService.purchaseTickets(accountId, ...request);

                expect(result.success).toBe(true);
                expect(result.totalCost).toBe(40);
                expect(result.totalSeats).toBe(2);
            })
        })

        describe('invalid requests', () => {
            it('should reject request due to invalid account ID', () => {
                const accountId = 0;
                const adultRequest = new TicketTypeRequest('ADULT', 1);

                expect(() => ticketService.purchaseTickets(accountId, adultRequest)).toThrow(InvalidPurchaseException);
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

                expect(() => ticketService.purchaseTickets(accountId, ...request)).toThrow(InvalidPurchaseException);

            })

            it('should reject request due to more infants than adults - scenario 2', () => {
                const accountId = 123;
                const request = [
                    new TicketTypeRequest('ADULT', 4),
                    new TicketTypeRequest('CHILD', 1),
                    new TicketTypeRequest('INFANT', 5)
                ];

                expect(() => ticketService.purchaseTickets(accountId, ...request)).toThrow(InvalidPurchaseException);

            })

            it('should reject due to empty ticket request', () => {
                const accountId = 123;
                const request = [];

                expect(() => ticketService.purchaseTickets(accountId, ...request)).toThrow(InvalidPurchaseException);

            })

            it('should reject due to being above max ticket amount', () => {
                const accountId = 123;
                const request = [
                    new TicketTypeRequest('ADULT', 21),
                    new TicketTypeRequest('CHILD', 2),
                    new TicketTypeRequest('INFANT', 3)
                ];

                expect(() => ticketService.purchaseTickets(accountId, ...request)).toThrow(InvalidPurchaseException);

            })

        })
    })

    describe('TicketTypeRequest', () => {
        it('should create instance with valid adult ticket and number of tickets', () => {
            const request = new TicketTypeRequest("ADULT", 2);
            expect(request.getTicketType()).toBe("ADULT");
            expect(request.getNoOfTickets()).toBe(2);
        });

        it('incorrect ticket type - should return error', () => {
            expect(() => new TicketTypeRequest("OAP", 2)).toThrow("type must be ADULT, CHILD, or INFANT");
        });

        it('incorrect ticket type - should return error - scenario 2', () => {
            expect(() => new TicketTypeRequest("CHILDREN", 2)).toThrow("type must be ADULT, CHILD, or INFANT");
        });

        it('incorrect ticket amount format - non-integer - should return error', () => {
            expect(() => new TicketTypeRequest("ADULT", "two")).toThrow("noOfTickets must be an integer");
        });
    })
    
});