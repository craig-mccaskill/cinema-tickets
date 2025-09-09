import TicketService from "../src/pairtest/TicketService";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";
import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException";

describe('TicketService', () => {
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