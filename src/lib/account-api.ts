"use client";

import { request, requestRaw, requestBlob } from "./storefront-client";

export interface Address {
  id: number;
  label: string | null;
  fullName: string;
  companyName: string | null;
  line1: string;
  line2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  country: string;
  phone: string | null;
  addressType: "BILLING" | "SHIPPING" | "BOTH";
  isDefault: boolean;
}
export type AddressInput = Omit<Address, "id">;

export function listAddresses(): Promise<Address[]> {
  return request("addresses");
}
export function createAddress(input: Partial<AddressInput>): Promise<Address> {
  return request("addresses", { method: "POST", body: JSON.stringify(input) });
}
export function updateAddress(id: number, input: Partial<AddressInput>): Promise<Address> {
  return request(`addresses/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}
export function deleteAddress(id: number): Promise<void> {
  return request(`addresses/${id}`, { method: "DELETE" });
}

export interface ShippingQuote {
  id: number;
  title: string;
  carrier: string;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  rate: number;
}
export function listShippingMethods(): Promise<ShippingQuote[]> {
  return request("shipping-methods");
}

export interface CheckoutAddress {
  fullName: string;
  companyName?: string;
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country?: string;
  phone?: string;
}
export interface CheckoutInput {
  email?: string;
  phone?: string;
  shippingAddress: CheckoutAddress;
  billingAddress?: CheckoutAddress;
  shippingMethodId: number;
  couponCode?: string;
  customerNote?: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  titleSnapshot: string;
  variantTitleSnapshot: string | null;
  quantity: number;
  unitPrice: string;
  discount?: string;
  vatRatePercent?: string;
  vatAmount?: string;
  skuSnapshot?: string | null;
  subtotal: string;
  status: string;
  returnEligible: boolean;
  returnDeadline: string | null;
  returnItems?: { quantity: number; approvedQuantity: number | null; receivedQuantity: number | null; acceptedQuantity: number | null; inspectionResult: string | null; returnRequest: { returnNumber: string; status: ReturnStatus } }[];
}
export interface ShipmentEvent {
  id: number;
  status: string;
  description: string | null;
  location: string | null;
  occurredAt: string;
}
export interface Shipment {
  id: number;
  carrier: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: string;
  estimatedDeliveryAt: string | null;
  deliveredAt: string | null;
  events: ShipmentEvent[];
}
export interface Order {
  id: number;
  uuid: string;
  orderNumber: string;
  invoice?: { invoiceNumber: string; issuedAt: string } | null;
  email: string;
  status: string;
  paymentStatus: string;
  shippingFullName: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingPostcode: string;
  billingCompanyName?: string | null;
  billingFullName?: string;
  billingLine1?: string;
  billingLine2?: string | null;
  billingCity?: string;
  billingPostcode?: string;
  subtotal: string;
  discountTotal: string;
  shippingCharge: string;
  vatTotal: string;
  total: string;
  couponCode: string | null;
  placedAt: string;
  items: OrderItem[];
  shippingMethod?: { id: number; title: string; carrier: string } | null;
  shipments?: Shipment[];
}

export function checkout(input: CheckoutInput, idempotencyKey?: string): Promise<Order> {
  return request("orders", { method: "POST", body: JSON.stringify(input), headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined });
}
export async function listOrders(page = 1): Promise<{ items: Order[]; meta: { page: number; perPage: number; total: number; totalPages: number } }> {
  const { data, meta } = await requestRaw<Order[]>(`orders?page=${page}`);
  return { items: data, meta: meta as { page: number; perPage: number; total: number; totalPages: number } };
}
export function getOrder(uuid: string): Promise<Order> {
  return request(`orders/${encodeURIComponent(uuid)}`);
}
export function downloadInvoice(uuid: string): Promise<Blob> {
  return requestBlob(`orders/${encodeURIComponent(uuid)}/invoice`);
}
export function cancelOrder(uuid: string, reason?: string): Promise<Order> {
  return request(`orders/${encodeURIComponent(uuid)}/cancel`, { method: "PATCH", body: JSON.stringify({ reason }) });
}
// ---- Returns (order-item level: partial quantities, several returns per order) ----

export type ReturnStatus = "RETURN_REQUESTED" | "RETURN_APPROVED" | "RETURN_REJECTED" | "PICKUP_SCHEDULED" | "PICKED_UP" | "RETURN_RECEIVED" | "INSPECTION" | "REFUND_APPROVED" | "REFUND_PROCESSING" | "COMPLETED" | "CANCELLED";
export type ReturnReason = "DAMAGED" | "DEFECTIVE" | "WRONG_ITEM" | "MISSING_PARTS" | "NOT_AS_DESCRIBED" | "POOR_CONDITION" | "CHANGED_MIND" | "OTHER";

export interface ReturnAddress { fullName: string; line1: string; line2: string | null; city: string; county: string | null; postcode: string; phone: string | null }
export interface ReturnableItem {
  orderItemId: number; title: string; variant: string; sku: string | null; productId: number;
  ordered: number; delivered: number; previouslyReturned: number; returnable: number;
  eligible: boolean; reason: string | null; returnDeadline: string | null; unitRefund: number;
}
export interface ReturnableOrder {
  order: { uuid: string; orderNumber: string; status: string };
  deliveryAddress: ReturnAddress;
  savedAddresses: (ReturnAddress & { id: number; label: string | null })[];
  reasons: { value: ReturnReason; label: string }[];
  items: ReturnableItem[];
}
export interface ReturnItemView {
  id: number; orderItemId: number; title: string; variant: string; sku: string | null; productId: number;
  orderedQuantity: number; quantity: number; approvedQuantity: number | null; receivedQuantity: number | null; acceptedQuantity: number | null;
  reason: ReturnReason; reasonLabel: string; reasonOther: string | null; description: string | null;
  inspectionResult: "ACCEPTED" | "PARTIALLY_ACCEPTED" | "REJECTED" | null; inspectionRejectionReason: string | null;
  deductionAmount: number; deductionReason: string | null; refundAmount: number; refundIsFinal: boolean; imageIds: number[];
}
export interface ReturnView {
  returnNumber: string; status: ReturnStatus; createdAt: string;
  order: { uuid: string; orderNumber: string };
  pickupAddress: ReturnAddress;
  pickup: { courier: string | null; date: string | null; window: string | null; trackingNumber: string | null } | null;
  rejectionReason: string | null;
  items: ReturnItemView[];
  shippingRefund: number; refundTotal: number;
  refunds: { amount: number; status: "PENDING" | "PROCESSING" | "PROCESSED" | "FAILED" | "CANCELLED"; providerRefundId: string | null; method: string; processedAt: string | null; createdAt: string }[];
  events: { status: ReturnStatus | null; action: string; note: string | null; createdAt: string }[];
  estimatedRefund?: number;
}
export interface NewReturnItem { orderItemId: number; quantity: number; reason: ReturnReason; reasonOther?: string; description?: string; photos: File[] }

export function getReturnable(orderUuid: string): Promise<ReturnableOrder> {
  return request(`returns/orders/${encodeURIComponent(orderUuid)}`);
}
/** One multipart request: the details as JSON plus each item's photos as evidence_<index>. */
export function createReturn(input: { orderUuid: string; addressId?: number; items: NewReturnItem[] }): Promise<ReturnView> {
  const form = new FormData();
  form.append("data", JSON.stringify({
    orderUuid: input.orderUuid,
    ...(input.addressId ? { addressId: input.addressId } : {}),
    items: input.items.map((item) => ({ orderItemId: item.orderItemId, quantity: item.quantity, reason: item.reason, reasonOther: item.reasonOther, description: item.description })),
  }));
  input.items.forEach((item, index) => item.photos.forEach((photo) => form.append(`evidence_${index}`, photo, photo.name)));
  return request("returns", { method: "POST", body: form });
}
export function listReturns(): Promise<ReturnView[]> {
  return request("returns");
}
export function getReturn(returnNumber: string): Promise<ReturnView> {
  return request(`returns/${encodeURIComponent(returnNumber)}`);
}
export function cancelReturn(returnNumber: string): Promise<ReturnView> {
  return request(`returns/${encodeURIComponent(returnNumber)}/cancel`, { method: "POST" });
}
/** Evidence photos are private, so they are fetched with the customer's credentials, not as plain URLs. */
export function returnImage(returnNumber: string, imageId: number): Promise<Blob> {
  return requestBlob(`returns/${encodeURIComponent(returnNumber)}/images/${imageId}`);
}
