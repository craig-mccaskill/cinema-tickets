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
    // throws InvalidPurchaseException
  }
}
