import { v4 as uuidv4 } from 'uuid';
import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';
import { MAX_TICKETS, TICKET_PRICES, MAX_INFANTS_PER_ADULT } from './lib/constants.js';
import logger from './lib/logger-config.js';

// define types of tickets
type TicketType = 'ADULT' | 'CHILD' | 'INFANT';

interface TicketCounts {
  ADULT: number;
  CHILD: number;
  INFANT: number;
};

interface TicketInfo {
  ticketCounts: TicketCounts;
  totalTickets: number;
};


export default class TicketService {
  private ticketPaymentService: TicketPaymentService;
  private seatReservationService: SeatReservationService;
  
  // pass in optional ticket/seat services
  constructor(ticketPaymentService?: TicketPaymentService, seatReservationService?: SeatReservationService) {
    // Use injected dependencies or use default
    this.ticketPaymentService = ticketPaymentService || new TicketPaymentService();
    this.seatReservationService = seatReservationService || new SeatReservationService();
  }

  purchaseTickets(accountId: number, ...ticketTypeRequests: TicketTypeRequest[]) {
    // Generate transaction ID
    const transactionId : string = uuidv4();

    this.#validateAccountId(accountId, transactionId);
    const ticketInfo = this.#validateTicketRequest(ticketTypeRequests, transactionId);
    const totalTicketCost: number = this.#calculateTicketDetails(ticketInfo);
    const totalSeatCount: number = this.#calculateTotalSeats(ticketInfo);

    // Complete ticket request payment / seat reservation
    this.ticketPaymentService.makePayment(accountId, totalTicketCost);
    this.seatReservationService.reserveSeat(accountId, totalSeatCount);

    // return success along with ticket info
    logger.info(`Transaction ID: ${transactionId} - Purchase complete`);
    return {
      transactionId: transactionId,
      success: true,
      ticketInfo: {
        accountId: accountId,
        totalCost: totalTicketCost,
        totalSeats: totalSeatCount
      }
    }
  }

  #validateAccountId(accountId : number, transactionId: string) {
    if (!Number.isInteger(accountId) || accountId <= 0){
      logger.error(`Transaction ID: ${transactionId} - Invalid account ID: ${accountId}`);
      throw new InvalidPurchaseException('Invalid account ID');
    }
  }

  #validateTicketRequest(ticketTypeRequest: TicketTypeRequest[], transactionId: string) {
    if (!ticketTypeRequest || ticketTypeRequest.length === 0) {
      logger.error(`Transaction ID: ${transactionId} - No tickets requested`);
      throw new InvalidPurchaseException('No tickets requested');
    }

    const ticketCounts: TicketCounts = { ADULT: 0, CHILD: 0, INFANT: 0 };
    // count ticket by type
    ticketTypeRequest.forEach((request) => {
      if (!request.getTicketType()) {
        logger.error(`Transaction ID: ${transactionId} - Invalid ticket request format`);
        throw new InvalidPurchaseException('Invalid ticket request format');
      }
      // ticketCounts[request.getTicketType()] += request.getNoOfTickets();
      const ticketType = request.getTicketType() as TicketType;
      ticketCounts[ticketType] += request.getNoOfTickets();
    });

    // check tickets against business rules
    this.#validatePurchaseRules(ticketCounts, transactionId);

    const totalTickets = Object.values(ticketCounts).reduce((sum, count) => sum + count, 0);

    if (totalTickets > MAX_TICKETS) {
      logger.error(`Transaction ID: ${transactionId} - Exceeded max tickets - tickets requested: ${totalTickets}`);
      throw new InvalidPurchaseException('Exceeded max tickets');
    }

    return { ticketCounts, totalTickets };
  }

  #validatePurchaseRules(tickets: TicketCounts, transactionId: string) {
    const adults: number = tickets.ADULT || 0;
    const infants: number = tickets.INFANT || 0;

    // check if adult ticket present
    if (adults === 0) {
      logger.error(`Transaction ID: ${transactionId} - Adult ticket required`);
      throw new InvalidPurchaseException('Adult ticket required');
    }

    // check if more infants than adults - 
    if (infants > adults) {
      logger.error(`Transaction ID: ${transactionId} - Infants cannot exceed amount of adults`);
      throw new InvalidPurchaseException('Infants cannot exceed amount of adults');
    }
  }

  #calculateTicketDetails(ticketRequests: TicketInfo) {
    let totalCost:number = 0;

    for (const [ticketType, count] of Object.entries(ticketRequests.ticketCounts)) {
      totalCost += count * (TICKET_PRICES[ticketType as TicketType] || 0);
    }

    return totalCost;
  }

  #calculateTotalSeats(ticketInfo: TicketInfo) {
    return ticketInfo.ticketCounts.ADULT + ticketInfo.ticketCounts.CHILD;
  }
}
