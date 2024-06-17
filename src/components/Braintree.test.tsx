import type { Dropin } from "braintree-web-drop-in"

import { act, render, waitFor } from "@testing-library/react"

import { create } from "braintree-web-drop-in"

import React from "react"

import "@testing-library/jest-dom"

import { vi, describe, MockedFunction } from "vitest"
import Braintree from "./Braintree"

vi.mock("braintree-web-drop-in")

const createMockedDropIn = (overrides?: Partial<Dropin>): Dropin => {
  const defaultDropIn: Dropin = {
    requestPaymentMethod: vi.fn().mockImplementation(() =>
      Promise.resolve({
        nonce: "mockNonce",
        deviceData: "mockDeviceData",
        type: "CreditCard",
        liabilityShifted: true,
      }),
    ),
    teardown: vi.fn(),
    clearSelectedPaymentMethod: vi.fn(),
    isPaymentMethodRequestable: vi.fn().mockReturnValue(true),
    updateConfiguration: vi.fn(),
    on: vi.fn() as any,
    off: vi.fn() as any,
  }

  return {
    ...defaultDropIn,
    ...overrides,
  }
}

const renderBraintreeComponent = (mockDropInOverrides?: Partial<Dropin>) => {
  const onError = vi.fn()
  const onSuccess = vi.fn()
  const mockedCreate = create as MockedFunction<any>

  const mockDropIn = createMockedDropIn(mockDropInOverrides)

  mockedCreate.mockResolvedValue(mockDropIn)

  render(
    <Braintree
      amount={10}
      onError={onError}
      onSuccess={onSuccess}
      options={{
        authorization: "mockToken",
        container: "#dropin-container",
        dataCollector: true,
      }}
    />,
  )

  return { onError, onSuccess, mockDropIn, mockedCreate }
}

describe("When the Braintree DropIn UI loads:", () => {
  test("If we have a requestable payment method, then we should try to request a payment method", async () => {
    const { mockDropIn, mockedCreate, onSuccess } = renderBraintreeComponent()

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(mockDropIn.requestPaymentMethod).toHaveBeenCalled()
    })

    expect(onSuccess).toHaveBeenCalledWith({
      nonce: "mockNonce",
      deviceData: "mockDeviceData",
      type: "CreditCard",
      liabilityShifted: true,
    })
  })

  test(`If we don't have a requestable payment method, we shouldn't try to request a payment method`, async () => {
    const { onSuccess, mockDropIn } = renderBraintreeComponent({
      isPaymentMethodRequestable: () => false,
    })

    await waitFor(() => {
      expect(create).toHaveBeenCalled()
    })

    expect(onSuccess).not.toHaveBeenCalled()

    expect(mockDropIn.requestPaymentMethod).not.toHaveBeenCalled()
  })

  test(`If a 'paymentMethodRequestable' event is fired, it should trigger us to request a payment method`, async () => {
    const onEventCaptureFunc = vi.fn()

    const { mockDropIn, onSuccess, mockedCreate } = renderBraintreeComponent({
      on: onEventCaptureFunc,
      isPaymentMethodRequestable: () => false,
    })

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalled()
    })

    const callback = onEventCaptureFunc.mock.calls[0][1]

    act(() => {
      callback()
    })

    await waitFor(() => {
      expect(mockDropIn.requestPaymentMethod).toHaveBeenCalled()
    })

    expect(onSuccess).toHaveBeenCalledWith({
      nonce: "mockNonce",
      deviceData: "mockDeviceData",
      type: "CreditCard",
      liabilityShifted: true,
    })
  })

  it("displays an error message when Braintree Drop-In has an error", async () => {
    const mockError = new Error("Bad Error")

    const { onError, mockedCreate } = renderBraintreeComponent({
      requestPaymentMethod: vi.fn().mockRejectedValue(mockError),
    })

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalled()
    })

    expect(onError).toHaveBeenCalledWith(mockError)
  })

  it("should trigger an error if the liability is not shifted", async () => {
    const { mockDropIn, onSuccess, onError } = renderBraintreeComponent({
      requestPaymentMethod: vi.fn().mockImplementation(() =>
        Promise.resolve({
          nonce: "mockNonce",
          deviceData: "mockDeviceData",
          type: "CreditCard",
          liabilityShifted: false,
        }),
      ),
    })

    await waitFor(() => {
      expect(mockDropIn.requestPaymentMethod).toHaveBeenCalled()
    })

    expect(onSuccess).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith("Liability not shifted")
  })
})
