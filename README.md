# Cinema ticket service 

Coding excercise for a cinema booking system

# Business rules 
- Ticket types
    - Infant - £0
    - Child - £15
    - Adult - £25

- Max tickets - 25 tickets

- Infants do not get a seat, they will sit on adult's lap, they will also not pay for a ticket
- An adult ticket is required, (Child and infant tickets cannot be purchased without an adult ticket)
- Using existing ticket payment and seat reservation services but TicketService allows other services to be injected in, if no dependency injected then it will fallback to default third party services.

# Requirements

- Node.js >= v22.19.0

# How to run

Install dependencies

```shell
npm install
```

Run tests (this will include code coverage report which can be accessed in ./coverage) via Jest

```shell
npm run test
```

Run linting check

```shell
npm run lint
```

# logs

Info and error logs can be viewed from ./logs directory which will log test cases
