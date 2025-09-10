import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';

import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js'
import { MAX_TICKETS, TICKET_PRICES, MAX_INFANTS_PER_ADULT } from './lib/constants.js';

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */
  
  constructor() {
    this.ticketPaymentService = new TicketPaymentService();
    this.seatReservationService = new SeatReservationService();
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.#validateAccountId(accountId);
    const ticketInfo = this.#validateTicketRequest(ticketTypeRequests)
    const totalTicketCost = this.#calculateTicketDetails(ticketInfo);
    const totalSeatCount = this.#calculateTotalSeats(ticketInfo);

    // Complete ticket request payment / seat reservation
    this.ticketPaymentService.makePayment(accountId, totalTicketCost);
    this.seatReservationService.reserveSeat(accountId, totalSeatCount);

    return {
      success: true,
      totalCost: totalTicketCost,
      totalSeats: totalSeatCount
    }
  }

  #validateAccountId(accountId) {
    if (!Number.isInteger(accountId || accountId <= 0)){
      throw new InvalidPurchaseException;
    }
  }

  #validateTicketRequest(ticketTypeRequest) {
    if (!ticketTypeRequest || ticketTypeRequest.length === 0) {
      throw new InvalidPurchaseException;
    }

    const ticketCounts = { ADULT: 0, CHILD: 0, INFANT: 0 };
    // count ticket by type
    ticketTypeRequest.forEach((request) => {
      if (!request.getTicketType()) {
        throw new InvalidPurchaseException;
      }
      ticketCounts[request.getTicketType()] += request.getNoOfTickets();
    });

    this.#validatePurchaseRules(ticketCounts);

    const totalTickets = Object.values(ticketCounts).reduce((sum, count) => sum + count, 0);

    if (totalTickets > MAX_TICKETS) {
      throw new InvalidPurchaseException;
    }

    return { ticketCounts, totalTickets };
  }

  #validatePurchaseRules(tickets) {
    const adults = tickets.ADULT || 0;
    const children = tickets.CHILD || 0;
    const infants = tickets.INFANT || 0;

    if (adults === 0 && (children > 0 || infants > 0)) {
      throw new InvalidPurchaseException;
    }

    if (infants > adults) {
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
