# Next-Playwright-Mock-Dependencies

This repository is a POC for mocking out dependencies using Playwright with Next.js.

## The Problem

We've recently been experiencing issues with our tests that interact with Braintree. The reliance on Braintree causes are tests to be flaky and slow. This goes for other third-party services too, but Braintree has been the main culprit.

Regardless of the issues, we ideally want to test our application in isolation without the need to depend on 'real' dependencies.

## The Goal

The goal is to mock out Braintree when running our Playwright tests. What does 'mock' mean in this context? It means that we want to simulate the behaviour of Braintree without actually interacting with the real Braintree. Taking a payment in the mocked version should simply be a case of clicking a button 'Take Mock Payment'.

Taking this approach allows us to test our application in isolation without the need to depend on Braintree reducing the flakiness and speeding up our tests.

## The Solution

We take a MOTO (Mock outside, test outside) approach to test our application. We take advantage of Playwright's ![global setup](https://playwright.dev/docs/test-global-setup-teardown#option-2-configure-globalsetup-and-globalteardown) feature, which allows us to run setup before any tests are run.

In our case, we copy our apps files to a temporary directory modify the necessary files to mock out our dependencies. Run a build against this version of the app. And finally, run our tests against this build.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine.

### Prerequisites

- Node.js
- npm

### Cloning the Repository

To clone the repository, run the following command in your terminal:

```sh
git clone https://github.com/Nhollas/next-playwright-mock-dependencies.git
```

## Setting Up The Project

1. Navigate to the project directory:

```bash
cd next-playwright-mock-dependencies
```

2. Install Dependencies:

```bash
npm install
```

3. Setup environment variables:

**copy the `.env.example` file to a new file called `.env.local`.**

```bash
copy .env.example .env.local
```

Replace the Braintree values, they can be found under your specific project here:

https://app.launchdarkly.com/settings/projects

## Run Development Server

Finally, run the development server:

```bash
npm run dev
```

Now you can open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Running Tests

To run the tests, run the following command:

```bash
npx playwright test
```
