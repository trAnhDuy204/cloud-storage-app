'use client';
import { Suspense } from 'react';
import PaymentSuccess from '../../components/PaymentSuccess';

export default function AdminPage() {
  return (
    <Suspense fallback={<div>Đang xử lý thanh toán...</div>}>
      <PaymentSuccess />
    </Suspense>);
}