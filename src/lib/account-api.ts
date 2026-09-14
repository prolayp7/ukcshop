"use client";

import { request, requestRaw } from "./storefront-client";

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
  subtotal: string;
  status: string;
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
  email: string;
  status: string;
  paymentStatus: string;
  shippingFullName: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingPostcode: string;
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

export function checkout(input: CheckoutInput): Promise<Order> {
  return request("orders", { method: "POST", body: JSON.stringify(input) });
}
export async function listOrders(page = 1): Promise<{ items: Order[]; meta: { page: number; perPage: number; total: number; totalPages: number } }> {
  const { data, meta } = await requestRaw<Order[]>(`orders?page=${page}`);
  return { items: data, meta: meta as { page: number; perPage: number; total: number; totalPages: number } };
}
export function getOrder(uuid: string): Promise<Order> {
  return request(`orders/${encodeURIComponent(uuid)}`);
}
