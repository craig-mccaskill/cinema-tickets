import { v4 as uuidv4 } from 'uuid';
import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js'
import { MAX_TICKETS, TICKET_PRICES, MAX_INFANTS_PER_ADULT } from './lib/constants.js';
import logger from './lib/logger-config.js';


export default class TicketService {
  
  constructor() {
    this.ticketPaymentService = new TicketPaymentService();
    this.seatReservationService = new SeatReservationService();
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {
    // Generate transaction ID
    const transactionId = uuidv4();

    this.#validateAccountId(accountId, transactionId);
    const ticketInfo = this.#validateTicketRequest(ticketTypeRequests, transactionId)
    const totalTicketCost = this.#calculateTicketDetails(ticketInfo, transactionId);
    const totalSeatCount = this.#calculateTotalSeats(ticketInfo, transactionId);

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

  #validateAccountId(accountId, transactionId) {
    if (!Number.isInteger(accountId || accountId <= 0)){
      logger.error(`Transaction ID: ${transactionId} - Invalid account ID: ${accountId}`);
      throw new InvalidPurchaseException;
    }
  }

  #validateTicketRequest(ticketTypeRequest, transactionId) {
    if (!ticketTypeRequest || ticketTypeRequest.length === 0) {
      logger.error(`Transaction ID: ${transactionId} - No tickets requested`);
      throw new InvalidPurchaseException;
    }

    const ticketCounts = { ADULT: 0, CHILD: 0, INFANT: 0 };
    // count ticket by type
    ticketTypeRequest.forEach((request) => {
      if (!request.getTicketType()) {
        logger.error(`Transaction ID: ${transactionId} - Invalid ticket request format`);
        throw new InvalidPurchaseException;
      }
      ticketCounts[request.getTicketType()] += request.getNoOfTickets();
    });

    // check tickets against business rules
    this.#validatePurchaseRules(ticketCounts, transactionId);

    const totalTickets = Object.values(ticketCounts).reduce((sum, count) => sum + count, 0);

    if (totalTickets > MAX_TICKETS) {
      logger.error(`Transaction ID: ${transactionId} - Exceeded max tickets - tickets requested: ${totalTickets}`);
      throw new InvalidPurchaseException;
    }

    return { ticketCounts, totalTickets };
  }

  #validatePurchaseRules(tickets, transactionId) {
    const adults = tickets.ADULT || 0;
    const children = tickets.CHILD || 0;
    const infants = tickets.INFANT || 0;

    // check if adult ticket present and includes child/infant
    if (adults === 0 && (children > 0 || infants > 0)) {
      logger.error(`Transaction ID: ${transactionId} - Adult ticket required`);
      throw new InvalidPurchaseException;
    }

    // check if more infants than adults - 
    if (infants > adults) {
      logger.error(`Transaction ID: ${transactionId} - Infants cannot exceed amount of adults`);
      throw new InvalidPurchaseException;
    }
  }

  #calculateTicketDetails(ticketRequests) {
    let totalCost = 0;

    for (const [ticketType, count] of Object.entries(ticketRequests.ticketCounts)) {
      totalCost += count * (TICKET_PRICES[ticketType] || 0);
    }

    return totalCost;
  }

  #calculateTotalSeats(ticketInfo) {
    return ticketInfo.ticketCounts.ADULT + ticketInfo.ticketCounts.CHILD;
  }
}
